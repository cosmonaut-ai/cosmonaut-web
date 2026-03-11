<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import type { Choice } from '$lib/types/api';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Textarea } from '$lib/components/ui/textarea';
	import { ChevronRight, RotateCcw, Check, Sparkles, ArrowRight } from '@lucide/svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		text: string;
		choices?: Choice[];
		parentChoice?: Choice | null;
		isTyping?: boolean;
		isEnding?: boolean;
		isLoading?: boolean;
		isAtQuotaLimit?: boolean;
		showCustomChoice?: boolean;
		onChoiceSelect?: (choiceIndex: number) => void;
		onCustomChoice?: (text: string) => void;
		onRestart?: () => void;
	}

	let {
		text,
		choices = [],
		parentChoice = null,
		isTyping = false,
		isEnding = false,
		isLoading = false,
		isAtQuotaLimit = false,
		showCustomChoice = true,
		onChoiceSelect,
		onCustomChoice,
		onRestart
	}: Props = $props();

	const isDisabled = $derived(isLoading || isAtQuotaLimit);

	let customChoiceText = $state('');
	const MAX_CUSTOM_CHOICE_LENGTH = 200;

	function escapeHtml(text: string): string {
		return text
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#039;');
	}

	function formatText(content: string): string {
		return escapeHtml(content).replace(/\*([^*]+)\*/g, '<em class="text-primary/90">$1</em>');
	}

	function handleCustomChoice() {
		if (!customChoiceText.trim() || isLoading) return;
		onCustomChoice?.(customChoiceText.trim());
		customChoiceText = '';
	}

	// ── Typewriter flavor text ──
	const flavorPhrases = [
		'Weaving the threads of fate...',
		'The narrator takes a breath...',
		'Ink flows across parchment...',
		'Stars align above the page...',
		'A story stirs in the silence...',
		'Turning the cosmic gears...',
		'Conjuring words from the void...'
	];

	const prefersReducedMotion = browser
		? window.matchMedia('(prefers-reduced-motion: reduce)').matches
		: false;

	// Whether the typewriter should be active
	const showFlavor = $derived(isTyping && !text.trim());

	// Visible slice of the current phrase
	let flavorVisible = $state('');
	let flavorActive = false;
	let flavorTimer: ReturnType<typeof setTimeout> | null = null;

	function startTypewriter() {
		if (flavorActive || prefersReducedMotion) return;
		flavorActive = true;
		flavorVisible = '';
		let phraseIdx = Math.floor(Math.random() * flavorPhrases.length);
		let charIdx = 0;
		let phase: 'typing' | 'pause' | 'deleting' = 'typing';

		function tick() {
			if (!flavorActive) return;

			const phrase = flavorPhrases[phraseIdx];

			if (phase === 'typing') {
				charIdx++;
				flavorVisible = phrase.slice(0, charIdx);
				if (charIdx >= phrase.length) {
					phase = 'pause';
					flavorTimer = setTimeout(tick, 1500);
				} else {
					flavorTimer = setTimeout(tick, 45);
				}
			} else if (phase === 'pause') {
				phase = 'deleting';
				flavorTimer = setTimeout(tick, 25);
			} else {
				// deleting
				charIdx--;
				flavorVisible = phrase.slice(0, charIdx);
				if (charIdx <= 0) {
					phase = 'typing';
					phraseIdx = (phraseIdx + 1) % flavorPhrases.length;
					flavorTimer = setTimeout(tick, 300);
				} else {
					flavorTimer = setTimeout(tick, 25);
				}
			}
		}

		// Small initial delay before typing starts
		flavorTimer = setTimeout(tick, 400);
	}

	function stopTypewriter() {
		flavorActive = false;
		if (flavorTimer) {
			clearTimeout(flavorTimer);
			flavorTimer = null;
		}
		flavorVisible = '';
	}

	// Start/stop typewriter based on showFlavor
	$effect(() => {
		if (showFlavor) {
			startTypewriter();
		} else {
			stopTypewriter();
		}
	});

	// Cleanup on destroy
	onMount(() => {
		return () => stopTypewriter();
	});
</script>

<Card
	class="story-card rounded-none border-l-0 border-l-primary bg-card py-0 sm:rounded-lg sm:border-l-4"
