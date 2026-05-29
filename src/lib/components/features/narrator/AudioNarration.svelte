<script lang="ts">
	import { useGenerateAudio, useVoices } from '$lib/queries';
	import { type AudioEntry, ApiError } from '$lib/types/api';
	import { showError, showWarning } from '$lib/utils/toast';
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Maximize2, Volume2 } from '@lucide/svelte';
	import { untrack } from 'svelte';
	import { useAudioPlayer } from './useAudioPlayer.svelte';
	import { trackEvent } from '$lib/utils/analytics';

	type AudioPlayerBarComponent = typeof import('./AudioPlayerBar.svelte').default;
	let AudioPlayerBar = $state<AudioPlayerBarComponent | null>(null);

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
		immersiveActive?: boolean;
		narrationStatus?: NarrationPlaybackStatus;
		seekNarration?: ((time: number) => void) | null;
		nodeTextLength?: number;
	}

	interface NarrationPlaybackStatus {
		nodeId: string | null;
		currentTime: number;
		duration: number;
		paused: boolean;
		ended: boolean;
		isGenerating: boolean;
		audioUrl: string | null;
		timestampsUrl: string | null;
		hasAudio: boolean;
		voiceId: string | null;
		captionsUnavailable: boolean;
		hasStartedPlayback: boolean;
		generationStartedAt: number | null;
	}

	let {
		worldId,
		nodeId,
		audio,
		isNodeCompleted,
		onQuotaExceeded,
		playerVisible = $bindable(false),
		immersiveActive = $bindable(false),
		narrationStatus = $bindable<NarrationPlaybackStatus>({
			nodeId: null,
			currentTime: 0,
			duration: 0,
			paused: true,
			ended: false,
			isGenerating: false,
			audioUrl: null,
			timestampsUrl: null,
			hasAudio: false,
			voiceId: null,
			captionsUnavailable: false,
			hasStartedPlayback: false,
			generationStartedAt: null
		}),
		seekNarration = $bindable<((time: number) => void) | null>(null),
		nodeTextLength = 0
	}: Props = $props();

	const player = useAudioPlayer();

	const MAX_NARRATION_CHARS = 3000;
	const isTooLong = $derived(nodeTextLength > MAX_NARRATION_CHARS);

	// Returns a human-readable reason why narration is disabled, or null if enabled.
	const narrationDisabledMessage = $derived<string | null>(
		isTooLong
			? `Too long for audio narration (${nodeTextLength.toLocaleString()} / ${MAX_NARRATION_CHARS.toLocaleString()} chars)`
			: !isNodeCompleted
				? 'Audio narration is available once the story is generated'
				: null
	);

	// ── Disabled-state tooltip (hover + click, auto-dismiss) ──
	let tooltipOpen = $state(false);
	let isHovering = $state(false);
	let immersiveTooltipOpen = $state(false);
	let isHoveringImmersive = $state(false);

	// When opened via tap/click (isHovering=false), auto-dismiss after 2s.
	// Effect cleanup cancels the timer when hover or open state changes.
	$effect(() => {
		if (tooltipOpen && !isHovering) {
			const timer = setTimeout(() => {
				tooltipOpen = false;
			}, 2000);
			return () => clearTimeout(timer);
		}
	});

	$effect(() => {
		if (immersiveTooltipOpen && !isHoveringImmersive) {
			const timer = setTimeout(() => {
				immersiveTooltipOpen = false;
			}, 2000);
			return () => clearTimeout(timer);
		}
	});

	const voicesQuery = useVoices();
	const voices = $derived(voicesQuery.data ?? []);

	const effectiveVoiceId = $derived(player.resolveVoiceId(voices));

	// ── Audio URL resolution ──
	// Local cache for the brief gap between generation success and TanStack cache propagation
	let localAudio = $state<Record<string, AudioEntry>>({});
	const mergedAudio = $derived({ ...audio, ...localAudio });
	const activeAudioEntry = $derived(
		effectiveVoiceId ? (mergedAudio[effectiveVoiceId] ?? null) : null
	);
	const effectiveAudioUrl = $derived(activeAudioEntry?.audio_url ?? null);
	const effectiveTimestampsUrl = $derived(activeAudioEntry?.timestamps_url ?? null);
	const captionsUnavailable = $derived(
		!!activeAudioEntry?.audio_url && !activeAudioEntry.timestamps_url
	);

	// Generation mutation
	const audioMutation = useGenerateAudio(() => worldId);
	const isGenerating = $derived(audioMutation.isPending);
	const hasAudio = $derived(!!effectiveAudioUrl);
	let hasStartedPlayback = $state(false);
	let generationStartedAt = $state<number | null>(null);
	// Reset state when user navigates to a *different* node (actual value change).
	// Using explicit string comparison avoids spurious cleanup from reactive
	// re-evaluation when the cache is patched (same nodeId, new object ref).
	let lastNodeId = $state<string | undefined>(undefined);
	let lastImmersiveAutoStartKey = $state<string | null>(null);

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
				hasStartedPlayback = false;
				generationStartedAt = null;
				player.resetPlayback();
				lastImmersiveAutoStartKey = null;
				lastNodeId = currentId;
			}
		});
	});

	const immersiveDisabledMessage = $derived<string | null>(
		narrationDisabledMessage ??
			(!effectiveVoiceId
				? 'Narration voices are still loading'
				: captionsUnavailable
					? 'Captions are unavailable for this narration'
					: null)
	);

	$effect(() => {
		if (isGenerating && generationStartedAt === null) {
			generationStartedAt = Date.now();
		} else if (!isGenerating && generationStartedAt !== null) {
			generationStartedAt = null;
		}
	});

	$effect(() => {
		narrationStatus = {
			nodeId,
			currentTime: player.currentTime,
			duration: player.duration,
			paused: player.paused,
			ended: player.ended,
			isGenerating,
			audioUrl: effectiveAudioUrl,
			timestampsUrl: effectiveTimestampsUrl,
			hasAudio,
			voiceId: effectiveVoiceId,
			captionsUnavailable,
			hasStartedPlayback,
			generationStartedAt
		};
	});

	function handleToggle() {
		if (playerVisible) {
			handleClose();
			return;
		}
		handleActivate();
	}

	async function handleActivate(options: { requireTimestamps?: boolean } = {}) {
		if (isGenerating) return;
		const activationNodeId = nodeId;

		if (options.requireTimestamps && captionsUnavailable) {
			immersiveActive = false;
			showWarning('Captions unavailable', 'This narration does not include caption timestamps.');
			return;
		}

		if (playerVisible) {
			if (options.requireTimestamps && !effectiveTimestampsUrl && hasAudio) {
				immersiveActive = false;
				showWarning('Captions unavailable', 'This narration does not include caption timestamps.');
				return;
			}
			if (player.paused) {
				await player.waitAndPlay();
			}
			return;
		}

		await loadPlayerBar();
		if (activationNodeId !== nodeId) return;

		const voiceId = effectiveVoiceId;
		if (!voiceId) return; // Voices haven't loaded yet

		playerVisible = true;
		trackEvent('narration_started', { world_id: worldId, node_id: nodeId });

		if (hasAudio) {
			// Audio already cached - show player and play immediately
			await player.waitAndPlay();
		} else if (isNodeCompleted) {
			// Generate audio first, then auto-play
			await generateForVoice(voiceId, options);
		}
	}

	/** Generate audio for a specific voice, update local cache, and auto-play */
	async function generateForVoice(voiceId: string, options: { requireTimestamps?: boolean } = {}) {
		const requestedNodeId = nodeId;
		try {
			const result = await audioMutation.mutateAsync({ nodeId: requestedNodeId, voiceId });
			if (requestedNodeId !== nodeId) return;

			const entry: AudioEntry = {
				audio_url: result.audio_url,
				timestamps_url: (result as Record<string, unknown>).timestamps_url as string | undefined
			};
			localAudio = { ...localAudio, [voiceId]: entry };

			if (options.requireTimestamps && !entry.timestamps_url) {
				playerVisible = false;
				immersiveActive = false;
				showWarning('Captions unavailable', 'This narration does not include caption timestamps.');
				return;
			}

			await player.waitAndPlay();
		} catch (err) {
			if (err instanceof ApiError && err.isRateLimited) {
				playerVisible = false;
				if (options.requireTimestamps) immersiveActive = false;
				showWarning(
					'Slow down',
					"You're generating audio too quickly. Please wait a moment and try again."
				);
			} else if (err instanceof ApiError && err.isQuotaExceeded) {
				playerVisible = false;
				if (options.requireTimestamps) immersiveActive = false;
				onQuotaExceeded();
			} else {
				playerVisible = false;
				if (options.requireTimestamps) immersiveActive = false;
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
		immersiveActive = false;
		hasStartedPlayback = false;
	}

	function seekToTime(time: number) {
		if (!Number.isFinite(time)) return;
		if (!effectiveAudioUrl || isGenerating) return;

		const audioElement = player.audioElement;
		if (!audioElement) return;

		const haveMetadata =
			typeof HTMLMediaElement === 'undefined' ? 1 : HTMLMediaElement.HAVE_METADATA;
		if (audioElement.readyState < haveMetadata) return;

		const duration =
			Number.isFinite(player.duration) && player.duration > 0
				? player.duration
				: Number.isFinite(audioElement.duration) && audioElement.duration > 0
					? audioElement.duration
					: time;
		const nextTime = Math.min(Math.max(time, 0), duration);

		try {
			audioElement.currentTime = nextTime;
		} catch {
			return;
		}

		player.currentTime = nextTime;
		player.ended = false;
	}

	$effect(() => {
		seekNarration = seekToTime;
		return () => {
			seekNarration = null;
		};
	});

	function handleImmersiveToggle() {
		if (immersiveActive) {
			immersiveActive = false;
			return;
		}

		immersiveActive = true;
		handleActivate({ requireTimestamps: true });
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
		hasStartedPlayback = false;

		// Check if audio already exists for the new voice
		const url = mergedAudio[voiceId];
		if (url) {
			if (immersiveActive && !url.timestamps_url) {
				immersiveActive = false;
				showWarning('Captions unavailable', 'This narration does not include caption timestamps.');
			}
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
			generateForVoice(voiceId, { requireTimestamps: immersiveActive });
		}
	}

	$effect(() => {
		const voiceId = effectiveVoiceId;
		const key = `${nodeId}:${voiceId ?? 'voice-loading'}:${effectiveAudioUrl ?? 'pending'}`;

		if (
			!immersiveActive ||
			!isNodeCompleted ||
			narrationDisabledMessage ||
			!voiceId ||
			isGenerating
		) {
			return;
		}
		if (lastImmersiveAutoStartKey === key) return;

		untrack(() => {
			lastImmersiveAutoStartKey = key;
			handleActivate({ requireTimestamps: true });
		});
	});

	function handleAudioError() {
		player.pause();
		playerVisible = false;
		immersiveActive = false;
		hasStartedPlayback = false;
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
			hasStartedPlayback = false;
		};
	});

	function handleAudioPlay() {
		hasStartedPlayback = true;
	}
