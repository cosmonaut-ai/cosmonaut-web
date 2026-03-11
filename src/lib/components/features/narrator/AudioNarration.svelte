<script lang="ts">
	import { browser } from '$app/environment';
	import { useGenerateAudio, useVoices } from '$lib/queries';
	import { ApiError } from '$lib/types/api';
	import { showError, showWarning } from '$lib/utils/toast';
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Volume2 } from '@lucide/svelte';
	import { untrack } from 'svelte';
	import type { Component } from 'svelte';

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let AudioPlayerBar = $state<Component<any> | null>(null);

	async function loadPlayerBar() {
		if (AudioPlayerBar) return;
		const mod = await import('./AudioPlayerBar.svelte');
		AudioPlayerBar = mod.default;
	}

	interface Props {
		worldId: string;
		nodeId: string;
		/** Map of voice_id → CDN audio URL for already-generated narrations on this node */
		audio: Record<string, string>;
		isNodeCompleted: boolean;
		onQuotaExceeded: () => void;
		playerVisible?: boolean;
		nodeTextLength?: number;
	}

	let {
		worldId,
		nodeId,
		audio,
		isNodeCompleted,
		onQuotaExceeded,
		playerVisible = $bindable(false),
		nodeTextLength = 0
	}: Props = $props();

	const MAX_NARRATION_CHARS = 3000;
	const isTooLong = $derived(nodeTextLength > MAX_NARRATION_CHARS);

	// ── Voice selection (persisted) ──
	const VOICE_KEY = 'cosmonaut-audio-voice';
	const DEFAULT_VOICE_ID = 'theo';

	function loadVoiceId(): string | null {
		if (!browser) return null;
		return localStorage.getItem(VOICE_KEY);
	}

	let selectedVoiceId = $state<string | null>(loadVoiceId());

	const voicesQuery = useVoices();
	const voices = $derived(voicesQuery.data ?? []);

	// Resolved voice ID: saved preference (if still valid) → default voice → first available
	const effectiveVoiceId = $derived.by(() => {
		if (selectedVoiceId && voices.some((v) => v.id === selectedVoiceId)) {
			return selectedVoiceId;
		}
		if (voices.some((v) => v.id === DEFAULT_VOICE_ID)) {
			return DEFAULT_VOICE_ID;
		}
		return voices[0]?.id ?? null;
	});

	// Persist voice selection
	function saveVoice(voiceId: string) {
		selectedVoiceId = voiceId;
		if (browser) localStorage.setItem(VOICE_KEY, voiceId);
	}

	// ── Audio URL resolution ──
	// Local cache for the brief gap between generation success and TanStack cache propagation
	let localAudio = $state<Record<string, string>>({});
	const mergedAudio = $derived({ ...audio, ...localAudio });
	const effectiveAudioUrl = $derived(
		effectiveVoiceId ? (mergedAudio[effectiveVoiceId] ?? null) : null
	);

	// Audio element reference and bindings
	let audioElement = $state<HTMLAudioElement | null>(null);
	let currentTime = $state(0);
	let duration = $state(0);
	let paused = $state(true);
	let ended = $state(false);

	// ── Playback speed (persisted) ──
	const SPEED_KEY = 'cosmonaut-audio-speed';

	function loadSpeed(): number {
		if (!browser) return 1;
		const stored = localStorage.getItem(SPEED_KEY);
		if (stored) {
			const parsed = parseFloat(stored);
			if ([0.5, 0.75, 1, 1.25, 1.5, 2].includes(parsed)) return parsed;
		}
		return 1;
	}

	let playbackRate = $state(loadSpeed());

	$effect(() => {
		if (audioElement) audioElement.playbackRate = playbackRate;
		if (browser) localStorage.setItem(SPEED_KEY, String(playbackRate));
	});

	// ── Volume (persisted) ──
	const VOLUME_KEY = 'cosmonaut-audio-volume';

	function loadVolume(): number {
		if (!browser) return 1;
		const stored = localStorage.getItem(VOLUME_KEY);
		if (stored) {
			const parsed = parseFloat(stored);
			if (isFinite(parsed) && parsed >= 0 && parsed <= 1) return parsed;
		}
		return 1;
	}

	let volume = $state(loadVolume());
	let previousVolume = $state(1); // for mute/unmute toggle

	$effect(() => {
		if (audioElement) audioElement.volume = volume;
		if (browser) localStorage.setItem(VOLUME_KEY, String(volume));
	});

	const volumeProgress = $derived(volume * 100);

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

	// Generation mutation
	const audioMutation = useGenerateAudio(() => worldId);
	const isGenerating = $derived(audioMutation.isPending);
	const hasAudio = $derived(!!effectiveAudioUrl);

	function handleToggle() {
		if (playerVisible) {
			handleClose();
			return;
		}
		handleActivate();
	}

	async function handleActivate() {
		if (isGenerating || playerVisible) return;
		await loadPlayerBar();

		const voiceId = effectiveVoiceId;
		if (!voiceId) return; // Voices haven't loaded yet

		playerVisible = true;

		if (hasAudio) {
			// Audio already cached — show player and play immediately
			await nextTickPlay();
		} else if (isNodeCompleted) {
			// Generate audio first, then auto-play
			await generateForVoice(voiceId);
		}
	}

	/** Generate audio for a specific voice, update local cache, and auto-play */
	async function generateForVoice(voiceId: string) {
		try {
			const result = await audioMutation.mutateAsync({ nodeId, voiceId });
			localAudio = { ...localAudio, [voiceId]: result.audio_url };
			await nextTickPlay();
		} catch (err) {
			if (err instanceof ApiError && err.isRateLimited) {
				playerVisible = false;
				showWarning(
					'Slow down',
					"You're generating audio too quickly. Please wait a moment and try again."
				);
			} else if (err instanceof ApiError && err.isQuotaExceeded) {
				playerVisible = false;
				onQuotaExceeded();
			} else {
				playerVisible = false;
				showError(
					'Audio generation failed',
					err instanceof Error ? err.message : 'Please try again later.'
				);
			}
		}
	}

	async function nextTickPlay() {
		// Wait for Svelte to render the <audio> element
		await new Promise((r) => requestAnimationFrame(r));
		await new Promise((r) => requestAnimationFrame(r));

		if (!audioElement) return;

		// Ensure enough audio data is buffered so playback starts instantly
		// rather than having an audible gap at the beginning
		if (audioElement.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
			const ready = await new Promise<boolean>((resolve) => {
				audioElement!.addEventListener('canplaythrough', () => resolve(true), { once: true });
				audioElement!.addEventListener('error', () => resolve(false), { once: true });
			});
			if (!ready) return;
		}

		try {
			await audioElement.play();
		} catch {
			// Autoplay blocked or element invalidated — silently ignore
		}
	}

	function togglePlayPause() {
		if (!audioElement) return;
		if (paused) {
			if (ended) audioElement.currentTime = 0;
			audioElement.play();
		} else {
			audioElement.pause();
		}
	}

	function handleSeek(e: Event) {
		if (!audioElement) return;
		const target = e.target as HTMLInputElement;
		audioElement.currentTime = (parseFloat(target.value) / 100) * duration;
	}

	function handleClose() {
		if (audioElement && !audioElement.paused) {
			audioElement.pause();
		}
		playerVisible = false;
	}

	// ── Voice picker integration ──

	/** Track whether the main audio was playing before the voice picker opened */
	let wasPlayingBeforePickerOpen = $state(false);

	function handleVoicePickerOpenChange(isOpen: boolean) {
		if (isOpen) {
			// Pause main audio while previewing samples
			if (audioElement && !audioElement.paused) {
				wasPlayingBeforePickerOpen = true;
				audioElement.pause();
			} else {
				wasPlayingBeforePickerOpen = false;
			}
		} else {
			// Resume main audio if it was playing before picker opened
			if (wasPlayingBeforePickerOpen && audioElement) {
				audioElement.play();
				wasPlayingBeforePickerOpen = false;
			}
		}
	}

	function handleVoiceSelect(voiceId: string) {
		saveVoice(voiceId);

		// Check if audio already exists for the new voice
		const url = mergedAudio[voiceId];
		if (url) {
			// Audio exists — reset playback position (src changes reactively)
			currentTime = 0;
			ended = false;
			// The wasPlayingBeforePickerOpen flag won't apply since the picker
			// closes on selection, but we want to auto-play the new voice
			wasPlayingBeforePickerOpen = false;
			nextTickPlay();
		} else if (isNodeCompleted) {
			// No audio for this voice yet — generate it
			wasPlayingBeforePickerOpen = false;
			generateForVoice(voiceId);
		}
	}

	// Reset state when user navigates to a *different* node (actual value change).
	// Using explicit string comparison avoids spurious cleanup from reactive
	// re-evaluation when the cache is patched (same nodeId, new object ref).
	let lastNodeId = $state<string | undefined>(undefined);

	$effect(() => {
		const currentId = nodeId;
		untrack(() => {
			if (lastNodeId === undefined) {
				lastNodeId = currentId;
				return;
			}
			if (currentId !== lastNodeId) {
				audioElement?.pause();
				playerVisible = false;
				localAudio = {};
				currentTime = 0;
				duration = 0;
				ended = false;
				lastNodeId = currentId;
			}
		});
	});

	function handleAudioError() {
		audioElement?.pause();
		playerVisible = false;
		if (effectiveVoiceId && localAudio[effectiveVoiceId]) {
			const { [effectiveVoiceId]: _, ...rest } = localAudio;
			localAudio = rest;
		}
		showError('Playback failed', 'The audio file could not be loaded. Please try again.');
	}

	// Stop audio and clean up when the component is destroyed.
	// No reactive reads in the body → runs once on mount, cleanup runs on destroy only.
	$effect(() => {
		return () => {
			audioElement?.pause();
			playerVisible = false;
			localAudio = {};
		};
	});
