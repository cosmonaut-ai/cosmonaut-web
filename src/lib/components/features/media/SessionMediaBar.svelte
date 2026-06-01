<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import {
		Play,
		Pause,
		Volume2,
		Volume1,
		VolumeX,
		Music,
		Music2,
		Check,
		EllipsisVertical,
		X
	} from '@lucide/svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { getSessionMediaContext } from '$lib/contexts/sessionMedia.svelte';
	import { getImmersiveStoryContext } from '$lib/contexts/immersiveStory.svelte';

	const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

	interface Props {
		onTogglePlayPause: () => void;
		onSeek: (e: Event) => void;
		onClose: () => void;
	}

	let { onTogglePlayPause, onSeek, onClose }: Props = $props();

	const media = getSessionMediaContext();
	const immersiveStory = getImmersiveStoryContext();
	const immersive = $derived(immersiveStory.active);

	const progress = $derived(
		media.narrationDuration > 0 ? (media.narrationCurrentTime / media.narrationDuration) * 100 : 0
	);

	const narrationVolumeProgress = $derived(media.narrationVolume * 100);

	const soundtrackVolumeProgress = $derived(
		media.soundtrackMuted ? 0 : media.soundtrackVolume * 100
	);

	const hasNarration = $derived(!!media.narrationUrl || media.narrationIsGenerating);
	const hasSoundtrack = $derived(media.soundtrackStarted && media.soundtrackEnabled);

	function formatTime(seconds: number): string {
		if (!isFinite(seconds) || seconds < 0) return '0:00';
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	function formatSpeed(rate: number): string {
		return `${rate}x`;
	}

	function handleNarrationVolumeChange(val: number) {
		media.setNarrationVolume(val / 100);
	}

	function handleSoundtrackVolumeChange(val: number) {
		media.setSoundtrackVolume(val / 100);
	}
</script>

<div
	class="media-bar fixed inset-x-0 bottom-0 isolate z-50 overflow-visible border-t {immersive
		? 'media-bar-immersive border-white/0 bg-transparent text-white'
		: 'border-border bg-card/95 backdrop-blur-md'}"
	transition:fly={{ y: 64, duration: 300, easing: cubicOut }}