</script>

<!-- Hidden audio element -->
{#if effectiveAudioUrl}
	<audio
		bind:this={player.audioElement}
		bind:currentTime={player.currentTime}
		bind:duration={player.duration}
		bind:paused={player.paused}
		bind:ended={player.ended}
		bind:playbackRate={player.playbackRate}
		bind:volume={player.volume}
		src={effectiveAudioUrl}
		preload="auto"
		onplay={handleAudioPlay}
		onerror={handleAudioError}
	></audio>
{/if}

<div class="flex shrink-0 items-center gap-1">
	<!-- Speaker icon toggle (always visible, disabled until node text is ready) -->
	{#if narrationDisabledMessage}
		<Tooltip.Provider>
			<Tooltip.Root bind:open={tooltipOpen} delayDuration={0}>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<span
							{...props}
							aria-label="Narration unavailable"
							class="inline-flex shrink-0 cursor-not-allowed"
							onmouseenter={() => {
								isHovering = true;
								tooltipOpen = true;
							}}
							onmouseleave={() => {
								isHovering = false;
							}}
							onclick={() => {
								tooltipOpen = !tooltipOpen;
							}}
						>
							<Button
								variant="ghost"
								size="icon-sm"
								disabled
								aria-hidden="true"
								class="pointer-events-none"
							>
								<Volume2 class="h-4 w-4" />
							</Button>
						</span>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>{narrationDisabledMessage}</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	{:else}
		<Button
			variant="ghost"
			size="icon-sm"
			onclick={handleToggle}
			disabled={!effectiveVoiceId}
			aria-label={playerVisible ? 'Close narration' : 'Play narration'}
			class="shrink-0"
		>
			<Volume2 class="h-4 w-4" />
		</Button>
	{/if}

	{#if immersiveDisabledMessage}
		<Tooltip.Provider>
			<Tooltip.Root bind:open={immersiveTooltipOpen} delayDuration={0}>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<span
							{...props}
							aria-label="Immersive captions unavailable"
							class="inline-flex shrink-0 cursor-not-allowed"
							onmouseenter={() => {
								isHoveringImmersive = true;
								immersiveTooltipOpen = true;
							}}
							onmouseleave={() => {
								isHoveringImmersive = false;
							}}
							onclick={() => {
								immersiveTooltipOpen = !immersiveTooltipOpen;
							}}
						>
							<Button
								variant="ghost"
								size="icon-sm"
								disabled
								aria-hidden="true"
								class="pointer-events-none"
							>
								<Maximize2 class="h-4 w-4" />
							</Button>
						</span>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content>
					<p>{immersiveDisabledMessage}</p>
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	{:else}
		<Button
			variant={immersiveActive ? 'secondary' : 'ghost'}
			size="icon-sm"
			onclick={handleImmersiveToggle}
			disabled={!effectiveVoiceId}
			aria-pressed={immersiveActive}
			aria-label={immersiveActive ? 'Exit immersive view' : 'Enter immersive view'}
			class="shrink-0"
		>
			<Maximize2 class="h-4 w-4" />
		</Button>
	{/if}
</div>

{#if playerVisible && AudioPlayerBar}
	<AudioPlayerBar
		currentTime={player.currentTime}
		duration={player.duration}
		paused={player.paused}
		volume={player.volume}
		volumeProgress={player.volumeProgress}
		playbackRate={player.playbackRate}
		immersive={immersiveActive}
		{isGenerating}
		{voices}
		{effectiveVoiceId}
		onTogglePlayPause={player.togglePlayPause}
		onSeek={player.handleSeek}
		onVolumeChange={player.setVolumeProgress}
		onToggleMute={player.toggleMute}
		onPlaybackRateChange={(rate: number) => (player.playbackRate = rate)}
		onVoiceSelect={handleVoiceSelect}
		onVoicePickerOpenChange={handleVoicePickerOpenChange}
		onClose={handleClose}
	/>
{/if}
