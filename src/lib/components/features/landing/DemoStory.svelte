<script lang="ts">
	import { demoStory, startNodeId } from '$lib/data/demo-story';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { RotateCcw, ChevronRight } from '@lucide/svelte';
	import { fade } from 'svelte/transition';
	import { prefersReducedMotion } from '$lib/utils/media';
	import { trackEvent } from '$lib/utils/analytics';

	let currentNodeId = $state(startNodeId);
	let visitedPath = $state<string[]>([startNodeId]);
	let isTransitioning = $state(false);
	let displayedText = $state('');
	let isTyping = $state(true);

	/** Transition durations that respect motion preference */
	const fadeDuration = prefersReducedMotion ? 0 : 300;
	const fadeDelay = prefersReducedMotion ? 0 : 150;
	const choiceFadeDelay = prefersReducedMotion ? 0 : 100;
	const transitionDelay = prefersReducedMotion ? 0 : 300;

	const currentNode = $derived(demoStory[currentNodeId]);
	const isEnding = $derived(!currentNode?.choices || currentNode.choices.length === 0);

	// Typewriter effect (instant reveal when reduced motion is preferred)
	$effect(() => {
		const text = currentNode?.text || '';
		displayedText = '';
		isTyping = true;

		if (prefersReducedMotion) {
			// Instant reveal -- skip typewriter
			displayedText = text;
			isTyping = false;
			return;
		}

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
		trackEvent('demo_choice_made');

		isTransitioning = true;

		setTimeout(() => {
			currentNodeId = targetId;
			visitedPath = [...visitedPath, targetId];
			isTransitioning = false;
		}, transitionDelay);
	}

	function restart() {
		trackEvent('demo_restarted');
		isTransitioning = true;
		setTimeout(() => {
			currentNodeId = startNodeId;
			visitedPath = [startNodeId];
			isTransitioning = false;
		}, transitionDelay);
	}

	function escapeHtml(text: string): string {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

	function formatText(text: string): string {
		return escapeHtml(text).replace(/\*([^*]+)\*/g, '<em class="text-primary/90">$1</em>');
	}
</script>

<section class="relative bg-background py-24">
	<!-- Subtle top fade for smoother transition from hero -->
	<div
		class="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-transparent to-background"
	></div>

	<!-- Bottom gradient to fade back to transparent starfield -->
	<div
		class="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-transparent to-background"
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

		<!-- Path breadcrumb with connectors -->
		<div class="mb-6 flex flex-wrap items-center justify-center gap-1 text-sm">
			{#each visitedPath as nodeId, i (nodeId + i)}
				<span
					class="rounded-full px-3 py-1 transition-colors duration-300 {i === visitedPath.length - 1
						? 'bg-primary/20 text-primary'
						: 'bg-muted text-muted-foreground'}"
				>
					{i === 0 ? 'Start' : `Choice ${i}`}
				</span>
				{#if i < visitedPath.length - 1}
					<div class="demo-connector mx-0.5 flex items-center">
						<div class="h-px w-4 bg-primary/30"></div>
						<ChevronRight class="h-3 w-3 text-primary/40" />
					</div>
				{/if}
			{/each}
		</div>

		<!-- Story content - no absolute positioning -->
		{#key currentNodeId}
			<div
				in:fade={{ duration: fadeDuration, delay: fadeDelay }}
				out:fade={{ duration: prefersReducedMotion ? 0 : 150 }}
				class={isTransitioning ? 'opacity-50' : ''}
			>
				<Card class="demo-card border-l-4 border-l-primary bg-card">
					<CardContent class="p-6 sm:p-8">
						<!-- Story text -->
						<div
							class="prose prose-lg max-w-none font-mono leading-relaxed text-card-foreground prose-invert"
							aria-live="polite"
							aria-busy={isTyping}
						>
							{#each displayedText.split('\n\n') as paragraph, i (i)}
								<p class="mb-4 last:mb-0">
									<!-- eslint-disable-next-line svelte/no-at-html-tags -->
									{@html formatText(paragraph)}
								</p>
							{/each}
							{#if isTyping}
								<span class="demo-cursor" aria-hidden="true"></span>
							{/if}
						</div>

						<!-- Choices -->
						{#if !isTyping && currentNode?.choices && currentNode.choices.length > 0}
							<div
								class="mt-8 space-y-3 border-t border-border pt-8"
								in:fade={{ duration: fadeDuration, delay: choiceFadeDelay }}
							>
								<p class="mb-4 text-sm font-medium tracking-wider text-muted-foreground uppercase">
									What do you do?
								</p>
								{#each currentNode.choices as choice, i (choice.targetId)}
									<button
										onclick={() => selectChoice(choice.targetId)}
										disabled={isTransitioning}
										class="demo-choice group flex w-full items-center gap-4 rounded-lg border border-border bg-background/50 p-4 text-left disabled:opacity-50"
										style="--choice-delay: {i * 70}ms"
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
								in:fade={{ duration: fadeDuration, delay: choiceFadeDelay }}
							>
								<p class="demo-ending mb-6 text-muted-foreground">
									<span class="demo-star demo-star-1">✦</span>
									This path has reached its destination
									<span class="demo-star demo-star-2">✦</span>
								</p>
								<Button variant="outline" onclick={restart} class="gap-2">
									<RotateCcw class="h-4 w-4" />
									Chart a New Course
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

<style>
	/* ── Card left border glow ── */
	:global(.demo-card) {
		box-shadow: -2px 0 16px oklch(from var(--primary) l c h / 0.08);
	}

	/* ── Typing cursor - gold glow caret ── */
	.demo-cursor {
		display: inline-block;
		width: 2.5px;
		height: 1.15em;
		vertical-align: text-bottom;
		background: var(--primary);
		border-radius: 1px;
		animation: cursor-blink 1s steps(2) infinite;
		box-shadow:
			0 0 6px oklch(from var(--primary) l c h / 0.6),
			0 0 14px oklch(from var(--primary) l c h / 0.25);
	}

	@keyframes cursor-blink {
		0% {
			opacity: 1;
		}
		50% {
			opacity: 0;
		}
	}

	/* ── Choice button stagger ── */
	.demo-choice {
		animation: choice-enter 0.4s ease-out both;
		animation-delay: var(--choice-delay, 0ms);
		transition:
			border-color 0.2s ease,
			background-color 0.2s ease,
			box-shadow 0.25s ease,
			transform 0.2s ease;
	}

	.demo-choice:hover {
		border-color: oklch(from var(--primary) l c h / 0.5);
		background-color: oklch(from var(--primary) l c h / 0.05);
		box-shadow: 0 2px 12px oklch(from var(--primary) l c h / 0.08);
		transform: translateX(2px);
	}

	@keyframes choice-enter {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ── Breadcrumb connector ── */
	.demo-connector {
		animation: connector-fade 0.3s ease-out both;
	}

	@keyframes connector-fade {
		from {
			opacity: 0;
			transform: scaleX(0.5);
		}
		to {
			opacity: 1;
			transform: scaleX(1);
		}
	}

	/* ── Ending star flourish ── */
	.demo-star {
		display: inline-block;
		color: var(--primary);
		animation: star-twinkle 2s ease-in-out infinite;
	}
	.demo-star-1 {
		animation-delay: 0s;
	}
	.demo-star-2 {
		animation-delay: 1s;
	}

	@keyframes star-twinkle {
		0%,
		100% {
			opacity: 0.5;
			transform: scale(1);
		}
		50% {
			opacity: 1;
			transform: scale(1.2);
		}
	}

	/* ── Reduced motion ── */
	@media (prefers-reduced-motion: reduce) {
		.demo-cursor {
			animation: none;
			opacity: 1;
		}
		.demo-choice {
			animation: none;
			opacity: 1;
		}
		.demo-choice:hover {
			transform: none;
		}
		.demo-connector {
			animation: none;
		}
		.demo-star {
			animation: none;
			opacity: 0.7;
		}
	}
</style>
