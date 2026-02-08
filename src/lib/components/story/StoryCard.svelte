<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Choice } from '$lib/types/api';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Textarea } from '$lib/components/ui/textarea';
	import { ChevronRight, RotateCcw, Check, Sparkles } from '@lucide/svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		text: string;
		choices?: Choice[];
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

	function formatText(content: string): string {
		return content.replace(/\*([^*]+)\*/g, '<em class="text-primary/90">$1</em>');
	}

	function handleCustomChoice() {
		if (!customChoiceText.trim() || isLoading) return;
		onCustomChoice?.(customChoiceText.trim());
		customChoiceText = '';
	}
</script>

<Card
	class="story-card rounded-none border-l-0 border-l-primary bg-card sm:rounded-lg sm:border-l-4"
>
	<CardContent class="p-6 sm:p-8">
		<!-- Story text -->
		<div
			class="prose prose-sm max-w-none leading-relaxed text-card-foreground prose-invert sm:prose-lg"
			aria-live="polite"
			aria-busy={isTyping}
		>
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
			<div
				class="mt-8 border-t border-border pt-8 text-center"
				in:fade={{ duration: 300, delay: 100 }}
			>
				<p class="story-ending mb-6 text-muted-foreground">
					<span class="story-star story-star-1">✦</span>
					This path has ended
					<span class="story-star story-star-2">✦</span>
				</p>
				{#if onRestart}
					<Button variant="outline" onclick={onRestart} class="gap-2">
						<RotateCcw class="h-4 w-4" />
						Start Over
					</Button>
				{/if}
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
	}

	@media (min-width: 640px) {
		:global(.story-card) {
			box-shadow: -2px 0 12px oklch(from var(--primary) l c h / 0.06);
		}
	}

	/* ── Ending star flourish ── */
	.story-star {
		display: inline-block;
		color: var(--primary);
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
