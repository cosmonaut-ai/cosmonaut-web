<script lang="ts">
	import { useGenerateAudio, useVoices } from '$lib/queries';
	import { type AudioEntry, ApiError } from '$lib/types/api';
	import { showError, showWarning } from '$lib/utils/toast';
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { Sparkles, Volume2 } from '@lucide/svelte';
	import { untrack } from 'svelte';
	import { trackEvent } from '$lib/utils/analytics';
	import { getSessionMediaContext } from '$lib/contexts/sessionMedia.svelte';
	import { getImmersiveStoryContext } from '$lib/contexts/immersiveStory.svelte';

	interface Props {
		sessionId: string;
		rootWorldId: string;
		nodeId: string;
		audio: Record<string, AudioEntry>;
		isNodeCompleted: boolean;
		onQuotaExceeded: () => void;
		soundtrackPlaylistId?: string | null;
		nodeTextLength?: number;
	}

	let {
		sessionId,
		rootWorldId,
		nodeId,
		audio,
		isNodeCompleted,
		onQuotaExceeded,
		soundtrackPlaylistId = null,
		nodeTextLength = 0
	}: Props = $props();

	const media = getSessionMediaContext();
	const immersiveStory = getImmersiveStoryContext();

	const MAX_NARRATION_CHARS = 3000;
	const isTooLong = $derived(nodeTextLength > MAX_NARRATION_CHARS);

	const narrationDisabledMessage = $derived<string | null>(
		isTooLong
			? `Too long for audio narration (${nodeTextLength.toLocaleString()} / ${MAX_NARRATION_CHARS.toLocaleString()} chars)`
			: !isNodeCompleted
				? 'Audio narration is available once the story is generated'
				: null
	);

	// Disabled-state tooltip (hover + click, auto-dismiss)
	let tooltipOpen = $state(false);
	let isHovering = $state(false);
	let immersiveTooltipOpen = $state(false);
	let isHoveringImmersive = $state(false);

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

	const effectiveVoiceId = $derived(media.resolveVoiceId(voices));

	// Audio URL resolution
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
	const audioMutation = useGenerateAudio(() => sessionId);
	const isGenerating = $derived(audioMutation.isPending);
	const hasAudio = $derived(!!effectiveAudioUrl);

	// Sync generation state to context
	$effect(() => {
		if (isGenerating) {
			media.startNarrationGeneration(nodeId);
		} else {
			media.finishNarrationGeneration(nodeId);
		}
	});

	// Reset local audio cache when nodeId changes
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
				localAudio = {};
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

	// ── Voice picker delegate registration ──

	function handleVoicePickerOpenChange(_isOpen: boolean) {
		// Intentional no-op; playback continues at the session level.
	}

	function handleVoiceSelect(voiceId: string) {
		media.selectVoice(voiceId);

		const entry = mergedAudio[voiceId];
		if (entry) {
			if (immersiveStory.active && !entry.timestamps_url) {
				immersiveStory.setActive(false);
				showWarning('Captions unavailable', 'This narration does not include caption timestamps.');
			}
			media.loadNarration(nodeId, entry.audio_url, entry.timestamps_url);
			media.showBar();
		} else if (isNodeCompleted) {
			generateForVoice(voiceId, { requireTimestamps: immersiveStory.active });
		}
	}

	$effect(() => {
		if (voices.length > 0 && effectiveVoiceId) {
			media.registerVoicePicker({
				voices,
				selectedVoiceId: effectiveVoiceId,
				onSelect: handleVoiceSelect,
				onOpenChange: handleVoicePickerOpenChange
			});
		}
		return () => {
			media.unregisterVoicePicker();
		};
	});

	// ── Activation ──

	function handleToggle() {
		if (media.barVisible && media.narrationNodeId === nodeId) {
			handleClose();
			return;
		}
		handleActivate();
	}

	async function handleActivate(options: { requireTimestamps?: boolean } = {}) {
		if (isGenerating) return;
		const activationNodeId = nodeId;

		if (options.requireTimestamps && captionsUnavailable) {
			immersiveStory.setActive(false);
			showWarning('Captions unavailable', 'This narration does not include caption timestamps.');
			return;
		}

		if (media.barVisible && media.narrationNodeId === nodeId) {
			if (options.requireTimestamps && !effectiveTimestampsUrl && hasAudio) {
				immersiveStory.setActive(false);
				showWarning('Captions unavailable', 'This narration does not include caption timestamps.');
				return;
			}
			return;
		}

		if (activationNodeId !== nodeId) return;

		const voiceId = effectiveVoiceId;
		if (!voiceId) return;

		media.showBar();
		trackEvent('narration_started', {
			world_id: rootWorldId,
			session_id: sessionId,
			node_id: nodeId
		});

		if (hasAudio) {
			media.loadNarration(nodeId, effectiveAudioUrl!, effectiveTimestampsUrl);
		} else if (isNodeCompleted) {
			await generateForVoice(voiceId, options);
		}

		// Start soundtrack on first activation
		if (!media.soundtrackStarted && soundtrackPlaylistId) {
			media.startSoundtrack(soundtrackPlaylistId);
		}
	}

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
				media.hideBar();
				immersiveStory.setActive(false);
				showWarning('Captions unavailable', 'This narration does not include caption timestamps.');
				return;
			}

			media.loadNarration(requestedNodeId, entry.audio_url, entry.timestamps_url);
			media.showBar();

			if (!media.soundtrackStarted && soundtrackPlaylistId) {
				media.startSoundtrack(soundtrackPlaylistId);
			}
		} catch (err) {
			if (err instanceof ApiError && err.isRateLimited) {
				media.hideBar();
				if (options.requireTimestamps) immersiveStory.setActive(false);
				showWarning(
					'Slow down',
					"You're generating audio too quickly. Please wait a moment and try again."
				);
			} else if (err instanceof ApiError && err.isQuotaExceeded) {
				media.hideBar();
				if (options.requireTimestamps) immersiveStory.setActive(false);
				onQuotaExceeded();
			} else {
				media.hideBar();
				if (options.requireTimestamps) immersiveStory.setActive(false);
				showError(
					'Audio generation failed',
					err instanceof Error ? err.message : 'Please try again later.'
				);
			}
		}
	}

	function handleClose() {
		media.clearNarration();
		if (!media.soundtrackStarted) {
			media.hideBar();
		}
		immersiveStory.setActive(false);
	}

	function handleImmersiveToggle() {
		if (immersiveStory.active) {
			immersiveStory.setActive(false);
			return;
		}

		immersiveStory.setActive(true);
		handleActivate({ requireTimestamps: true });
	}

	// Immersive auto-start when entering immersive mode on a new node
	$effect(() => {
		const voiceId = effectiveVoiceId;
		const key = `${nodeId}:${voiceId ?? 'voice-loading'}:${effectiveAudioUrl ?? 'pending'}`;

		if (
			!immersiveStory.active ||
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

	// Sync current node's audio availability to context for display purposes
	$effect(() => {
		media.narrationHasAudio = hasAudio;
		media.narrationCaptionsUnavailable = captionsUnavailable;
	});

	// Cleanup on destroy — unregister but do NOT stop playback
	$effect(() => {
		return () => {
			localAudio = {};
		};
	});
</script>

<div class="flex shrink-0 items-center gap-1">
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
			aria-label={media.barVisible && media.narrationNodeId === nodeId
				? 'Close narration'
				: 'Play narration'}
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
								<Sparkles class="h-4 w-4" />
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
		<span
			class="immersive-cta {!immersiveStory.active && effectiveVoiceId
				? 'immersive-cta--animate'
				: ''}"
		>
			<Button
				variant={immersiveStory.active ? 'secondary' : 'ghost'}
				size="icon-sm"
				onclick={handleImmersiveToggle}
				disabled={!effectiveVoiceId}
				aria-pressed={immersiveStory.active}
				aria-label={immersiveStory.active ? 'Exit immersive view' : 'Enter immersive view'}
				class="shrink-0 {!immersiveStory.active && effectiveVoiceId ? 'text-primary' : ''}"
			>
				<Sparkles class="h-4 w-4" />
			</Button>
		</span>
	{/if}
</div>

<style>
	/* Smooth, animatable angle for the rotating conic-gradient border. */
	@property --cta-angle {
		syntax: '<angle>';
		initial-value: 0deg;
		inherits: false;
	}

	.immersive-cta {
		position: relative;
		display: inline-flex;
		isolation: isolate;
		border-radius: calc(var(--radius) + 2px);
	}

	/* Rotating gradient ring drawn just outside the button to draw the eye
	   toward immersive ("interactive") mode while it is inactive. */
	.immersive-cta--animate::before {
		content: '';
		position: absolute;
		inset: -2px;
		border-radius: inherit;
		padding: 2px;
		background: conic-gradient(
			from var(--cta-angle),
			var(--primary),
			var(--chart-3),
			var(--chart-5),
			var(--chart-2),
			var(--primary)
		);
		/* Show only the padding (the ring), masking out the button area. */
		-webkit-mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		mask:
			linear-gradient(#000 0 0) content-box,
			linear-gradient(#000 0 0);
		-webkit-mask-composite: xor;
		mask-composite: exclude;
		animation: immersive-cta-spin 4s linear infinite;
		pointer-events: none;
	}

	/* Soft glow behind the button echoing the same gradient. */
	.immersive-cta--animate::after {
		content: '';
		position: absolute;
		inset: -2px;
		border-radius: inherit;
		background: conic-gradient(
			from var(--cta-angle),
			var(--primary),
			var(--chart-3),
			var(--chart-5),
			var(--chart-2),
			var(--primary)
		);
		filter: blur(6px);
		opacity: 0.35;
		animation: immersive-cta-spin 4s linear infinite;
		pointer-events: none;
		z-index: -1;
	}

	@keyframes immersive-cta-spin {
		to {
			--cta-angle: 360deg;
		}
	}

	/* Respect reduced-motion: keep the accent ring, drop the rotation. */
	@media (prefers-reduced-motion: reduce) {
		.immersive-cta--animate::before,
		.immersive-cta--animate::after {
			animation: none;
		}
	}
</style>
