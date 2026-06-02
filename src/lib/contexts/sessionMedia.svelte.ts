import { getContext, setContext } from 'svelte';
import type { Voice } from '$lib/types/api';
import { getItem, setItem } from '$lib/utils/storage';

const SESSION_MEDIA_CONTEXT_KEY = Symbol('session-media');

const NARRATION_VOLUME_KEY = 'cosmonaut-audio-volume';
const NARRATION_SPEED_KEY = 'cosmonaut-audio-speed';
const NARRATION_VOICE_KEY = 'cosmonaut-audio-voice';
const SOUNDTRACK_VOLUME_KEY = 'cosmonaut-music-volume';
const SOUNDTRACK_ENABLED_KEY = 'cosmonaut-music-enabled';

const VALID_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const DEFAULT_VOICE_ID = 'theo';
const DEFAULT_SOUNDTRACK_VOLUME = 0.3;

function loadFloat(key: string, fallback: number, min = 0, max = 1): number {
	const stored = getItem(key);
	if (stored) {
		const parsed = parseFloat(stored);
		if (isFinite(parsed) && parsed >= min && parsed <= max) return parsed;
	}
	return fallback;
}

function loadSpeed(): number {
	const stored = getItem(NARRATION_SPEED_KEY);
	if (stored) {
		const parsed = parseFloat(stored);
		if (VALID_SPEEDS.includes(parsed)) return parsed;
	}
	return 1;
}

function loadBool(key: string, fallback: boolean): boolean {
	const stored = getItem(key);
	if (stored === 'true') return true;
	if (stored === 'false') return false;
	return fallback;
}

export interface VoicePickerDelegate {
	voices: Voice[];
	selectedVoiceId: string | null;
	onSelect: (voiceId: string) => void;
	onOpenChange: (isOpen: boolean) => void;
}

/**
 * Persistent, session-scoped media state shared between the layout-level
 * media player and per-node narration controllers.
 *
 * Written by AudioNarration (controller) and SessionMediaPlayer.
 * Read by StoryNodeView (immersive mode) and SessionMediaBar (UI).
 */
export class SessionMediaState {
	// ── Narration: what to play (written by AudioNarration) ──
	narrationNodeId = $state<string | null>(null);
	narrationUrl = $state<string | null>(null);
	narrationTimestampsUrl = $state<string | null>(null);
	narrationGenerationNodeId = $state<string | null>(null);
	narrationIsGenerating = $state(false);
	narrationGenerationStartedAt = $state<number | null>(null);
	narrationHasAudio = $state(false);
	narrationCaptionsUnavailable = $state(false);
	narrationHasStartedPlayback = $state(false);

	// ── Narration: playback state (written by SessionMediaPlayer) ──
	narrationCurrentTime = $state(0);
	narrationDuration = $state(0);
	narrationPaused = $state(true);
	narrationEnded = $state(false);

	// ── Narration: preferences (persisted) ──
	narrationVolume = $state(loadFloat(NARRATION_VOLUME_KEY, 1));
	private narrationPreviousVolume = $state(1);
	narrationPlaybackRate = $state(loadSpeed());
	narrationVoiceId = $state<string | null>(getItem(NARRATION_VOICE_KEY));

	// ── Soundtrack state ──
	soundtrackPlaylistId = $state<string | null>(null);
	soundtrackStarted = $state(false);
	soundtrackEnabled = $state(loadBool(SOUNDTRACK_ENABLED_KEY, true));
	soundtrackVolume = $state(loadFloat(SOUNDTRACK_VOLUME_KEY, DEFAULT_SOUNDTRACK_VOLUME));
	private soundtrackPreviousVolume = $state(DEFAULT_SOUNDTRACK_VOLUME);
	soundtrackMuted = $state(this.soundtrackVolume <= 0);

	// ── UI state ──
	barVisible = $state(false);

	// ── Voice picker delegate (set by AudioNarration when on a node page) ──
	voicePickerState = $state<VoicePickerDelegate | null>(null);

	// ── Narration: seek callback (set by SessionMediaPlayer) ──
	seekNarration = $state<((time: number) => void) | null>(null);

	// ── Narration methods ──

	loadNarration(nodeId: string, url: string, timestampsUrl?: string | null) {
		this.narrationNodeId = nodeId;
		this.narrationUrl = url;
		this.narrationTimestampsUrl = timestampsUrl ?? null;
		if (this.narrationGenerationNodeId === nodeId) {
			this.finishNarrationGeneration(nodeId);
		}
		this.narrationHasAudio = true;
		this.narrationCaptionsUnavailable = !!url && !timestampsUrl;
		this.narrationEnded = false;
		this.narrationHasStartedPlayback = false;
	}

