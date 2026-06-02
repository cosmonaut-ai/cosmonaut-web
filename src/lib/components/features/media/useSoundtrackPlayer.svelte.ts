import type { PlaylistTrack } from '$lib/types/api';

const CROSSFADE_DURATION_MS = 3000;
const CROSSFADE_LEAD_SECONDS = 3;

interface SoundtrackElements {
	a: HTMLAudioElement;
	b: HTMLAudioElement;
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
	let targetVolume = $state(0.3);
	let muted = $state(false);

	let elements: SoundtrackElements | null = null;
	let activeSlot: 'a' | 'b' = 'a';
	let crossfadeRafId: number | null = null;
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
		return muted ? 0 : targetVolume;
	}

	function applyVolumeToElements() {
		if (!elements) return;

		const volume = effectiveVolume();
		const active = activeEl();
		const idle = idleEl();

		if (crossfading) {
			if (active) active.volume = Math.max(0, volume * (1 - crossfadeProgress));
			if (idle) idle.volume = volume * crossfadeProgress;
			return;
		}

		if (active) active.volume = volume;
		if (idle) idle.volume = 0;
	}

	function nextIndex(): number {
		return (currentIndex + 1) % tracks.length;
	}

	function cancelCrossfade() {
		if (crossfadeRafId !== null) {
			cancelAnimationFrame(crossfadeRafId);
			crossfadeRafId = null;
		}
		crossfading = false;
		crossfadeProgress = 0;
		applyVolumeToElements();
	}

	function handleTimeUpdate() {
		const el = activeEl();
		if (!el || crossfading || tracks.length < 1) return;

		const remaining = el.duration - el.currentTime;
		if (isFinite(remaining) && remaining <= CROSSFADE_LEAD_SECONDS && remaining > 0) {
			startCrossfade();
		}
	}

	function handleEnded() {
		if (crossfading) return;
		advanceTrack();
	}

	function startCrossfade() {
		if (crossfading || tracks.length < 1) return;
		crossfading = true;

		const next = nextIndex();
		const idle = idleEl();
		const active = activeEl();
		if (!idle || !active) {
			crossfading = false;
			return;
		}

		const nextTrack = tracks[next];
		if (!nextTrack?.audio_url) {
			crossfading = false;
			advanceTrack();
			return;
		}

		idle.src = nextTrack.audio_url;
		idle.volume = 0;
		idle.load();

		const startFade = () => {
			idle.play().catch(() => {});

			const fadeActive = active;
			const start = performance.now();
			function tick(now: number) {
				const elapsed = now - start;
				const progress = Math.min(elapsed / CROSSFADE_DURATION_MS, 1);

				crossfadeProgress = progress;
				applyVolumeToElements();

				if (progress < 1) {
					crossfadeRafId = requestAnimationFrame(tick);
				} else {
					fadeActive.pause();
					fadeActive.removeAttribute('src');
					fadeActive.load();
					activeSlot = activeSlot === 'a' ? 'b' : 'a';
					currentIndex = next;
					crossfading = false;
					crossfadeProgress = 0;
					crossfadeRafId = null;
					applyVolumeToElements();
				}
			}

			crossfadeRafId = requestAnimationFrame(tick);
		};

		if (idle.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
			startFade();
		} else {
			idle.addEventListener('canplay', startFade, { once: true });
			idle.addEventListener(
				'error',
				() => {
					crossfading = false;
					advanceTrack();
				},
				{ once: true }
			);
		}
	}

	function advanceTrack() {
		cancelCrossfade();
		const next = nextIndex();
		currentIndex = next;

		const el = activeEl();
		const track = tracks[next];
		if (!el || !track?.audio_url) return;

		el.src = track.audio_url;
		el.volume = effectiveVolume();
		el.load();

		const play = () => {
			el.play().catch(() => {});
		};

		if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
			play();
		} else {
			el.addEventListener('canplay', play, { once: true });
		}
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
		if (elements) {
			elements.a.removeEventListener('timeupdate', handleTimeUpdate);
			elements.b.removeEventListener('timeupdate', handleTimeUpdate);
			elements.a.removeEventListener('ended', handleEnded);
			elements.b.removeEventListener('ended', handleEnded);
		}
		elements = null;
	}

	function start(playlist: PlaylistTrack[]) {
		const playable = playlist.filter((t) => !!t.audio_url);
		if (playable.length === 0) return;

		cancelCrossfade();
		tracks = playable;
		currentIndex = 0;
		playing = true;

		const el = activeEl();
		const first = playable[0];
		if (!el || !first.audio_url) return;

		el.src = first.audio_url;
		el.volume = effectiveVolume();
		el.load();

		const play = () => {
			el.play().catch(() => {});
		};

		if (el.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
			play();
		} else {
			el.addEventListener('canplay', play, { once: true });
		}
	}

	function stop() {
		cancelCrossfade();
		playing = false;
		if (elements) {
			elements.a.pause();
			elements.b.pause();
			elements.a.removeAttribute('src');
			elements.b.removeAttribute('src');
			elements.a.load();
			elements.b.load();
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
		activeEl()?.pause();
		idleEl()?.pause();
	}

	function resume() {
		if (!playing || tracks.length === 0) return;
		const el = activeEl();
		if (el && el.src) {
			el.play().catch(() => {});
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
