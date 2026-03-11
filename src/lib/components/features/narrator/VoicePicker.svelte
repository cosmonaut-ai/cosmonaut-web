<script lang="ts">
	import type { Voice } from '$lib/types/api';
	import { Button } from '$lib/components/ui/button';
	import { Play, Pause, Check, ChevronUp } from '@lucide/svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	interface Props {
		voices: Voice[];
		selectedVoiceId: string;
		onSelect: (voiceId: string) => void;
		/** Fires when the popover opens or closes (used to pause/resume main audio) */
		onOpenChange?: (open: boolean) => void;
	}

	let { voices, selectedVoiceId, onSelect, onOpenChange }: Props = $props();

	let open = $state(false);
	let popoverEl = $state<HTMLDivElement | null>(null);

	// ── Sample audio playback ──
	let sampleAudio = $state<HTMLAudioElement | null>(null);
	let playingVoiceId = $state<string | null>(null);

	function toggleSample(voice: Voice, event: MouseEvent) {
		event.stopPropagation();

		if (playingVoiceId === voice.id) {
			sampleAudio?.pause();
			playingVoiceId = null;
			return;
		}

		// Stop any current sample and start new one
		stopSample();

		const audio = new Audio(voice.sample_url);
		audio.addEventListener('ended', handleSampleEnded);
		audio.play();
		sampleAudio = audio;
		playingVoiceId = voice.id;
	}

	function handleSampleEnded() {
		playingVoiceId = null;
	}

	function stopSample() {
		if (sampleAudio) {
			sampleAudio.pause();
			sampleAudio.removeEventListener('ended', handleSampleEnded);
			sampleAudio = null;
		}
		playingVoiceId = null;
	}

	function selectVoice(voiceId: string) {
		onSelect(voiceId);
		stopSample();
		open = false;
		onOpenChange?.(false);
	}

	function handleToggle() {
		if (open) {
			stopSample();
			open = false;
			onOpenChange?.(false);
		} else {
			open = true;
			onOpenChange?.(true);
		}
	}

	// Close on outside click
	function handleWindowClick(e: MouseEvent) {
		if (open && popoverEl && !popoverEl.contains(e.target as Node)) {
			stopSample();
			open = false;
			onOpenChange?.(false);
		}
	}

	// Cleanup on destroy
	$effect(() => {
		return () => {
			stopSample();
		};
	});

	const selectedVoice = $derived(voices.find((v) => v.id === selectedVoiceId));
</script>

<svelte:window onclick={handleWindowClick} />

<div bind:this={popoverEl} class="relative flex shrink-0 items-center">
	<button
		onclick={handleToggle}
		class="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
		aria-label="Select voice: {selectedVoice?.display_name ?? 'Voice'}"
		aria-expanded={open}
	>
		{selectedVoice?.display_name ?? 'Voice'}
		<ChevronUp class="h-3 w-3 transition-transform {open ? 'rotate-180' : ''}" />
	</button>

	{#if open}
		<div
			class="voice-picker absolute right-0 bottom-full z-10 mb-2 w-72 overflow-hidden rounded-lg border border-border bg-card/95 shadow-lg backdrop-blur-md"
			transition:fly={{ y: 8, duration: 200, easing: cubicOut }}
		>
			<div class="max-h-64 overflow-y-auto p-1">
				{#each voices as voice (voice.id)}
					<button
						class="flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-accent/50 {voice.id ===
						selectedVoiceId
							? 'bg-accent/30'
							: ''}"
						onclick={() => selectVoice(voice.id)}
					>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								{#if voice.id === selectedVoiceId}
									<Check class="h-3 w-3 shrink-0 text-primary" />
								{:else}
									<span class="h-3 w-3 shrink-0"></span>
								{/if}
								<span class="text-sm font-medium text-foreground">
									{voice.display_name}
								</span>
							</div>
							<p class="mt-0.5 line-clamp-2 pl-5 text-xs text-muted-foreground">
								{voice.description}
							</p>
						</div>
						<Button
							variant="ghost"
							size="icon-sm"
							onclick={(e: MouseEvent) => toggleSample(voice, e)}
							aria-label={playingVoiceId === voice.id
								? `Pause ${voice.display_name} sample`
								: `Play ${voice.display_name} sample`}
							class="mt-0.5 shrink-0"
						>
							{#if playingVoiceId === voice.id}
								<Pause class="h-3.5 w-3.5" />
							{:else}
								<Play class="h-3.5 w-3.5" />
							{/if}
						</Button>
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.voice-picker {
		filter: drop-shadow(0 -2px 8px oklch(0 0 0 / 0.15));
	}
</style>
