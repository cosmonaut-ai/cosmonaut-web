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

	/** Transition durations that respect motion preference */
	const fadeDuration = prefersReducedMotion ? 0 : 300;
	const fadeDelay = prefersReducedMotion ? 0 : 150;
	const choiceFadeDelay = prefersReducedMotion ? 0 : 100;
	const transitionDelay = prefersReducedMotion ? 0 : 300;

	const currentNode = $derived(demoStory[currentNodeId]);
	const isEnding = $derived(!currentNode?.choices || currentNode.choices.length === 0);

	function selectChoice(targetId: string) {
		if (isTransitioning) return;
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

<section class="story-lab relative overflow-hidden py-24 text-[#f7f1e3] sm:py-28">
	<div class="relative mx-auto max-w-6xl px-6">
		<div class="mb-12 grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:items-end">
			<div>
				<p class="mb-4 text-sm font-semibold tracking-[0.18em] text-[#f3d98b] uppercase">
					Try it for yourself
				</p>
				<h2 class="max-w-xl text-4xl leading-tight font-semibold text-[#fff8e8] sm:text-5xl">
					A story should feel read, not generated.
				</h2>
			</div>
			<p class="max-w-2xl text-lg leading-8 text-[#b6c4cd] md:justify-self-end">
				This is a real Cosmonaut story. Make a few choices and see how it feels to read something
				branching, not generated paragraph-by-paragraph.
			</p>
		</div>

		<!-- Path breadcrumb with connectors -->
		<div class="mb-6 flex flex-wrap items-center justify-center gap-1 text-sm">
			{#each visitedPath as nodeId, i (nodeId + i)}
				<span
					class="rounded-full px-3 py-1 transition-colors duration-300 {i === visitedPath.length - 1
						? 'bg-[#f3d98b] text-[#172230]'
						: 'bg-[#20303f] text-[#b6c4cd]'}"
				>
					{i === 0 ? 'Start' : `Choice ${i}`}
				</span>
				{#if i < visitedPath.length - 1}
					<div class="demo-connector mx-0.5 flex items-center">
						<div class="h-px w-4 bg-[#42576a]"></div>
						<ChevronRight class="h-3 w-3 text-[#6f8191]" />
					</div>
				{/if}
			{/each}
		</div>

		<!-- Story content - no absolute positioning -->
		{#key currentNodeId}
			<div class="-mx-6 sm:mx-0">
				<div
					in:fade={{ duration: fadeDuration, delay: fadeDelay }}
					out:fade={{ duration: prefersReducedMotion ? 0 : 150 }}
					class={isTransitioning ? 'opacity-50' : ''}
				>
					<Card class="demo-card rounded-none py-0 sm:rounded-lg">
						<CardContent class="p-5 sm:p-8 lg:p-10">
							<!-- Story text -->
							<div
								class="prose prose-base max-w-none leading-relaxed text-[#e8eef2] prose-invert sm:prose-lg"
								aria-live="polite"
							>
								{#each (currentNode?.text || '').split('\n\n') as paragraph, i (i)}
									<p class="mb-4 last:mb-0">
										<!-- eslint-disable-next-line svelte/no-at-html-tags -->
										{@html formatText(paragraph)}
									</p>
								{/each}
							</div>

							<!-- Choices -->
							{#if currentNode?.choices && currentNode.choices.length > 0}
								<div
									class="mt-8 space-y-4 border-t border-[#314354] pt-8"
									in:fade={{ duration: fadeDuration, delay: choiceFadeDelay }}
								>
									<p class="mb-4 text-sm font-semibold tracking-[0.16em] text-[#9caab6] uppercase">
										What do you do?
									</p>
									{#each currentNode.choices as choice, i (choice.targetId)}
										<button
											onclick={() => selectChoice(choice.targetId)}
											disabled={isTransitioning}
											class="demo-choice group flex w-full items-center gap-4 rounded-lg border border-[#314354] bg-[#101923] p-4 text-left disabled:opacity-50"
											style="--choice-delay: {i * 70}ms"
										>
											<span
												class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#5b6f81] text-sm font-semibold text-[#f3d98b] transition-colors group-hover:border-[#f3d98b] group-hover:bg-[#f3d98b] group-hover:text-[#172230]"
											>
												{i + 1}
											</span>
											<span class="text-[#f7f1e3]">{choice.label}</span>
											<ChevronRight
												class="ml-auto h-5 w-5 text-[#8fa0ad] transition-transform group-hover:translate-x-1 group-hover:text-[#f3d98b]"
											/>
										</button>
									{/each}
								</div>
							{/if}

							<!-- Ending state -->
							{#if isEnding}
								<div
									class="mt-8 border-t border-[#314354] pt-8 text-center"
									in:fade={{ duration: fadeDuration, delay: choiceFadeDelay }}
								>
									<p class="demo-ending mb-6 text-[#b6c4cd]">
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
			</div>
		{/key}

		<!-- Restart button -->
		{#if visitedPath.length > 1 && !isEnding}
			<div class="mt-6 text-center">
				<Button variant="ghost" size="sm" onclick={restart} class="gap-2 text-[#b6c4cd]">
					<RotateCcw class="h-4 w-4" />
					Start Over
				</Button>
			</div>
		{/if}
	</div>
</section>

<style>
	.story-lab {
		background: var(--background);
	}

	/* ── Card background ── */
	:global(.demo-card) {
		border: 1px solid #314354;
		background: linear-gradient(180deg, rgba(32, 48, 63, 0.92), rgba(23, 37, 52, 0.98)), #172534;
		box-shadow:
			0 28px 70px rgba(0, 0, 0, 0.28),
			0 1px 0 rgba(255, 255, 255, 0.04) inset;
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
		border-color: #f3d98b;
		background-color: #142130;
		box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
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
		color: #7d642b;
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
