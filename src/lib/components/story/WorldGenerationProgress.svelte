<script lang="ts">
	import { goto } from '$app/navigation';
	import type { GenerationStatus } from '$lib/types/api';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Sparkles, Check, ArrowLeft } from '@lucide/svelte';

	interface Props {
		generationStatus: GenerationStatus;
	}

	let { generationStatus }: Props = $props();

	// Status steps for the progress display
	const generationStatuses: GenerationStatus[] = [
		'initialized',
		'generating_lore',
		'generating_narrator_profile',
		'completed'
	];

	function getStatusMessage(status: GenerationStatus): string {
		switch (status) {
			case 'initialized':
				return 'Initializing world...';
			case 'generating_lore':
				return 'Generating world lore and setting...';
			case 'generating_narrator_profile':
				return 'Creating narrative voice...';
			case 'completed':
				return 'World created successfully!';
			case 'failed':
				return 'World generation failed';
			default:
				return 'Processing...';
		}
	}

	function getStatusProgress(status: GenerationStatus): number {
		switch (status) {
			case 'initialized':
				return 10;
			case 'generating_lore':
				return 40;
			case 'generating_narrator_profile':
				return 70;
			case 'completed':
				return 100;
			case 'failed':
				return 100;
			default:
				return 0;
		}
	}

	function isGenerationStatusComplete(status: GenerationStatus): boolean {
		return (
			getStatusProgress(generationStatus) > getStatusProgress(status) ||
			generationStatus === 'completed'
		);
	}

	function isGenerationStatusActive(status: GenerationStatus): boolean {
		return status === generationStatus;
	}
</script>

<div class="h-full overflow-y-auto bg-background">
	<header class="border-b border-border bg-card/50">
		<div class="mx-auto flex max-w-3xl items-center gap-4 px-6 py-4">
			<Button variant="ghost" size="sm" onclick={() => goto('/dashboard')} class="gap-2">
				<ArrowLeft class="h-4 w-4" />
				Back
			</Button>
			<div class="h-4 w-px bg-border"></div>
			<div class="flex items-center gap-2">
				<Sparkles class="h-5 w-5 text-primary" />
				<span class="font-semibold text-foreground">Creating Your World</span>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-3xl px-6 py-12">
		<Card>
			<CardContent class="py-12">
				<div class="flex flex-col items-center">
					<!-- Animated icon -->
					<div
						class="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10"
					>
						<Sparkles class="h-10 w-10 animate-pulse text-primary" />
					</div>

					<h2 class="mb-2 text-2xl font-bold text-foreground">Creating Your World</h2>
					<p class="mb-8 text-muted-foreground">{getStatusMessage(generationStatus)}</p>

					<!-- Progress Bar -->
					<div class="mb-8 w-full max-w-md">
						<div class="h-2 w-full overflow-hidden rounded-full bg-secondary">
							<div
								class="h-full rounded-full bg-primary transition-all duration-500"
								style="width: {getStatusProgress(generationStatus)}%"
							></div>
						</div>
					</div>

					<!-- Status Steps -->
					<div class="w-full max-w-md space-y-3">
						{#each generationStatuses as status (status)}
							{@const isActive = isGenerationStatusActive(status)}
							{@const isComplete = isGenerationStatusComplete(status)}
							<div
								class="flex items-center gap-4 rounded-lg px-4 py-3 transition-colors {isActive
									? 'bg-primary/10'
									: ''}"
							>
								<div
									class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors {isComplete
										? 'bg-primary text-primary-foreground'
										: isActive
											? 'border-2 border-primary bg-primary/20'
											: 'border border-border bg-secondary'}"
								>
									{#if isComplete}
										<Check class="h-4 w-4" />
									{:else if isActive}
										<div class="h-2 w-2 animate-pulse rounded-full bg-primary"></div>
									{:else}
										<div class="h-2 w-2 rounded-full bg-muted-foreground/50"></div>
									{/if}
								</div>
								<span
									class="text-sm {isActive
										? 'font-medium text-foreground'
										: isComplete
											? 'text-primary'
											: 'text-muted-foreground'}"
								>
									{getStatusMessage(status)}
								</span>
							</div>
						{/each}
					</div>
				</div>
			</CardContent>
		</Card>
	</main>
</div>