	clearNarration() {
		this.narrationNodeId = null;
		this.narrationUrl = null;
		this.narrationTimestampsUrl = null;
		this.narrationGenerationNodeId = null;
		this.narrationHasAudio = false;
		this.narrationCaptionsUnavailable = false;
		this.narrationIsGenerating = false;
		this.narrationGenerationStartedAt = null;
		this.narrationCurrentTime = 0;
		this.narrationDuration = 0;
		this.narrationPaused = true;
		this.narrationEnded = false;
		this.narrationHasStartedPlayback = false;
	}

	startNarrationGeneration(nodeId: string) {
		if (this.narrationGenerationNodeId !== nodeId) {
			this.narrationGenerationNodeId = nodeId;
			this.narrationGenerationStartedAt = Date.now();
		}
		this.narrationIsGenerating = true;
	}

	finishNarrationGeneration(nodeId?: string) {
		if (nodeId && this.narrationGenerationNodeId && this.narrationGenerationNodeId !== nodeId) {
			return;
		}
		this.narrationIsGenerating = false;
		this.narrationGenerationNodeId = null;
		this.narrationGenerationStartedAt = null;
	}

	showBar() {
		this.barVisible = true;
	}

	hideBar() {
		this.barVisible = false;
	}

	// ── Narration volume ──

	setNarrationVolume(v: number) {
		const clamped = Math.min(1, Math.max(0, v));
		if (clamped > 0) this.narrationPreviousVolume = clamped;
		this.narrationVolume = clamped;
		setItem(NARRATION_VOLUME_KEY, String(clamped));
	}

	toggleNarrationMute() {
		if (this.narrationVolume > 0) {
			this.narrationPreviousVolume = this.narrationVolume;
			this.setNarrationVolume(0);
		} else {
			this.setNarrationVolume(this.narrationPreviousVolume > 0 ? this.narrationPreviousVolume : 1);
		}
	}

	setNarrationSpeed(rate: number) {
		this.narrationPlaybackRate = rate;
		setItem(NARRATION_SPEED_KEY, String(rate));
	}

	resolveVoiceId(voices: Voice[]): string | null {
		if (this.narrationVoiceId && voices.some((v) => v.id === this.narrationVoiceId)) {
			return this.narrationVoiceId;
		}
		if (voices.some((v) => v.id === DEFAULT_VOICE_ID)) {
			return DEFAULT_VOICE_ID;
		}
		return voices[0]?.id ?? null;
	}

	selectVoice(voiceId: string) {
		this.narrationVoiceId = voiceId;
		setItem(NARRATION_VOICE_KEY, voiceId);
	}

	// ── Soundtrack methods ──

	startSoundtrack(playlistId: string) {
		if (this.soundtrackStarted && this.soundtrackPlaylistId === playlistId) return;
		this.soundtrackPlaylistId = playlistId;
		this.soundtrackStarted = true;
	}

	setSoundtrackVolume(v: number) {
		const clamped = Math.min(1, Math.max(0, v));
		if (clamped > 0) this.soundtrackPreviousVolume = clamped;
		this.soundtrackVolume = clamped;
		this.soundtrackMuted = clamped === 0;
		setItem(SOUNDTRACK_VOLUME_KEY, String(clamped));
	}

	toggleSoundtrackMute() {
		if (this.soundtrackMuted) {
			this.setSoundtrackVolume(
				this.soundtrackPreviousVolume > 0
					? this.soundtrackPreviousVolume
					: DEFAULT_SOUNDTRACK_VOLUME
			);
		} else {
			this.soundtrackPreviousVolume = this.soundtrackVolume;
			this.setSoundtrackVolume(0);
		}
	}

	toggleSoundtrackEnabled() {
		this.soundtrackEnabled = !this.soundtrackEnabled;
		setItem(SOUNDTRACK_ENABLED_KEY, String(this.soundtrackEnabled));
	}

	// ── Voice picker delegate ──

	registerVoicePicker(delegate: VoicePickerDelegate) {
		this.voicePickerState = delegate;
	}

	unregisterVoicePicker() {
		this.voicePickerState = null;
	}
}

export function setSessionMediaContext() {
	const state = new SessionMediaState();
	setContext(SESSION_MEDIA_CONTEXT_KEY, state);
	return state;
}

export function getSessionMediaContext(): SessionMediaState {
	return getContext<SessionMediaState>(SESSION_MEDIA_CONTEXT_KEY);
}
