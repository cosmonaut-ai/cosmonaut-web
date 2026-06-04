<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Music, Music2, Volume1, Volume2, VolumeX } from '@lucide/svelte';
	import { getSessionMediaContext } from '$lib/contexts/sessionMedia.svelte';

	interface Props {
		hasPlayableNarration?: boolean;
		hasSoundtrack?: boolean;
		immersive?: boolean;
	}

	let { hasPlayableNarration = false, hasSoundtrack = false, immersive = false }: Props = $props();

	const media = getSessionMediaContext();

	const narrationVolumeProgress = $derived(media.narrationVolume * 100);
	const soundtrackVolumeProgress = $derived(
		media.soundtrackMuted ? 0 : media.soundtrackVolume * 100
	);
	const narrationMuted = $derived(media.narrationVolume <= 0);
	const soundtrackMuted = $derived(media.soundtrackMuted || media.soundtrackVolume <= 0);

	function rangeValue(event: Event): number {
		const input = event.currentTarget as HTMLInputElement;
		return Number.isFinite(input.valueAsNumber) ? input.valueAsNumber : Number(input.value);
	}

	function handleNarrationVolumeInput(event: Event) {
		media.setNarrationVolume(rangeValue(event) / 100);
	}

	function handleSoundtrackVolumeInput(event: Event) {
		media.setSoundtrackVolume(rangeValue(event) / 100);
	}

	function stopMenuEvent(e: Event) {
		e.stopPropagation();
	}
</script>

<DropdownMenu.Group>
	<DropdownMenu.Label>Volume</DropdownMenu.Label>
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<div
		class="volume-controls {immersive ? 'volume-controls-immersive' : ''}"
		onclick={stopMenuEvent}
		onkeydown={stopMenuEvent}
		onpointerdown={stopMenuEvent}
		role="group"
		aria-label="Volume controls"
	>
		{#if hasPlayableNarration}
			<div class="min-w-0" role="group" aria-label="Narration volume">
				<div class="mb-0.5 flex h-5 items-center justify-between gap-1">
					<span class="truncate text-[0.6875rem] font-medium text-muted-foreground">
						Narration
					</span>
					<Button
						variant="ghost"
						size="icon-sm"
						onclick={(e) => {
							stopMenuEvent(e);
							media.toggleNarrationMute();
						}}
						aria-label={narrationMuted ? 'Unmute narration' : 'Mute narration'}
						class="h-5 w-5 shrink-0"
					>
						{#if narrationMuted}
							<VolumeX class="h-3.5 w-3.5" />
						{:else if media.narrationVolume < 0.5}
							<Volume1 class="h-3.5 w-3.5" />
						{:else}
							<Volume2 class="h-3.5 w-3.5" />
						{/if}
					</Button>
				</div>
				<input
					type="range"
					min="0"
					max="100"
					step="1"
					value={narrationVolumeProgress}
					oninput={handleNarrationVolumeInput}
					onchange={handleNarrationVolumeInput}
					aria-label="Narration volume"
					class="volume-range h-5 w-full cursor-pointer appearance-none rounded-full bg-transparent"
					style="--vol-progress: {narrationVolumeProgress}%"
				/>
			</div>
		{/if}

		{#if hasSoundtrack}
			<div class="min-w-0" role="group" aria-label="Music volume">
				<div class="mb-0.5 flex h-5 items-center justify-between gap-1">
					<span class="truncate text-[0.6875rem] font-medium text-muted-foreground">Music</span>
					<Button
						variant="ghost"
						size="icon-sm"
						onclick={(e) => {
							stopMenuEvent(e);
							media.toggleSoundtrackMute();
						}}
						aria-label={soundtrackMuted ? 'Unmute music' : 'Mute music'}
						class="h-5 w-5 shrink-0"
					>
						{#if soundtrackMuted}
							<Music class="h-3.5 w-3.5 opacity-50" />
						{:else}
							<Music2 class="h-3.5 w-3.5" />
						{/if}
					</Button>
				</div>
				<input
					type="range"
					min="0"
					max="100"
					step="1"
					value={soundtrackVolumeProgress}
					oninput={handleSoundtrackVolumeInput}
					onchange={handleSoundtrackVolumeInput}
					aria-label="Music volume"
					class="volume-range h-5 w-full cursor-pointer appearance-none rounded-full bg-transparent"
					style="--vol-progress: {soundtrackVolumeProgress}%"
				/>
			</div>
		{/if}
	</div>
</DropdownMenu.Group>

<style>
	.volume-controls {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 0.5rem;
		padding: 0.25rem 0.5rem;
	}

	.volume-range::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 10px;
		height: 10px;
		border: none;
		border-radius: 50%;
		background: var(--muted-foreground);
		cursor: pointer;
		margin-top: -3px;
		transition: background 0.15s ease;
	}

	.volume-range:hover::-webkit-slider-thumb {
		background: var(--primary);
	}

	.volume-range::-moz-range-thumb {
		width: 10px;
		height: 10px;
		border: none;
		border-radius: 50%;
		background: var(--muted-foreground);
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.volume-range:hover::-moz-range-thumb {
		background: var(--primary);
	}

	.volume-range::-webkit-slider-runnable-track {
		height: 4px;
		border-radius: 9999px;
		background: linear-gradient(
			to right,
			var(--muted-foreground) 0%,
			var(--muted-foreground) var(--vol-progress),
			var(--muted) var(--vol-progress),
			var(--muted) 100%
		);
	}

	.volume-controls-immersive .volume-range::-webkit-slider-runnable-track {
		background: linear-gradient(
			to right,
			rgb(255 255 255 / 0.64) 0%,
			rgb(255 255 255 / 0.64) var(--vol-progress),
			rgb(255 255 255 / 0.18) var(--vol-progress),
			rgb(255 255 255 / 0.18) 100%
		);
	}

	.volume-range::-moz-range-track {
		height: 4px;
		border-radius: 9999px;
		background: var(--muted);
	}

	.volume-controls-immersive .volume-range::-moz-range-track {
		background: rgb(255 255 255 / 0.18);
	}

	.volume-range::-moz-range-progress {
		height: 4px;
		border-radius: 9999px;
		background: var(--muted-foreground);
	}

	.volume-controls-immersive .volume-range::-moz-range-progress {
		background: rgb(255 255 255 / 0.64);
	}

	.volume-controls-immersive .volume-range::-webkit-slider-thumb {
		background: rgb(255 255 255 / 0.72);
	}

	.volume-controls-immersive .volume-range::-moz-range-thumb {
		background: rgb(255 255 255 / 0.72);
	}

	.volume-range {
		touch-action: pan-y;
	}

	@media (pointer: coarse) {
		.volume-range {
			height: 1.75rem;
			min-height: 1.75rem;
		}

		.volume-range::-webkit-slider-thumb {
			width: 16px;
			height: 16px;
			margin-top: -5px;
		}

		.volume-range::-moz-range-thumb {
			width: 16px;
			height: 16px;
		}

		.volume-range::-webkit-slider-runnable-track,
		.volume-range::-moz-range-track,
		.volume-range::-moz-range-progress {
			height: 6px;
		}
	}
</style>
