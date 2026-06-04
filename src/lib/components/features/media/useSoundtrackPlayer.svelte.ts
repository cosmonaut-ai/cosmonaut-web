import type { PlaylistTrack } from '$lib/types/api';
import {
	applyMediaVolume,
	mediaGain,
	resumeMediaVolumeContext,
	SOUNDTRACK_GAIN_BASELINE
} from '$lib/utils/mediaVolume';

const PRELOAD_LEAD_SECONDS = 18;
const CROSSFADE_LEAD_SECONDS = 8;
const CROSSFADE_DURATION_MS = 6500;
const MIN_CROSSFADE_DURATION_MS = 1200;
const CROSSFADE_END_BUFFER_MS = 400;

interface SoundtrackElements {
	a: HTMLAudioElement;
	b: HTMLAudioElement;
}

interface StartOptions {
	autoplay?: boolean;
}

/**
 * A/B ping-pong crossfade engine for seamless playlist playback.
 *
 * Manages two audio elements. When the active element nears its end,
 * the idle element preloads the next track and a volume crossfade begins.
 * After fading completes the roles swap. Loops the playlist by default.
 */
export function useSoundtrackPlayer() {
	let tracks = $state<PlaylistTrack[]>([]);
	let currentIndex = $state(0);
	let playing = $state(false);
	let targetVolume = $state(1);
	let muted = $state(false);
	let shouldPlay = false;

	let elements: SoundtrackElements | null = null;
	let activeSlot: 'a' | 'b' = 'a';
	let crossfadeRafId: number | null = null;
	let transitionRequestId = 0;
	let prepareRequestId = 0;
	let preparedNextIndex: number | null = null;
	let preparingNextIndex: number | null = null;
	let prepareNextPromise: Promise<boolean> | null = null;
	let crossfadePending = false;
	let crossfading = false;
	let crossfadeProgress = 0;

	function activeEl(): HTMLAudioElement | null {
		return elements ? elements[activeSlot] : null;
	}

	function idleEl(): HTMLAudioElement | null {
		if (!elements) return null;
		return activeSlot === 'a' ? elements.b : elements.a;
	}

	function effectiveVolume(): number {
		return muted ? 0 : mediaGain(targetVolume, SOUNDTRACK_GAIN_BASELINE);
	}

	function crossfadeVolumes(progress: number) {
		const clamped = Math.min(1, Math.max(0, progress));
		return {
			active: Math.cos(clamped * (Math.PI / 2)),
			idle: Math.sin(clamped * (Math.PI / 2))
		};
	}

	function applyVolumeToElements() {
		if (!elements) return;

		const volume = effectiveVolume();
		const active = activeEl();
		const idle = idleEl();

		if (crossfading) {
			const fade = crossfadeVolumes(crossfadeProgress);
			applyMediaVolume(active, volume * fade.active);
			applyMediaVolume(idle, volume * fade.idle);
			return;
		}

		applyMediaVolume(active, volume);
		applyMediaVolume(idle, 0);
	}

	function nextIndex(): number {
		return (currentIndex + 1) % tracks.length;
	}

	function trackDurationSeconds(element: HTMLAudioElement): number | null {
		if (Number.isFinite(element.duration) && element.duration > 0) return element.duration;

		const declaredDuration = tracks[currentIndex]?.duration_seconds;
		if (Number.isFinite(declaredDuration) && declaredDuration && declaredDuration > 0) {
			return declaredDuration;
		}

		return null;
	}

	function remainingSeconds(element: HTMLAudioElement): number | null {
		const duration = trackDurationSeconds(element);
		if (duration === null) return null;
		return duration - element.currentTime;
	}

	function crossfadeDurationMs(element: HTMLAudioElement): number {
		const remaining = remainingSeconds(element);
		if (remaining === null) return CROSSFADE_DURATION_MS;

		const available = Math.max(0, remaining * 1000 - CROSSFADE_END_BUFFER_MS);
		if (available <= MIN_CROSSFADE_DURATION_MS) return available;
		return Math.min(CROSSFADE_DURATION_MS, available);
	}

	function clearAudioSource(element: HTMLAudioElement | null) {
		if (!element) return;
		element.pause();
		element.removeAttribute('src');
		element.load();
	}

	function playIfAllowed(element: HTMLAudioElement | null, expectedSrc?: string) {
		if (!element || !shouldPlay) return;
		if (expectedSrc && element.getAttribute('src') !== expectedSrc) return;

		resumeMediaVolumeContext();
		element.play().catch(() => {});
	}

	function playWhenReady(element: HTMLAudioElement, expectedSrc: string) {
		const play = () => playIfAllowed(element, expectedSrc);

		if (element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
			play();
		} else {
			element.addEventListener('canplay', play, { once: true });
		}
	}

	function resetPreparedNextTrack() {
		prepareRequestId += 1;
		preparedNextIndex = null;
		preparingNextIndex = null;
		prepareNextPromise = null;
	}

	function cancelCrossfade({ keepPrepared = false }: { keepPrepared?: boolean } = {}) {
		transitionRequestId += 1;
		if (crossfadeRafId !== null) {
			cancelAnimationFrame(crossfadeRafId);
			crossfadeRafId = null;
		}
		crossfadePending = false;
		crossfading = false;
		crossfadeProgress = 0;
		if (!keepPrepared) resetPreparedNextTrack();
		applyVolumeToElements();
	}

	function handleTimeUpdate() {
		const el = activeEl();
		if (!el || !shouldPlay || crossfadePending || crossfading || tracks.length < 1) return;

		const remaining = remainingSeconds(el);
		if (remaining === null || remaining <= 0) return;

		if (remaining <= PRELOAD_LEAD_SECONDS) {
			void prepareNextTrack();
		}
		if (remaining <= CROSSFADE_LEAD_SECONDS) {
			void startCrossfade();
		}
	}

	function handleEnded() {
		if (!shouldPlay) return;
		if (crossfading) return;
		advanceTrack();
	}

	function waitForPlayable(element: HTMLAudioElement, requestId: number): Promise<boolean> {
		if (element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
			return Promise.resolve(true);
		}

		return new Promise((resolve) => {
			let settled = false;
			const cleanup = () => {
				element.removeEventListener('canplay', handleReady);
				element.removeEventListener('loadeddata', handleReady);
				element.removeEventListener('error', handleError);
			};
			const settle = (ready: boolean) => {
				if (settled) return;
				settled = true;
				cleanup();
				resolve(requestId === prepareRequestId && ready);
			};
			const handleReady = () => settle(true);
			const handleError = () => settle(false);

			element.addEventListener('canplay', handleReady, { once: true });
			element.addEventListener('loadeddata', handleReady, { once: true });
			element.addEventListener('error', handleError, { once: true });
		});
	}

	function prepareNextTrack(): Promise<boolean> {
		if (tracks.length < 1) return Promise.resolve(false);
		const next = nextIndex();
		const idle = idleEl();
		const nextTrack = tracks[next];
		if (!idle || !nextTrack?.audio_url) return Promise.resolve(false);

		if (
			preparedNextIndex === next &&
			idle.getAttribute('src') === nextTrack.audio_url &&
			idle.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
		) {
			return Promise.resolve(true);
		}

		if (preparingNextIndex === next && prepareNextPromise) {
			return prepareNextPromise;
		}

		const requestId = ++prepareRequestId;
		preparingNextIndex = next;
		preparedNextIndex = null;
		idle.crossOrigin = 'anonymous';
		idle.preload = 'auto';
		applyMediaVolume(idle, 0);

		if (idle.getAttribute('src') !== nextTrack.audio_url) {
			idle.pause();
			idle.src = nextTrack.audio_url;
			idle.load();
		} else if (idle.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
			idle.load();
		}

		prepareNextPromise = waitForPlayable(idle, requestId).then((ready) => {
			const stillCurrent =
				requestId === prepareRequestId &&
				next === nextIndex() &&
				idle === idleEl() &&
				idle.getAttribute('src') === nextTrack.audio_url;

			if (requestId === prepareRequestId) {
				preparingNextIndex = null;
				prepareNextPromise = null;
			}
			if (ready && stillCurrent) {
				preparedNextIndex = next;
			}

			return ready && stillCurrent;
		});

		return prepareNextPromise;
	}

	function finishCrossfade(previousActive: HTMLAudioElement, next: number) {
		clearAudioSource(previousActive);
		activeSlot = activeSlot === 'a' ? 'b' : 'a';
		currentIndex = next;
		crossfading = false;
		crossfadeProgress = 0;
		crossfadeRafId = null;
		resetPreparedNextTrack();
		applyVolumeToElements();
	}

	async function startCrossfade() {
		if (!shouldPlay || crossfadePending || crossfading || tracks.length < 1) return;

		const next = nextIndex();
		const active = activeEl();
		const idle = idleEl();
		if (!idle || !active) return;

		crossfadePending = true;
		const requestId = ++transitionRequestId;
		const ready = await prepareNextTrack();
		if (requestId !== transitionRequestId || !crossfadePending) return;
		if (!shouldPlay) {
			crossfadePending = false;
			applyVolumeToElements();
			return;
		}

		const remaining = remainingSeconds(active);
		if (!ready || active.ended || (remaining !== null && remaining <= 0)) {
			crossfadePending = false;
			advanceTrack();
			return;
		}

		try {
			resumeMediaVolumeContext();
			await idle.play();
		} catch {
			if (requestId === transitionRequestId) {
				crossfadePending = false;
				applyVolumeToElements();
			}
			return;
		}

		if (requestId !== transitionRequestId || !crossfadePending) return;
		if (!shouldPlay) {
			idle.pause();
			crossfadePending = false;
			applyVolumeToElements();
			return;
		}

		crossfadePending = false;
		crossfading = true;
		crossfadeProgress = 0;

		const fadeActive = active;
		const durationMs = crossfadeDurationMs(active);
		if (durationMs <= 0) {
			finishCrossfade(fadeActive, next);
			return;
		}

		const start = performance.now();
		function tick(now: number) {
			if (requestId !== transitionRequestId || !crossfading) return;

			const elapsed = now - start;
			const progress = Math.min(elapsed / durationMs, 1);

			crossfadeProgress = progress;
			applyVolumeToElements();

			if (progress < 1) {
				crossfadeRafId = requestAnimationFrame(tick);
			} else {
				finishCrossfade(fadeActive, next);
			}
		}

		crossfadeRafId = requestAnimationFrame(tick);
	}

	function advanceTrack() {
		if (tracks.length < 1) return;

		cancelCrossfade({ keepPrepared: true });
		const next = nextIndex();
		const track = tracks[next];

		const preparedIdle = idleEl();
		const previousActive = activeEl();
		if (
			preparedIdle &&
			track?.audio_url &&
			preparedNextIndex === next &&
			preparedIdle.getAttribute('src') === track.audio_url
		) {
			clearAudioSource(previousActive);
			activeSlot = activeSlot === 'a' ? 'b' : 'a';
			currentIndex = next;
			resetPreparedNextTrack();
			applyVolumeToElements();
			playIfAllowed(activeEl(), track.audio_url);
			return;
		}

		resetPreparedNextTrack();
		currentIndex = next;

		const el = activeEl();
		if (!el || !track?.audio_url) return;

		el.crossOrigin = 'anonymous';
		el.src = track.audio_url;
		applyMediaVolume(el, effectiveVolume());
		el.load();
		playWhenReady(el, track.audio_url);
	}

	function bindElements(a: HTMLAudioElement, b: HTMLAudioElement) {
		elements = { a, b };
		applyVolumeToElements();
		a.addEventListener('timeupdate', handleTimeUpdate);
		b.addEventListener('timeupdate', handleTimeUpdate);
		a.addEventListener('ended', handleEnded);
		b.addEventListener('ended', handleEnded);
	}

	function unbindElements() {
		cancelCrossfade();
		if (elements) {
			elements.a.removeEventListener('timeupdate', handleTimeUpdate);
			elements.b.removeEventListener('timeupdate', handleTimeUpdate);
			elements.a.removeEventListener('ended', handleEnded);
			elements.b.removeEventListener('ended', handleEnded);
		}
		elements = null;
	}

	function start(playlist: PlaylistTrack[], options: StartOptions = {}) {
		const { autoplay = true } = options;
		const playable = playlist.filter((t) => !!t.audio_url);
		if (playable.length === 0) return;

		cancelCrossfade();
		tracks = playable;
		currentIndex = 0;
		playing = true;
		shouldPlay = autoplay;
		activeSlot = 'a';

		const el = activeEl();
		const first = playable[0];
		if (!el || !first.audio_url) return;

		el.crossOrigin = 'anonymous';
		el.src = first.audio_url;
		applyMediaVolume(el, effectiveVolume());
		el.load();

		if (autoplay) playWhenReady(el, first.audio_url);
	}

	function stop() {
		shouldPlay = false;
		cancelCrossfade();
		playing = false;
		if (elements) {
			clearAudioSource(elements.a);
			clearAudioSource(elements.b);
		}
	}

	function setVolume(v: number) {
		targetVolume = Math.min(1, Math.max(0, v));
		applyVolumeToElements();
	}

	function setMuted(m: boolean) {
		muted = m;
		applyVolumeToElements();
	}

	function pause() {
		if (!shouldPlay && !crossfadePending && !crossfading) return;
		shouldPlay = false;
		cancelCrossfade();
		activeEl()?.pause();
		idleEl()?.pause();
	}

	function resume() {
		if (!playing || tracks.length === 0) return;
		shouldPlay = true;
		const el = activeEl();
		if (el && el.src) {
			playWhenReady(el, el.getAttribute('src') ?? el.src);
		}
	}

	return {
		get playing() {
			return playing;
		},
		get currentIndex() {
			return currentIndex;
		},
		get tracks() {
			return tracks;
		},
		bindElements,
		unbindElements,
		start,
		stop,
		pause,
		resume,
		setVolume,
		setMuted
	};
}
