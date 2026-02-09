<script lang="ts">
	import { useGenerateAudio } from '$lib/queries';
	import { ApiError } from '$lib/types/api';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Play, Pause, Volume2, X } from '@lucide/svelte';
	import { untrack } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	interface Props {
		worldId: string;
		nodeId: string;
		audioUrl: string | null;
		isNodeCompleted: boolean;
		onQuotaExceeded: () => void;
		playerVisible?: boolean;
	}

	let {
		worldId,
		nodeId,
		audioUrl,
		isNodeCompleted,
		onQuotaExceeded,
		playerVisible = $bindable(false)
	}: Props = $props();

	// Local URL for the brief gap between generation and cache propagation
	let generatedUrl = $state<string | null>(null);
	const effectiveAudioUrl = $derived(audioUrl ?? generatedUrl);

	// Audio element reference and bindings
	let audioElement = $state<HTMLAudioElement | null>(null);
	let currentTime = $state(0);
	let duration = $state(0);
	let paused = $state(true);
	let ended = $state(false);

	// Generation mutation
	const audioMutation = useGenerateAudio(() => worldId);
	const isGenerating = $derived(audioMutation.isPending);
	const hasAudio = $derived(!!effectiveAudioUrl);

	// Format seconds as mm:ss
	function formatTime(seconds: number): string {
		if (!isFinite(seconds) || seconds < 0) return '0:00';
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	// Progress percentage for the range input
	const progress = $derived(duration > 0 ? (currentTime / duration) * 100 : 0);

	function handleToggle() {
		if (playerVisible) {
			handleClose();
			return;
		}
		handleActivate();
	}

	async function handleActivate() {
		if (isGenerating || playerVisible) return;

		playerVisible = true;

		if (hasAudio) {
			// Audio already cached — show player and play immediately
			await nextTickPlay();
		} else if (isNodeCompleted) {
			// Generate audio first, then auto-play
			try {
				const result = await audioMutation.mutateAsync(nodeId);
				generatedUrl = result.audio_url;
				await nextTickPlay();
			} catch (err) {
				if (err instanceof ApiError && err.isQuotaExceeded) {
					playerVisible = false;
					onQuotaExceeded();
				} else {
					playerVisible = false;
				}
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

		audioElement.play();
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

	// Reset state when user navigates to a *different* node (actual value change).
	// Using explicit string comparison avoids spurious cleanup from reactive
	// re-evaluation when the cache is patched (same nodeId, new object ref).
	let lastNodeId = nodeId;

	$effect(() => {
		const currentId = nodeId;
		untrack(() => {
			if (currentId !== lastNodeId) {
				audioElement?.pause();
				playerVisible = false;
				generatedUrl = null;
				lastNodeId = currentId;
			}
		});
	});

	// Stop audio and clean up when the component is destroyed.
	// No reactive reads in the body → runs once on mount, cleanup runs on destroy only.
	$effect(() => {
		return () => {
			audioElement?.pause();
			playerVisible = false;
			generatedUrl = null;
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
	></audio>
{/if}

<!-- Speaker icon toggle (always visible, disabled until node text is ready) -->
<Button
	variant="ghost"
	size="icon-sm"
	onclick={handleToggle}
	disabled={!isNodeCompleted}
	aria-label={playerVisible ? 'Close narration' : 'Play narration'}
	class="shrink-0"
>
	<Volume2 class="h-4 w-4" />
</Button>

<!-- Fixed bottom media bar -->
{#if playerVisible}
	<div
		class="media-bar fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-md"
		transition:fly={{ y: 64, duration: 300, easing: cubicOut }}
	>
		<div class="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
			{#if isGenerating}
				<!-- Buffering / generating state -->
				<div class="flex flex-1 items-center justify-center gap-3">
					<Spinner class="h-5 w-5 text-primary" />
					<span class="text-sm text-muted-foreground">Generating narration…</span>
				</div>
			{:else}
				<!-- Play / Pause -->
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={togglePlayPause}
					aria-label={paused ? 'Play narration' : 'Pause narration'}
					class="shrink-0"
				>
					{#if paused}
						<Play class="h-4 w-4" />
					{:else}
						<Pause class="h-4 w-4" />
					{/if}
				</Button>

				<!-- Current time -->
				<span class="w-10 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
					{formatTime(currentTime)}
				</span>

				<!-- Scrubable progress bar -->
				<input
					type="range"
					min="0"
					max="100"
					step="0.1"
					value={progress}
					oninput={handleSeek}
					aria-label="Seek narration"
					class="audio-range h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted"
					style="--progress: {progress}%"
				/>

				<!-- Duration -->
				<span class="w-10 shrink-0 text-xs text-muted-foreground tabular-nums">
					{formatTime(duration)}
				</span>
			{/if}

			<!-- Close button -->
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={handleClose}
				aria-label="Close player"
				class="shrink-0"
			>
				<X class="h-4 w-4" />
			</Button>
		</div>
	</div>
{/if}

<style>
	/* ── Fixed bottom bar ── */
	.media-bar {
		box-shadow: 0 -2px 16px oklch(0 0 0 / 0.18);
		padding-bottom: env(safe-area-inset-bottom, 0px);
	}

	/* ── Range input: thumb ── */
	.audio-range::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--primary);
		cursor: pointer;
		border: none;
		margin-top: -3px; /* vertically centre 12 px thumb on 6 px track */
		box-shadow: 0 0 4px oklch(from var(--primary) l c h / 0.3);
	}

	.audio-range::-moz-range-thumb {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--primary);
		cursor: pointer;
		border: none;
		box-shadow: 0 0 4px oklch(from var(--primary) l c h / 0.3);
	}

	/* ── Range input: track ── */
	.audio-range::-webkit-slider-runnable-track {
		height: 6px;
		border-radius: 9999px;
		background: linear-gradient(
			to right,
			var(--primary) 0%,
			var(--primary) var(--progress),
			var(--muted) var(--progress),
			var(--muted) 100%
		);
	}

	.audio-range::-moz-range-track {
		height: 6px;
		border-radius: 9999px;
		background: var(--muted);
	}

	.audio-range::-moz-range-progress {
		height: 6px;
		border-radius: 9999px;
		background: var(--primary);
	}

	@media (prefers-reduced-motion: reduce) {
		.media-bar {
			transition: none;
		}
	}
</style>