>
	<div class="relative z-10 mx-auto flex max-w-4xl items-center gap-2 px-4 py-3 sm:gap-3">
		{#if media.narrationIsGenerating}
			<div class="flex flex-1 items-center justify-center gap-3">
				<Spinner class="h-5 w-5 text-primary" />
				<span class="text-sm {immersive ? 'text-white/70' : 'text-muted-foreground'}"
					>Generating narration…</span
				>
			</div>
		{:else if hasNarration}
			<!-- Play/Pause -->
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={onTogglePlayPause}
				aria-label={media.narrationPaused ? 'Play narration' : 'Pause narration'}
				class="shrink-0 {immersive ? 'text-white/75 hover:bg-white/10 hover:text-white' : ''}"
			>
				{#if media.narrationPaused}
					<Play class="h-4 w-4" />
				{:else}
					<Pause class="h-4 w-4" />
				{/if}
			</Button>

			<!-- Current time -->
			<span
				class="w-10 shrink-0 text-right text-xs tabular-nums {immersive
					? 'text-white/70'
					: 'text-muted-foreground'}"
			>
				{formatTime(media.narrationCurrentTime)}
			</span>

			<!-- Seek slider -->
			<input
				type="range"
				min="0"
				max="100"
				step="0.1"
				value={progress}
				oninput={onSeek}
				aria-label="Seek narration"
				class="audio-range h-1.5 flex-1 cursor-pointer appearance-none rounded-full {immersive
					? 'bg-white/15'
					: 'bg-muted'}"
				style="--progress: {progress}%"
			/>

			<!-- Duration -->
			<span
				class="w-10 shrink-0 text-xs tabular-nums {immersive
					? 'text-white/70'
					: 'text-muted-foreground'}"
			>
				{formatTime(media.narrationDuration)}
			</span>

			<!-- Desktop: narration volume -->
			<div
				class="relative hidden shrink-0 items-center gap-1 sm:flex"
				role="group"
				aria-label="Narration volume"
			>
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={() => media.toggleNarrationMute()}
					aria-label={media.narrationVolume === 0 ? 'Unmute narration' : 'Mute narration'}
					class="shrink-0 {immersive ? 'text-white/75 hover:bg-white/10 hover:text-white' : ''}"
				>
					{#if media.narrationVolume === 0}
						<VolumeX class="h-4 w-4" />
					{:else if media.narrationVolume < 0.5}
						<Volume1 class="h-4 w-4" />
					{:else}
						<Volume2 class="h-4 w-4" />
					{/if}
				</Button>
				<input
					type="range"
					min="0"
					max="100"
					step="1"
					bind:value={() => narrationVolumeProgress, handleNarrationVolumeChange}
					aria-label="Narration volume"
					class="volume-range h-5 w-16 cursor-pointer appearance-none rounded-full bg-transparent"
					style="--vol-progress: {narrationVolumeProgress}%"
				/>
			</div>

			<!-- Desktop: speed -->
			<div class="hidden sm:block">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class="shrink-0 rounded-md px-1.5 py-1 text-xs font-medium tabular-nums transition-colors {immersive
							? 'text-white/70 hover:bg-white/10 hover:text-white'
							: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}"
						aria-label="Playback speed: {formatSpeed(media.narrationPlaybackRate)}"
					>
						{formatSpeed(media.narrationPlaybackRate)}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content side="top" align="end" class="min-w-24" preventScroll={false}>
						{#each SPEED_OPTIONS as speed (speed)}
							<DropdownMenu.Item
								class="cursor-pointer gap-2"
								onclick={() => media.setNarrationSpeed(speed)}
							>
								{#if media.narrationPlaybackRate === speed}
									<Check class="h-3 w-3 text-primary" />
								{:else}
									<span class="h-3 w-3"></span>
								{/if}
								{formatSpeed(speed)}
							</DropdownMenu.Item>
						{/each}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		{/if}

		<!-- Soundtrack volume (desktop, when soundtrack is active) -->
		{#if hasSoundtrack}
			{#if hasNarration && !media.narrationIsGenerating}
				<div class="mx-1 hidden h-5 w-px sm:block {immersive ? 'bg-white/20' : 'bg-border'}"></div>
			{/if}
			<div
				class="relative hidden shrink-0 items-center gap-1 sm:flex"
				role="group"
				aria-label="Soundtrack volume"
			>
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={() => media.toggleSoundtrackMute()}
					aria-label={media.soundtrackMuted ? 'Unmute soundtrack' : 'Mute soundtrack'}
					class="shrink-0 {immersive ? 'text-white/75 hover:bg-white/10 hover:text-white' : ''}"
				>
					{#if media.soundtrackMuted}
						<Music class="h-4 w-4 opacity-50" />
					{:else}
						<Music2 class="h-4 w-4" />
					{/if}
				</Button>
				<input
					type="range"
					min="0"
					max="100"
					step="1"
					bind:value={() => soundtrackVolumeProgress, handleSoundtrackVolumeChange}
					aria-label="Soundtrack volume"
					class="volume-range h-5 w-16 cursor-pointer appearance-none rounded-full bg-transparent"
					style="--vol-progress: {soundtrackVolumeProgress}%"
				/>
			</div>
		{/if}

		<!-- Mobile overflow menu (only visible on small screens when there's narration or soundtrack) -->
		{#if (hasNarration && !media.narrationIsGenerating) || hasSoundtrack}
			<DropdownMenu.Root>
				<DropdownMenu.Trigger
					class="shrink-0 rounded-md p-1.5 transition-colors sm:hidden {immersive
						? 'text-white/70 hover:bg-white/10 hover:text-white'
						: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'}"
					aria-label="Audio controls"
				>
					<EllipsisVertical class="h-4 w-4" />
				</DropdownMenu.Trigger>
				<DropdownMenu.Content side="top" align="end" class="w-56" preventScroll={false}>
					{#if hasNarration && !media.narrationIsGenerating}
						<DropdownMenu.Group>
							<DropdownMenu.Label>Narration Volume</DropdownMenu.Label>
							<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
							<div
								class="flex items-center gap-2 px-2 py-1.5"
								onclick={(e) => e.stopPropagation()}
								onkeydown={(e) => e.stopPropagation()}
								onpointerdown={(e) => e.stopPropagation()}
								role="group"
								aria-label="Narration volume"
							>
								<Button
									variant="ghost"
									size="icon-sm"
									onclick={(e) => {
										e.stopPropagation();
										media.toggleNarrationMute();
									}}
									aria-label={media.narrationVolume === 0 ? 'Unmute narration' : 'Mute narration'}
									class="shrink-0"
								>
									{#if media.narrationVolume === 0}
										<VolumeX class="h-3.5 w-3.5" />
									{:else if media.narrationVolume < 0.5}
										<Volume1 class="h-3.5 w-3.5" />
									{:else}
										<Volume2 class="h-3.5 w-3.5" />
									{/if}
								</Button>
								<input
									type="range"
									min="0"
									max="100"
									step="1"
									bind:value={() => narrationVolumeProgress, handleNarrationVolumeChange}
									aria-label="Narration volume"
									class="volume-range h-5 flex-1 cursor-pointer appearance-none rounded-full bg-transparent"
									style="--vol-progress: {narrationVolumeProgress}%"
								/>
							</div>
						</DropdownMenu.Group>

						<DropdownMenu.Separator />

						<DropdownMenu.Sub>
							<DropdownMenu.SubTrigger class="[&>svg:last-child]:rotate-180">
								Speed: {formatSpeed(media.narrationPlaybackRate)}
							</DropdownMenu.SubTrigger>
							<DropdownMenu.SubContent class="min-w-28">
								{#each SPEED_OPTIONS as speed (speed)}
									<DropdownMenu.Item
										class="cursor-pointer gap-2"
										onclick={() => media.setNarrationSpeed(speed)}
									>
										{#if media.narrationPlaybackRate === speed}
											<Check class="h-3 w-3 text-primary" />
										{:else}
											<span class="h-3 w-3"></span>
										{/if}
										{formatSpeed(speed)}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.SubContent>
						</DropdownMenu.Sub>
					{/if}

					{#if hasSoundtrack}
						{#if hasNarration && !media.narrationIsGenerating}
							<DropdownMenu.Separator />
						{/if}
						<DropdownMenu.Group>
							<DropdownMenu.Label>Soundtrack Volume</DropdownMenu.Label>
							<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
							<div
								class="flex items-center gap-2 px-2 py-1.5"
								onclick={(e) => e.stopPropagation()}
								onkeydown={(e) => e.stopPropagation()}
								onpointerdown={(e) => e.stopPropagation()}
								role="group"
								aria-label="Soundtrack volume"
							>
								<Button
									variant="ghost"
									size="icon-sm"
									onclick={(e) => {
										e.stopPropagation();
										media.toggleSoundtrackMute();
									}}
									aria-label={media.soundtrackMuted ? 'Unmute soundtrack' : 'Mute soundtrack'}
									class="shrink-0"
								>
									{#if media.soundtrackMuted}
										<Music class="h-3.5 w-3.5 opacity-50" />
									{:else}
										<Music2 class="h-3.5 w-3.5" />
									{/if}
								</Button>
								<input
									type="range"
									min="0"
									max="100"
									step="1"
									bind:value={() => soundtrackVolumeProgress, handleSoundtrackVolumeChange}
									aria-label="Soundtrack volume"
									class="volume-range h-5 flex-1 cursor-pointer appearance-none rounded-full bg-transparent"
									style="--vol-progress: {soundtrackVolumeProgress}%"
								/>
							</div>
						</DropdownMenu.Group>
					{/if}
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		{/if}

		<!-- Close button -->
		<Button
			variant="ghost"
			size="icon-sm"
			onclick={onClose}
			aria-label="Close audio player"
			class="shrink-0 {immersive
				? 'text-white/50 hover:bg-white/10 hover:text-white'
				: 'text-muted-foreground/60'}"
		>
			<X class="h-3.5 w-3.5" />
		</Button>
	</div>
</div>

<style>
	.media-bar {
		--audio-track-rest: var(--muted);
		box-shadow: 0 -2px 16px oklch(0 0 0 / 0.18);
		padding-bottom: env(safe-area-inset-bottom, 0px);
	}

	.media-bar-immersive {
		--audio-track-rest: rgb(255 255 255 / 0.18);
		border-top-color: rgba(255, 255, 255, 0.12);
		background: rgba(5, 8, 12, 0.44);
		backdrop-filter: blur(16px) saturate(155%) contrast(106%);
		-webkit-backdrop-filter: blur(16px) saturate(155%) contrast(106%);
		box-shadow:
			0 -18px 46px rgba(0, 0, 0, 0.26),
			inset 0 1px rgba(255, 255, 255, 0.12),
			inset 0 -1px rgba(255, 255, 255, 0.04);
	}

	.media-bar-immersive::before,
	.media-bar-immersive::after {
		position: absolute;
		z-index: 0;
		content: '';
		pointer-events: none;
	}

	.media-bar-immersive::before {
		inset: auto 0 100%;
		height: 2rem;
		background: linear-gradient(to top, rgba(5, 8, 12, 0.24), transparent);
	}

	.media-bar-immersive::after {
		inset: 0;
		background:
			linear-gradient(
				150deg,
				rgba(255, 255, 255, 0.12),
				rgba(255, 255, 255, 0.035) 32%,
				transparent 58%
			),
			linear-gradient(to top, rgba(0, 0, 0, 0.22), transparent 72%);
		mix-blend-mode: screen;
		opacity: 0.58;
	}

	.audio-range::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: var(--primary);
		cursor: pointer;
		border: none;
		margin-top: -3px;
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

	.audio-range::-webkit-slider-runnable-track {
		height: 6px;
		border-radius: 9999px;
		background: linear-gradient(
			to right,
			var(--primary) 0%,
			var(--primary) var(--progress),
			var(--audio-track-rest) var(--progress),
			var(--audio-track-rest) 100%
		);
	}

	.audio-range::-moz-range-track {
		height: 6px;
		border-radius: 9999px;
		background: var(--audio-track-rest);
	}

	.audio-range::-moz-range-progress {
		height: 6px;
		border-radius: 9999px;
		background: var(--primary);
	}

	.volume-range::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--muted-foreground);
		cursor: pointer;
		border: none;
		margin-top: -3px;
		transition: background 0.15s ease;
	}
	.volume-range:hover::-webkit-slider-thumb {
		background: var(--primary);
	}

	.volume-range::-moz-range-thumb {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: var(--muted-foreground);
		cursor: pointer;
		border: none;
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

	.media-bar-immersive .volume-range::-webkit-slider-runnable-track {
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

	.media-bar-immersive .volume-range::-moz-range-track {
		background: rgb(255 255 255 / 0.18);
	}

	.volume-range::-moz-range-progress {
		height: 4px;
		border-radius: 9999px;
		background: var(--muted-foreground);
	}

	.media-bar-immersive .volume-range::-moz-range-progress {
		background: rgb(255 255 255 / 0.64);
	}

	.media-bar-immersive .volume-range::-webkit-slider-thumb {
		background: rgb(255 255 255 / 0.72);
	}

	.media-bar-immersive .volume-range::-moz-range-thumb {
		background: rgb(255 255 255 / 0.72);
	}

	@media (prefers-reduced-motion: reduce) {
		.media-bar {
			transition: none;
		}
	}
</style>
