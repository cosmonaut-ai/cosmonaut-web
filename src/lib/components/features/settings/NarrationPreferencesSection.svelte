<script lang="ts">
	import { useVoices } from '$lib/queries';
	import { getItem, setItem } from '$lib/utils/storage';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import * as Select from '$lib/components/ui/select';
	import { AudioLines, Play, Pause } from '@lucide/svelte';

	const VOICE_STORAGE_KEY = 'cosmonaut-audio-voice';
	const DEFAULT_VOICE_ID = 'theo';

	const voicesQuery = useVoices();
	const voices = $derived(voicesQuery.data ?? []);

	let selectedVoiceId = $state(getItem(VOICE_STORAGE_KEY) ?? DEFAULT_VOICE_ID);
	const selectedVoice = $derived(voices.find((v) => v.id === selectedVoiceId));

	let sampleAudio = $state<HTMLAudioElement | null>(null);
	let playingVoiceId = $state<string | null>(null);

	function handleVoiceChange(voiceId: string | undefined) {
		if (!voiceId) return;
		selectedVoiceId = voiceId;
		setItem(VOICE_STORAGE_KEY, voiceId);
		stopSample();
	}

	function toggleSample(event: MouseEvent) {
		event.stopPropagation();
		if (!selectedVoice) return;

		if (playingVoiceId === selectedVoice.id) {
			stopSample();
			return;
		}

		stopSample();
		const audio = new Audio(selectedVoice.sample_url);
		audio.addEventListener('ended', () => {
			playingVoiceId = null;
		});
		audio.play();
		sampleAudio = audio;
		playingVoiceId = selectedVoice.id;
	}

	function stopSample() {
		if (sampleAudio) {
			sampleAudio.pause();
			sampleAudio = null;
		}
		playingVoiceId = null;
	}
</script>

<Card>
	<CardHeader>
		<div class="flex items-center gap-2">
			<AudioLines class="h-5 w-5 text-primary" />
			<CardTitle>Narration</CardTitle>
		</div>
	</CardHeader>
	<CardContent>
		<div class="flex items-center justify-between gap-4">
			<div class="min-w-0 space-y-0.5">
				<p class="text-sm font-medium">Voice</p>
				{#if selectedVoice}
					<p class="truncate text-sm text-muted-foreground">{selectedVoice.description}</p>
				{/if}
			</div>
			<div class="flex shrink-0 items-center gap-2">
				{#if selectedVoice}
					<Button
						variant="ghost"
						size="icon-sm"
						onclick={toggleSample}
						aria-label={playingVoiceId === selectedVoice.id
							? `Pause ${selectedVoice.display_name} sample`
							: `Preview ${selectedVoice.display_name}`}
					>
						{#if playingVoiceId === selectedVoice.id}
							<Pause class="h-3.5 w-3.5" />
						{:else}
							<Play class="h-3.5 w-3.5" />
						{/if}
					</Button>
				{/if}
				<Select.Root
					type="single"
					value={selectedVoiceId}
					onValueChange={handleVoiceChange}
					disabled={voicesQuery.isLoading}
				>
					<Select.Trigger class="w-[140px]" disabled={voicesQuery.isLoading}>
						{selectedVoice?.display_name ?? 'Select voice'}
					</Select.Trigger>
					<Select.Content>
						{#each voices as voice (voice.id)}
							<Select.Item value={voice.id}>
								{voice.display_name}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
		</div>
	</CardContent>
</Card>
