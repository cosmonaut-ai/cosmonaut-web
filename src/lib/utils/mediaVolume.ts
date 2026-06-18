const AUDIO_CONTEXT_OPTIONS: AudioContextOptions = { latencyHint: 'interactive' };
export const NARRATION_GAIN_BASELINE = 1;
export const SOUNDTRACK_GAIN_BASELINE = 0.07;

declare global {
	interface Window {
		webkitAudioContext?: typeof AudioContext;
	}
}

let audioContext: AudioContext | null = null;
const mediaGains = new WeakMap<HTMLMediaElement, GainNode>();
const mediaSources = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();

function clampVolume(volume: number): number {
	if (!Number.isFinite(volume)) return 1;
	return Math.min(1, Math.max(0, volume));
}

function getAudioContext(): AudioContext | null {
	if (typeof window === 'undefined') return null;

	const AudioContextCtor = window.AudioContext ?? window.webkitAudioContext;
	if (!AudioContextCtor) return null;

	audioContext ??= new AudioContextCtor(AUDIO_CONTEXT_OPTIONS);
	return audioContext;
}

function ensureGain(element: HTMLMediaElement): GainNode | null {
	const existingGain = mediaGains.get(element);
	if (existingGain) return existingGain;

	const context = getAudioContext();
	if (!context) return null;

	try {
		const source = mediaSources.get(element) ?? context.createMediaElementSource(element);
		const gain = context.createGain();

		source.connect(gain);
		gain.connect(context.destination);
		mediaSources.set(element, source);
		mediaGains.set(element, gain);
		return gain;
	} catch {
		return null;
	}
}

export function resumeMediaVolumeContext() {
	getAudioContext()
		?.resume()
		.catch(() => {});
}

export function mediaGain(userVolume: number, baselineGain = 1): number {
	return clampVolume(userVolume) * clampVolume(baselineGain);
}

export function applyMediaVolume(element: HTMLMediaElement | null, volume: number) {
	if (!element) return;

	const clamped = clampVolume(volume);
	const gain = ensureGain(element);

	if (gain && audioContext) {
		element.muted = false;
		if (typeof element.volume === 'number') {
			element.volume = 1;
		}
		gain.gain.setTargetAtTime(clamped, audioContext.currentTime, 0.015);
		return;
	}
}
