import { getItem, setItem } from '$lib/utils/storage';
import type { Voice } from '$lib/types/api';

const VOICE_KEY = 'cosmonaut-audio-voice';
const SPEED_KEY = 'cosmonaut-audio-speed';
const VOLUME_KEY = 'cosmonaut-audio-volume';
const DEFAULT_VOICE_ID = 'theo';
const VALID_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function loadPersistedSpeed(): number {
	const stored = getItem(SPEED_KEY);
	if (stored) {
		const parsed = parseFloat(stored);
		if (VALID_SPEEDS.includes(parsed)) return parsed;
	}
	return 1;
}

function loadPersistedVolume(): number {
	const stored = getItem(VOLUME_KEY);
	if (stored) {
		const parsed = parseFloat(stored);
		if (isFinite(parsed) && parsed >= 0 && parsed <= 1) return parsed;
	}
	return 1;
}

export function useAudioPlayer() {
	let selectedVoiceId = $state<string | null>(getItem(VOICE_KEY));
	let playbackRate = $state(loadPersistedSpeed());
	let volume = $state(loadPersistedVolume());
	let previousVolume = $state(1);

	let audioElement = $state<HTMLAudioElement | null>(null);
	let currentTime = $state(0);
	let duration = $state(0);
	let paused = $state(true);
	let ended = $state(false);
	let playRequestId = 0;

	$effect(() => {
		if (audioElement) audioElement.playbackRate = playbackRate;
		setItem(SPEED_KEY, String(playbackRate));
	});

	$effect(() => {
		if (audioElement) audioElement.volume = volume;
		setItem(VOLUME_KEY, String(volume));
	});

	function resolveVoiceId(voices: Voice[]): string | null {
		if (selectedVoiceId && voices.some((v) => v.id === selectedVoiceId)) {
			return selectedVoiceId;
		}
		if (voices.some((v) => v.id === DEFAULT_VOICE_ID)) {
			return DEFAULT_VOICE_ID;
		}
		return voices[0]?.id ?? null;
	}

	function selectVoice(voiceId: string) {
		selectedVoiceId = voiceId;
		setItem(VOICE_KEY, voiceId);
	}

	function toggleMute() {
		if (volume > 0) {
			previousVolume = volume;
			volume = 0;
		} else {
			volume = previousVolume > 0 ? previousVolume : 1;
		}
	}

	function handleVolumeChange(e: Event) {
		const target = e.target as HTMLInputElement;
		volume = parseFloat(target.value) / 100;
	}

	function togglePlayPause() {
		if (!audioElement) return;
		if (paused) {
			if (ended) audioElement.currentTime = 0;
			audioElement.play().catch(() => {});
		} else {
			audioElement.pause();
		}
	}

	function handleSeek(e: Event) {
		if (!audioElement) return;
		const target = e.target as HTMLInputElement;
		const nextTime = (parseFloat(target.value) / 100) * duration;
		audioElement.currentTime = nextTime;
		currentTime = nextTime;
		ended = false;
	}

	function waitForPlayable(element: HTMLAudioElement, requestId: number): Promise<boolean> {
		const haveCurrentData =
			typeof HTMLMediaElement === 'undefined' ? 2 : HTMLMediaElement.HAVE_CURRENT_DATA;

		if (element.readyState >= haveCurrentData) return Promise.resolve(true);

		return new Promise((resolve) => {
			let settled = false;
			let timeoutId: ReturnType<typeof setTimeout> | null = null;

			const cleanup = () => {
				element.removeEventListener('canplay', handleReady);
				element.removeEventListener('loadeddata', handleReady);
				element.removeEventListener('error', handleError);
				if (timeoutId) clearTimeout(timeoutId);
			};

			const settle = (ready: boolean) => {
				if (settled) return;
				settled = true;
				cleanup();
				resolve(requestId === playRequestId && element === audioElement && ready);
			};

			const handleReady = () => settle(true);
			const handleError = () => settle(false);

			element.addEventListener('canplay', handleReady, { once: true });
			element.addEventListener('loadeddata', handleReady, { once: true });
			element.addEventListener('error', handleError, { once: true });

			timeoutId = setTimeout(() => {
				settle(true);
			}, 2500);
		});
	}

	async function waitAndPlay(): Promise<boolean> {
		const requestId = ++playRequestId;
		await new Promise((r) => requestAnimationFrame(r));
		await new Promise((r) => requestAnimationFrame(r));

		const element = audioElement;
		if (!element) return false;

		const ready = await waitForPlayable(element, requestId);
		if (!ready || requestId !== playRequestId || element !== audioElement) return false;

		try {
			await element.play();
			return true;
		} catch {
			// Autoplay blocked
			return false;
		}
	}

	function resetPlayback() {
		currentTime = 0;
		duration = 0;
		ended = false;
	}

	function pause() {
		playRequestId += 1;
		audioElement?.pause();
	}

	return {
		get audioElement() {
			return audioElement;
		},
		set audioElement(el: HTMLAudioElement | null) {
			audioElement = el;
		},
		get currentTime() {
			return currentTime;
		},
		set currentTime(t: number) {
			currentTime = t;
		},
		get duration() {
			return duration;
		},
		set duration(d: number) {
			duration = d;
		},
		get paused() {
			return paused;
		},
		set paused(p: boolean) {
			paused = p;
		},
		get ended() {
			return ended;
		},
		set ended(e: boolean) {
			ended = e;
		},
		get playbackRate() {
			return playbackRate;
		},
		set playbackRate(r: number) {
			playbackRate = r;
		},
		get volume() {
			return volume;
		},
		set volume(v: number) {
			volume = v;
		},
		get volumeProgress() {
			return volume * 100;
		},
		resolveVoiceId,
		selectVoice,
		toggleMute,
		handleVolumeChange,
		togglePlayPause,
		handleSeek,
		waitAndPlay,
		resetPlayback,
		pause
	};
}
