<script lang="ts">
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import type { Choice } from '$lib/types/api';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import { RotateCcw, ArrowRight } from '@lucide/svelte';
	import { fade } from 'svelte/transition';
	import ChoiceList from './ChoiceList.svelte';

	interface Props {
		text: string;
		choices?: Choice[];
		parentChoice?: Choice | null;
		isTyping?: boolean;
		isEnding?: boolean;
		isLoading?: boolean;
		isAtQuotaLimit?: boolean;
		showCustomChoice?: boolean;
		onChoiceSelect?: (targetId: string) => void;
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

		{#if !isTyping && choices.length > 0}
			<ChoiceList
				{choices}
				{isLoading}
				{isAtQuotaLimit}
				{showCustomChoice}
				{onChoiceSelect}
				{onCustomChoice}
			/>
		{/if}

		<!-- Ending state -->
		{#if !isTyping && isEnding}
			<div class="mt-8 border-t border-border pt-8" in:fade={{ duration: 300, delay: 100 }}>
				<div class="ending-hero relative overflow-hidden rounded-xl">
					<img
						src="/art/ending-sunset.webp"
						alt="Story ending illustration"
						loading="lazy"
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

	@media (prefers-reduced-motion: reduce) {
		.story-cursor {
			animation: none;
			opacity: 1;
		}
	}
</style>