</script>

<!-- Hidden audio element -->
{#if effectiveAudioUrl}
	<audio
		bind:this={audioElement}
		bind:currentTime
		bind:duration
		bind:paused
		bind:ended
		src={effectiveAudioUrl}
		preload="auto"
		onerror={handleAudioError}
	></audio>
{/if}

<!-- Speaker icon toggle (always visible, disabled until node text is ready) -->
{#if isTooLong}
	<Tooltip.Provider>
		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant="ghost"
						size="icon-sm"
						disabled
						aria-label="Narration unavailable"
						class="shrink-0"
					>
						<Volume2 class="h-4 w-4" />
					</Button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content>
				<p>
					Too long for audio narration ({nodeTextLength.toLocaleString()} / {MAX_NARRATION_CHARS.toLocaleString()}
					chars)
				</p>
			</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
{:else}
	<Button
		variant="ghost"
		size="icon-sm"
		onclick={handleToggle}
		disabled={!isNodeCompleted || !effectiveVoiceId}
		aria-label={playerVisible ? 'Close narration' : 'Play narration'}
		class="shrink-0"
	>
		<Volume2 class="h-4 w-4" />
	</Button>
{/if}

{#if playerVisible && AudioPlayerBar}
	<AudioPlayerBar
		{currentTime}
		{duration}
		{paused}
		{volume}
		{volumeProgress}
		{playbackRate}
		{isGenerating}
		{voices}
		{effectiveVoiceId}
		onTogglePlayPause={togglePlayPause}
		onSeek={handleSeek}
		onVolumeChange={handleVolumeChange}
		onToggleMute={toggleMute}
		onPlaybackRateChange={(rate: number) => (playbackRate = rate)}
		onVoiceSelect={handleVoiceSelect}
		onVoicePickerOpenChange={handleVoicePickerOpenChange}
		onClose={handleClose}
	/>
{/if}