>
	<CardContent class="p-3 sm:p-6 lg:p-8">
		<!-- Parent choice context -->
		{#if parentChoice}
			<div
				class="mb-6 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3"
			>
				<ArrowRight class="mt-0.5 h-4 w-4 shrink-0 text-primary" />
				<div class="min-w-0 text-sm">
					<span class="text-muted-foreground">You chose:</span>
					<span class="ml-1 font-medium text-foreground">{parentChoice.label}</span>
				</div>
			</div>
		{/if}

		<!-- Story text -->
		<div
			class="prose prose-base max-w-none leading-relaxed text-card-foreground prose-invert sm:prose-lg"
			aria-live="polite"
			aria-busy={isTyping}
		>
			{#if showFlavor}
				<!-- Typewriter flavor text while waiting for first token -->
				<p class="mb-4 last:mb-0">
					{#if prefersReducedMotion}
						<span class="flavor-text">Crafting your story...</span>
					{:else}
						<span class="flavor-text">{flavorVisible}</span>
					{/if}
					<span class="story-cursor" aria-hidden="true"></span>
					<span class="sr-only">Generating story text...</span>
				</p>
			{:else}
				{#each text.split('\n\n') as paragraph, i (i)}
					<p class="mb-4 last:mb-0">
						<!-- eslint-disable-next-line svelte/no-at-html-tags -->
						{@html formatText(paragraph)}
					</p>
				{/each}
				{#if isTyping}
					<span class="story-cursor" aria-hidden="true"></span>
					<span class="sr-only">Generating story text...</span>
				{/if}
			{/if}
		</div>

		<!-- Choices -->
		{#if !isTyping && choices.length > 0}
			<div
				class="mt-8 space-y-3 border-t border-border pt-8"
				in:fade={{ duration: 300, delay: 100 }}
			>
				<!-- Quota limit banner -->
				{#if isAtQuotaLimit}
					<div
						class="mb-4 flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3"
					>
						<Sparkles class="h-4 w-4 shrink-0 text-primary" />
						<p class="flex-1 text-sm text-muted-foreground">
							You've reached your generation limit for this period.
						</p>
						<Button
							variant="link"
							size="sm"
							class="h-auto shrink-0 gap-1.5 p-0 text-primary"
							onclick={() => goto('/pricing')}
						>
							View Plans
						</Button>
					</div>
				{/if}

				<p class="mb-4 text-sm font-medium tracking-wider text-muted-foreground uppercase">
					What do you do?
				</p>
				{#each choices as choice, i (choice.label)}
					{@const choiceDisabled = isLoading || (isAtQuotaLimit && !choice.is_created)}
					<button
						onclick={() => onChoiceSelect?.(i)}
						disabled={choiceDisabled}
						aria-label="Choose: {choice.label}{choice.is_created ? ' (already explored)' : ''}"
						class="story-choice group flex w-full items-center gap-4 rounded-lg border p-4 text-left
					{choiceDisabled
							? 'cursor-not-allowed opacity-50'
							: choice.is_created
								? 'border-muted bg-muted/30 opacity-60 hover:border-muted-foreground/30 hover:bg-muted/50 hover:opacity-80'
								: 'border-border bg-background/50 hover:border-primary/60 hover:bg-primary/5 hover:shadow-md hover:shadow-primary/5'}"
						style="--choice-delay: {i * 70}ms"
					>
						<span
							class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors {choice.is_created
								? 'border-muted-foreground/30 bg-muted text-muted-foreground group-hover:border-muted-foreground/50'
								: 'border-primary/30 text-primary group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground'}"
						>
							{#if choice.is_created}
								<Check class="h-4 w-4" />
							{:else}
								{i + 1}
							{/if}
						</span>
						<div class="flex flex-1 flex-wrap items-center gap-2">
							<span class={choice.is_created ? 'text-muted-foreground' : 'text-foreground'}
								>{choice.label}</span
							>
							{#if choice.is_created}
								<span
									class="shrink-0 rounded-full border border-muted-foreground/30 bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
								>
									Explored
								</span>
							{/if}
							{#if choice.is_custom}
								<span
									class="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
								>
									Custom
								</span>
							{/if}
						</div>
						<ChevronRight
							class="ml-auto h-5 w-5 transition-transform group-hover:translate-x-1 {choice.is_created
								? 'text-muted-foreground/50 group-hover:text-muted-foreground'
								: 'text-muted-foreground group-hover:text-primary'}"
						/>
					</button>
				{/each}

				<!-- Custom Choice Input -->
				{#if showCustomChoice && onCustomChoice && !isAtQuotaLimit}
					<div class="mt-6 border-t border-border pt-6">
						<p class="mb-3 text-sm font-medium text-muted-foreground">
							Or write your own action...
						</p>
						<div class="space-y-2">
							<Textarea
								bind:value={customChoiceText}
								maxlength={MAX_CUSTOM_CHOICE_LENGTH}
								disabled={isDisabled}
								placeholder="Describe what you want to do..."
								class="story-textarea min-h-20 resize-none"
							/>
							<div class="flex items-center justify-between">
								<span class="text-xs text-muted-foreground">
									{customChoiceText.length}/{MAX_CUSTOM_CHOICE_LENGTH}
								</span>
								<Button
									size="sm"
									onclick={handleCustomChoice}
									disabled={isDisabled || !customChoiceText.trim()}
								>
									{#if isLoading}
										<Spinner />
										Processing...
									{:else}
										Take Action
									{/if}
								</Button>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Ending state -->
		{#if !isTyping && isEnding}
			<div class="mt-8 border-t border-border pt-8" in:fade={{ duration: 300, delay: 100 }}>
				<div class="ending-hero relative overflow-hidden rounded-xl">
					<img
						src="/art/ending-sunset.webp"
						alt="Story ending illustration"
						class="h-48 w-full object-cover sm:h-56 lg:h-64"
					/>
					<div
						class="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/40 backdrop-blur-[2px]"
					>
						<p class="story-ending font-orbitron text-2xl text-white drop-shadow-lg">
							This path has ended
						</p>
						{#if onRestart}
							<Button
								variant="outline"
								onclick={onRestart}
								class="gap-2 border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
							>
								<RotateCcw class="h-4 w-4" />
								Start Over
							</Button>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- Loading state indicator -->
		{#if isLoading && !isTyping}
			<div
				class="mt-4 flex items-center gap-2 text-sm text-muted-foreground"
				role="status"
				aria-live="polite"
			>
				<Spinner class="h-4 w-4" aria-hidden="true" />
				<span>Generating story...</span>
			</div>
		{/if}
	</CardContent>
</Card>

<style>
	/* ── Typewriter flavor text ── */
	.flavor-text {
		font-style: italic;
		color: var(--muted-foreground);
	}

	/* ── Typing cursor — gold glow caret ── */
	.story-cursor {
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

	/* ── Choice button stagger entrance ── */
	.story-choice {
		animation: choice-enter 0.4s ease-out both;
		animation-delay: var(--choice-delay, 0ms);
		transition:
			border-color 0.2s ease,
			background-color 0.2s ease,
			box-shadow 0.25s ease,
			opacity 0.2s ease,
			transform 0.2s ease;
	}

	.story-choice:disabled {
		animation: none;
		pointer-events: none;
	}

	.story-choice:hover:not(:disabled) {
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

	/* ── Custom choice textarea focus glow ── */
	:global(.story-textarea:focus) {
		box-shadow: 0 0 0 2px oklch(from var(--primary) l c h / 0.2) !important;
	}

	/* ── Story card left border glow ── */
	:global(.story-card) {
		border-left-color: var(--primary) !important;
		background: linear-gradient(
			135deg,
			var(--card) 0%,
			oklch(from var(--primary) l c h / 0.02) 100%
		);
	}

	@media (min-width: 640px) {
		:global(.story-card) {
			box-shadow: -2px 0 16px oklch(from var(--primary) l c h / 0.08);
		}
	}

	/* ── Ending star flourish ── */
	.story-ending {
		text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
	}

	.story-star {
		display: inline-block;
		color: var(--primary);
		filter: brightness(1.3);
		animation: star-twinkle 2s ease-in-out infinite;
	}
	.story-star-1 {
		animation-delay: 0s;
	}
	.story-star-2 {
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
		.story-cursor {
			animation: none;
			opacity: 1;
		}
		.story-choice {
			animation: none;
			opacity: 1;
		}
		.story-choice:hover {
			transform: none;
		}
		.story-star {
			animation: none;
			opacity: 0.7;
		}
	}
</style>
