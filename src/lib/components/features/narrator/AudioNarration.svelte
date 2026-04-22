<script lang="ts">
	import { useGenerateAudio, useVoices } from '$lib/queries';
	import { type AudioEntry, ApiError } from '$lib/types/api';
	import { showError, showWarning } from '$lib/utils/toast';
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Volume2 } from '@lucide/svelte';
	import { untrack } from 'svelte';
	import type { Component } from 'svelte';
	import { useAudioPlayer } from './useAudioPlayer.svelte';
	import { trackEvent } from '$lib/utils/analytics';

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
		/** Map of voice_id → audio entry for already-generated narrations on this node */
		audio: Record<string, AudioEntry>;
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

	const player = useAudioPlayer();

	const MAX_NARRATION_CHARS = 3000;
	const isTooLong = $derived(nodeTextLength > MAX_NARRATION_CHARS);

	const voicesQuery = useVoices();
	const voices = $derived(voicesQuery.data ?? []);

	const effectiveVoiceId = $derived(player.resolveVoiceId(voices));

	// ── Audio URL resolution ──
	// Local cache for the brief gap between generation success and TanStack cache propagation
	let localAudio = $state<Record<string, AudioEntry>>({});
	const mergedAudio = $derived({ ...audio, ...localAudio });
	const effectiveAudioUrl = $derived(
		effectiveVoiceId ? (mergedAudio[effectiveVoiceId]?.audio_url ?? null) : null
	);

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
		trackEvent('narration_started', { world_id: worldId, node_id: nodeId });

		if (hasAudio) {
			// Audio already cached - show player and play immediately
			await player.waitAndPlay();
		} else if (isNodeCompleted) {
			// Generate audio first, then auto-play
			await generateForVoice(voiceId);
		}
	}

	/** Generate audio for a specific voice, update local cache, and auto-play */
	async function generateForVoice(voiceId: string) {
		try {
			const result = await audioMutation.mutateAsync({ nodeId, voiceId });
			const entry: AudioEntry = {
				audio_url: result.audio_url,
				timestamps_url: (result as Record<string, unknown>).timestamps_url as string | undefined
			};
			localAudio = { ...localAudio, [voiceId]: entry };
			await player.waitAndPlay();
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

	function handleClose() {
		player.pause();
		playerVisible = false;
	}

	// ── Voice picker integration ──

	/** Track whether the main audio was playing before the voice picker opened */
	let wasPlayingBeforePickerOpen = $state(false);

	function handleVoicePickerOpenChange(isOpen: boolean) {
		if (isOpen) {
			// Pause main audio while previewing samples
			if (player.audioElement && !player.audioElement.paused) {
				wasPlayingBeforePickerOpen = true;
				player.pause();
			} else {
				wasPlayingBeforePickerOpen = false;
			}
		} else {
			if (wasPlayingBeforePickerOpen && player.audioElement) {
				player.audioElement.play().catch(() => {});
				wasPlayingBeforePickerOpen = false;
			}
		}
	}

	function handleVoiceSelect(voiceId: string) {
		player.selectVoice(voiceId);

		// Check if audio already exists for the new voice
		const url = mergedAudio[voiceId];
		if (url) {
			// Audio exists - reset playback position (src changes reactively)
			player.currentTime = 0;
			player.ended = false;
			// The wasPlayingBeforePickerOpen flag won't apply since the picker
			// closes on selection, but we want to auto-play the new voice
			wasPlayingBeforePickerOpen = false;
			player.waitAndPlay();
		} else if (isNodeCompleted) {
			// No audio for this voice yet - generate it
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
				player.pause();
				playerVisible = false;
				localAudio = {};
				player.resetPlayback();
				lastNodeId = currentId;
			}
		});
	});

	function handleAudioError() {
		player.pause();
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
			player.pause();
			playerVisible = false;
			localAudio = {};
		};
	});
</script>

<!-- Hidden audio element -->
{#if effectiveAudioUrl}
	<audio
		bind:this={player.audioElement}
		bind:currentTime={player.currentTime}
		bind:duration={player.duration}
		bind:paused={player.paused}
		bind:ended={player.ended}
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
		currentTime={player.currentTime}
		duration={player.duration}
		paused={player.paused}
		volume={player.volume}
		volumeProgress={player.volumeProgress}
		playbackRate={player.playbackRate}
		{isGenerating}
		{voices}
		{effectiveVoiceId}
		onTogglePlayPause={player.togglePlayPause}
		onSeek={player.handleSeek}
		onVolumeChange={player.handleVolumeChange}
		onToggleMute={player.toggleMute}
		onPlaybackRateChange={(rate: number) => (player.playbackRate = rate)}
		onVoiceSelect={handleVoiceSelect}
		onVoicePickerOpenChange={handleVoicePickerOpenChange}
		onClose={handleClose}
	/>
{/if}
