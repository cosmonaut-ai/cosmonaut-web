<script lang="ts">
	import { demoStory, startNodeId } from '$lib/data/demo-story';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { RotateCcw, ChevronRight } from '@lucide/svelte';
	import { fade } from 'svelte/transition';

	let currentNodeId = $state(startNodeId);
	let visitedPath = $state<string[]>([startNodeId]);
	let isTransitioning = $state(false);
	let displayedText = $state('');
	let isTyping = $state(true);

	const currentNode = $derived(demoStory[currentNodeId]);
	const isEnding = $derived(!currentNode?.choices || currentNode.choices.length === 0);

	// Typewriter effect
	$effect(() => {
		const text = currentNode?.text || '';
		displayedText = '';
		isTyping = true;

		let index = 0;
		const speed = 8;

		const interval = setInterval(() => {
			if (index < text.length) {
				displayedText = text.slice(0, index + 1);
				index++;
			} else {
				clearInterval(interval);
				isTyping = false;
			}
		}, speed);

		return () => clearInterval(interval);
	});

	function selectChoice(targetId: string) {
		if (isTransitioning || isTyping) return;

		isTransitioning = true;

		setTimeout(() => {
			currentNodeId = targetId;
			visitedPath = [...visitedPath, targetId];
			isTransitioning = false;
		}, 300);
	}

	function restart() {
		isTransitioning = true;
		setTimeout(() => {
			currentNodeId = startNodeId;
			visitedPath = [startNodeId];
			isTransitioning = false;
		}, 300);
	}

	function formatText(text: string): string {
		return text.replace(/\*([^*]+)\*/g, '<em class="text-primary/90">$1</em>');
	}
</script>

<section class="relative bg-background py-24">
	<!-- Subtle top fade for smoother transition from hero -->
	<div
		class="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-transparent to-background"
	></div>

	<!-- Bottom gradient to fade back to transparent starfield -->
	<div
		class="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-transparent to-background"
	></div>

	<div class="relative mx-auto max-w-4xl px-6">
		<!-- Section header -->
		<div class="mb-12 text-center">
			<p class="mb-3 text-sm font-medium tracking-widest text-primary uppercase">Try it yourself</p>
			<h2 class="mb-4 text-3xl font-bold text-foreground sm:text-4xl">Step Into a Story</h2>
			<p class="mx-auto max-w-xl text-muted-foreground">
				This is what it feels like. Make a choice. See what happens.
			</p>
		</div>

		<!-- Path breadcrumb -->
		<div class="mb-6 flex flex-wrap items-center justify-center gap-2 text-sm">
			{#each visitedPath as nodeId, i (nodeId + i)}
				<span
					class="rounded-full px-3 py-1 {i === visitedPath.length - 1
						? 'bg-primary/20 text-primary'
						: 'bg-muted text-muted-foreground'}"
				>
					{i === 0 ? 'Start' : `Choice ${i}`}
				</span>
				{#if i < visitedPath.length - 1}
					<ChevronRight class="h-4 w-4 text-muted-foreground/50" />
				{/if}
			{/each}
		</div>

		<!-- Story content - no absolute positioning -->
		{#key currentNodeId}
			<div
				in:fade={{ duration: 300, delay: 150 }}
				out:fade={{ duration: 150 }}
				class={isTransitioning ? 'opacity-50' : ''}
			>
				<Card class="border-l-4 border-l-primary bg-card">
					<CardContent class="p-6 sm:p-8">
						<!-- Story text -->
						<div
							class="prose prose-lg max-w-none font-mono leading-relaxed text-card-foreground prose-invert"
						>
							{#each displayedText.split('\n\n') as paragraph, i (i)}
								<p class="mb-4 last:mb-0">
									<!-- eslint-disable-next-line svelte/no-at-html-tags -->
									{@html formatText(paragraph)}
								</p>
							{/each}
							{#if isTyping}
								<span class="inline-block h-5 w-2 animate-pulse bg-primary"></span>
							{/if}
						</div>

						<!-- Choices -->
						{#if !isTyping && currentNode?.choices && currentNode.choices.length > 0}
							<div
								class="mt-8 space-y-3 border-t border-border pt-8"
								in:fade={{ duration: 300, delay: 100 }}
							>
								<p class="mb-4 text-sm font-medium tracking-wider text-muted-foreground uppercase">
									What do you do?
								</p>
								{#each currentNode.choices as choice, i (choice.targetId)}
									<button
										onclick={() => selectChoice(choice.targetId)}
										disabled={isTransitioning}
										class="group flex w-full items-center gap-4 rounded-lg border border-border bg-background/50 p-4 text-left transition-all hover:border-primary/50 hover:bg-primary/5 disabled:opacity-50"
									>
										<span
											class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/30 text-sm font-medium text-primary transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground"
										>
											{i + 1}
										</span>
										<span class="text-foreground">{choice.label}</span>
										<ChevronRight
											class="ml-auto h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary"
										/>
									</button>
								{/each}
							</div>
						{/if}

						<!-- Ending state -->
						{#if !isTyping && isEnding}
							<div
								class="mt-8 border-t border-border pt-8 text-center"
								in:fade={{ duration: 300, delay: 100 }}
							>
								<p class="mb-6 text-muted-foreground">✦ This path has ended ✦</p>
								<Button variant="outline" onclick={restart} class="gap-2">
									<RotateCcw class="h-4 w-4" />
									Explore Again
								</Button>
							</div>
						{/if}
					</CardContent>
				</Card>
			</div>
		{/key}

		<!-- Restart button -->
		{#if visitedPath.length > 1 && !isEnding}
			<div class="mt-6 text-center">
				<Button variant="ghost" size="sm" onclick={restart} class="gap-2 text-muted-foreground">
					<RotateCcw class="h-4 w-4" />
					Start Over
				</Button>
			</div>
		{/if}
	</div>
</section>
