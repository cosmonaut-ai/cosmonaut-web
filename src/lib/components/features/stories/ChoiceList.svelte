<script lang="ts">
	import { goto } from '$app/navigation';
	import type { Choice } from '$lib/types/api';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Textarea } from '$lib/components/ui/textarea';
	import { ChevronRight, Check, Sparkles } from '@lucide/svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		choices: Choice[];
		isLoading?: boolean;
		isAtQuotaLimit?: boolean;
		showCustomChoice?: boolean;
		onChoiceSelect?: (choiceIndex: number) => void;
		onCustomChoice?: (text: string) => void;
	}

	let {
		choices,
		isLoading = false,
		isAtQuotaLimit = false,
		showCustomChoice = true,
		onChoiceSelect,
		onCustomChoice
	}: Props = $props();

	const isDisabled = $derived(isLoading || isAtQuotaLimit);

	let customChoiceText = $state('');
	const MAX_CUSTOM_CHOICE_LENGTH = 200;

	function handleCustomChoice() {
		if (!customChoiceText.trim() || isLoading) return;
		onCustomChoice?.(customChoiceText.trim());
		customChoiceText = '';
	}
</script>

<div class="mt-8 space-y-3 border-t border-border pt-8" in:fade={{ duration: 300, delay: 100 }}>
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
	{#each choices as choice, i (i)}
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
				{#if choice.is_custom && choice.creator_display_name}
					<span class="shrink-0 text-xs text-muted-foreground">
						by {choice.creator_display_name}
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

	{#if showCustomChoice && onCustomChoice && !isAtQuotaLimit}
		<div class="mt-6 border-t border-border pt-6">
			<p class="mb-3 text-sm font-medium text-muted-foreground">Or write your own action...</p>
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

<style>
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

	:global(.story-textarea:focus) {
		box-shadow: 0 0 0 2px oklch(from var(--primary) l c h / 0.2) !important;
	}

	@media (prefers-reduced-motion: reduce) {
		.story-choice {
			animation: none;
			opacity: 1;
		}
		.story-choice:hover {
			transform: none;
		}
	}
</style>
