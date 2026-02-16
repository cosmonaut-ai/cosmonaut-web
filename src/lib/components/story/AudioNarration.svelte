<script lang="ts">
	import { browser } from '$app/environment';
	import { useGenerateAudio, useVoices } from '$lib/queries';
	import { ApiError } from '$lib/types/api';
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
	import { untrack } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import VoicePicker from './VoicePicker.svelte';

	interface Props {
		worldId: string;
		nodeId: string;
		/** Map of voice_id → CDN audio URL for already-generated narrations on this node */
		audio: Record<string, string>;
		isNodeCompleted: boolean;
		onQuotaExceeded: () => void;
		playerVisible?: boolean;
	}

	let {
		worldId,
		nodeId,
		audio,
		isNodeCompleted,
		onQuotaExceeded,
		playerVisible = $bindable(false)
	}: Props = $props();

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
	const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

	function loadSpeed(): number {
		if (!browser) return 1;
		const stored = localStorage.getItem(SPEED_KEY);
		if (stored) {
			const parsed = parseFloat(stored);
			if (SPEED_OPTIONS.includes(parsed as (typeof SPEED_OPTIONS)[number])) return parsed;
		}
		return 1;
	}

	let playbackRate = $state(loadSpeed());

	// Sync playbackRate to the audio element
	$effect(() => {
		if (audioElement) audioElement.playbackRate = playbackRate;
	});

	// Persist speed on change
	$effect(() => {
		if (browser) localStorage.setItem(SPEED_KEY, String(playbackRate));
	});

	function formatSpeed(rate: number): string {
		return rate === Math.floor(rate) ? `${rate}x` : `${rate}x`;
	}

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

	// Sync volume to the audio element
	$effect(() => {
		if (audioElement) audioElement.volume = volume;
	});

	// Persist volume on change
	$effect(() => {
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
			if (err instanceof ApiError && err.isQuotaExceeded) {
				playerVisible = false;
				onQuotaExceeded();
			} else {
				playerVisible = false;
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
	></audio>
{/if}

<!-- Speaker icon toggle (always visible, disabled until node text is ready) -->
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

<!-- Fixed bottom media bar -->
{#if playerVisible}
	<div
		class="media-bar fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 backdrop-blur-md"
		transition:fly={{ y: 64, duration: 300, easing: cubicOut }}
	>
		<div class="mx-auto flex max-w-4xl items-center gap-2 px-4 py-3 sm:gap-3">
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

				<!-- Volume control (desktop only) -->
				<div
					class="relative hidden shrink-0 items-center gap-1 sm:flex"
					role="group"
					aria-label="Volume controls"
				>
					<Button
						variant="ghost"
						size="icon-sm"
						onclick={toggleMute}
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

					<!-- Desktop: inline horizontal slider -->
					<input
						type="range"
						min="0"
						max="100"
						step="1"
						value={volumeProgress}
						oninput={handleVolumeChange}
						aria-label="Volume"
						class="volume-range h-1 w-16 cursor-pointer appearance-none rounded-full bg-muted"
						style="--vol-progress: {volumeProgress}%"
					/>
				</div>

				<!-- Speed control (desktop only) -->
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
									onclick={() => (playbackRate = speed)}
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

				<!-- Voice picker (desktop only) -->
				<div class="hidden sm:block">
					{#if voices.length > 0 && effectiveVoiceId}
						<VoicePicker
							{voices}
							selectedVoiceId={effectiveVoiceId}
							onSelect={handleVoiceSelect}
							onOpenChange={handleVoicePickerOpenChange}
						/>
					{/if}
				</div>
			{/if}

			<!-- Mobile: ellipsis menu with all controls -->
			<DropdownMenu.Root>
				<DropdownMenu.Trigger
					class="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:hidden"
					aria-label="Audio controls"
				>
					<EllipsisVertical class="h-4 w-4" />
				</DropdownMenu.Trigger>
				<DropdownMenu.Content side="top" align="end" class="w-56">
					{#if !isGenerating}
						<!-- Volume -->
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
										toggleMute();
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
									oninput={handleVolumeChange}
									aria-label="Volume"
									class="volume-range h-1 flex-1 cursor-pointer appearance-none rounded-full bg-muted"
									style="--vol-progress: {volumeProgress}%"
								/>
							</div>
						</DropdownMenu.Group>

						<DropdownMenu.Separator />

						<!-- Speed (sub-menu) -->
						<DropdownMenu.Sub>
							<DropdownMenu.SubTrigger class="[&>svg:last-child]:rotate-180">
								Speed: {formatSpeed(playbackRate)}
							</DropdownMenu.SubTrigger>
							<DropdownMenu.SubContent class="min-w-28">
								{#each SPEED_OPTIONS as speed (speed)}
									<DropdownMenu.Item
										class="cursor-pointer gap-2"
										onclick={() => (playbackRate = speed)}
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

						<!-- Voice (sub-menu) -->
						{#if voices.length > 0 && effectiveVoiceId}
							<DropdownMenu.Sub>
								<DropdownMenu.SubTrigger class="[&>svg:last-child]:rotate-180">
									Voice: {voices.find((v) => v.id === effectiveVoiceId)?.display_name ?? 'Select'}
								</DropdownMenu.SubTrigger>
								<DropdownMenu.SubContent class="min-w-36">
									{#each voices as voice (voice.id)}
										<DropdownMenu.Item
											class="cursor-pointer gap-2"
											onclick={() => handleVoiceSelect(voice.id)}
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

			<!-- Close button (desktop only) -->
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={handleClose}
				aria-label="Close player"
				class="hidden shrink-0 sm:flex"
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

	/* ── Volume slider: thumb ── */
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

	/* ── Volume slider: track ── */
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
