<script lang="ts">
	import type { Voice } from '$lib/types/api';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import {
		Play,
		Pause,
		Volume2,
		Volume1,
		VolumeX,
		X,
		Check,
		EllipsisVertical
	} from '@lucide/svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import VoicePicker from './VoicePicker.svelte';

	export const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

	interface Props {
		currentTime: number;
		duration: number;
		paused: boolean;
		volume: number;
		volumeProgress: number;
		playbackRate: number;
		isGenerating: boolean;
		voices: Voice[];
		effectiveVoiceId: string | null;
		onTogglePlayPause: () => void;
		onSeek: (e: Event) => void;
		onVolumeChange: (e: Event) => void;
		onToggleMute: () => void;
		onPlaybackRateChange: (rate: number) => void;
		onVoiceSelect: (voiceId: string) => void;
		onVoicePickerOpenChange: (isOpen: boolean) => void;
		onClose: () => void;
	}

	let {
		currentTime,
		duration,
		paused,
		volume,
		volumeProgress,
		playbackRate,
		isGenerating,
		voices,
		effectiveVoiceId,
		onTogglePlayPause,
		onSeek,
		onVolumeChange,
		onToggleMute,
		onPlaybackRateChange,
		onVoiceSelect,
		onVoicePickerOpenChange,
		onClose
	}: Props = $props();

	const progress = $derived(duration > 0 ? (currentTime / duration) * 100 : 0);

	function formatTime(seconds: number): string {
		if (!isFinite(seconds) || seconds < 0) return '0:00';
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	function formatSpeed(rate: number): string {
		return rate === Math.floor(rate) ? `${rate}x` : `${rate}x`;
	}
</script>

<div
	class="media-bar fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-md"
	transition:fly={{ y: 64, duration: 300, easing: cubicOut }}
>
	<div class="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3 sm:gap-3">
		{#if isGenerating}
			<div class="flex flex-1 items-center justify-center gap-3">
				<Spinner class="h-5 w-5 text-primary" />
				<span class="text-sm text-muted-foreground">Generating narration…</span>
			</div>
		{:else}
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={onTogglePlayPause}
				aria-label={paused ? 'Play narration' : 'Pause narration'}
				class="shrink-0"
			>
				{#if paused}
					<Play class="h-4 w-4" />
				{:else}
					<Pause class="h-4 w-4" />
				{/if}
			</Button>

			<span class="w-10 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
				{formatTime(currentTime)}
			</span>

			<input
				type="range"
				min="0"
				max="100"
				step="0.1"
				value={progress}
				oninput={onSeek}
				aria-label="Seek narration"
				class="audio-range h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-muted"
				style="--progress: {progress}%"
			/>

			<span class="w-10 shrink-0 text-xs text-muted-foreground tabular-nums">
				{formatTime(duration)}
			</span>

			<div
				class="relative hidden shrink-0 items-center gap-1 sm:flex"
				role="group"
				aria-label="Volume controls"
			>
				<Button
					variant="ghost"
					size="icon-sm"
					onclick={onToggleMute}
					aria-label={volume === 0 ? 'Unmute' : 'Mute'}
					class="shrink-0"
				>
					{#if volume === 0}
						<VolumeX class="h-4 w-4" />
					{:else if volume < 0.5}
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
					value={volumeProgress}
					oninput={onVolumeChange}
					aria-label="Volume"
					class="volume-range h-1 w-16 cursor-pointer appearance-none rounded-full bg-muted"
					style="--vol-progress: {volumeProgress}%"
				/>
			</div>

			<div class="hidden sm:block">
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class="shrink-0 rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground tabular-nums transition-colors hover:bg-accent hover:text-accent-foreground"
						aria-label="Playback speed: {formatSpeed(playbackRate)}"
					>
						{formatSpeed(playbackRate)}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content side="top" align="end" class="min-w-24">
						{#each SPEED_OPTIONS as speed (speed)}
							<DropdownMenu.Item
								class="cursor-pointer gap-2"
								onclick={() => onPlaybackRateChange(speed)}
							>
								{#if playbackRate === speed}
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

			<div class="hidden sm:block">
				{#if voices.length > 0 && effectiveVoiceId}
					<VoicePicker
						{voices}
						selectedVoiceId={effectiveVoiceId}
						onSelect={onVoiceSelect}
						onOpenChange={onVoicePickerOpenChange}
					/>
				{/if}
			</div>
		{/if}

		<DropdownMenu.Root>
			<DropdownMenu.Trigger
				class="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:hidden"
				aria-label="Audio controls"
			>
				<EllipsisVertical class="h-4 w-4" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content side="top" align="end" class="w-56">
				{#if !isGenerating}
					<DropdownMenu.Group>
						<DropdownMenu.Label>Volume</DropdownMenu.Label>
						<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
						<div
							class="flex items-center gap-2 px-2 py-1.5"
							onclick={(e) => e.stopPropagation()}
							onkeydown={(e) => e.stopPropagation()}
							onpointerdown={(e) => e.stopPropagation()}
							role="group"
							aria-label="Volume"
						>
							<Button
								variant="ghost"
								size="icon-sm"
								onclick={(e) => {
									e.stopPropagation();
									onToggleMute();
								}}
								aria-label={volume === 0 ? 'Unmute' : 'Mute'}
								class="shrink-0"
							>
								{#if volume === 0}
									<VolumeX class="h-3.5 w-3.5" />
								{:else if volume < 0.5}
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
								value={volumeProgress}
								oninput={onVolumeChange}
								aria-label="Volume"
								class="volume-range h-1 flex-1 cursor-pointer appearance-none rounded-full bg-muted"
								style="--vol-progress: {volumeProgress}%"
							/>
						</div>
					</DropdownMenu.Group>

					<DropdownMenu.Separator />

					<DropdownMenu.Sub>
						<DropdownMenu.SubTrigger class="[&>svg:last-child]:rotate-180">
							Speed: {formatSpeed(playbackRate)}
						</DropdownMenu.SubTrigger>
						<DropdownMenu.SubContent class="min-w-28">
							{#each SPEED_OPTIONS as speed (speed)}
								<DropdownMenu.Item
									class="cursor-pointer gap-2"
									onclick={() => onPlaybackRateChange(speed)}
								>
									{#if playbackRate === speed}
										<Check class="h-3 w-3 text-primary" />
									{:else}
										<span class="h-3 w-3"></span>
									{/if}
									{formatSpeed(speed)}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.SubContent>
					</DropdownMenu.Sub>

					{#if voices.length > 0 && effectiveVoiceId}
						<DropdownMenu.Sub>
							<DropdownMenu.SubTrigger class="[&>svg:last-child]:rotate-180">
								Voice: {voices.find((v) => v.id === effectiveVoiceId)?.display_name ?? 'Select'}
							</DropdownMenu.SubTrigger>
							<DropdownMenu.SubContent class="min-w-36">
								{#each voices as voice (voice.id)}
									<DropdownMenu.Item
										class="cursor-pointer gap-2"
										onclick={() => onVoiceSelect(voice.id)}
									>
										{#if voice.id === effectiveVoiceId}
											<Check class="h-3 w-3 text-primary" />
										{:else}
											<span class="h-3 w-3"></span>
										{/if}
										{voice.display_name}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.SubContent>
						</DropdownMenu.Sub>
					{/if}
				{/if}
			</DropdownMenu.Content>
		</DropdownMenu.Root>

		<Button
			variant="ghost"
			size="icon-sm"
			onclick={onClose}
			aria-label="Close player"
			class="hidden shrink-0 sm:flex"
		>
			<X class="h-4 w-4" />
		</Button>
	</div>
</div>

<style>
	.media-bar {
		box-shadow: 0 -2px 16px oklch(0 0 0 / 0.18);
		padding-bottom: env(safe-area-inset-bottom, 0px);
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

	.volume-range::-moz-range-track {
		height: 4px;
		border-radius: 9999px;
		background: var(--muted);
	}

	.volume-range::-moz-range-progress {
		height: 4px;
		border-radius: 9999px;
		background: var(--muted-foreground);
	}

	@media (prefers-reduced-motion: reduce) {
		.media-bar {
			transition: none;
		}
	}
</style>
