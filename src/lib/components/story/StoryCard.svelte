<script lang="ts">
	import type { Choice } from '$lib/types/api';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Textarea } from '$lib/components/ui/textarea';
	import { ChevronRight, RotateCcw, Check } from '@lucide/svelte';
	import { fade } from 'svelte/transition';

	interface Props {
		text: string;
		choices?: Choice[];
		isTyping?: boolean;
		isEnding?: boolean;
		isLoading?: boolean;
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
		showCustomChoice = true,
		onChoiceSelect,
		onCustomChoice,
		onRestart
	}: Props = $props();

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

<Card class="rounded-none border-l-0 border-l-primary bg-card sm:rounded-lg sm:border-l-4">
	<CardContent class="p-6 sm:p-8">
		<!-- Story text -->
		<div
			class="prose prose-sm max-w-none font-mono leading-relaxed text-card-foreground prose-invert sm:prose-lg"
		>
			{#each text.split('\n\n') as paragraph, i (i)}
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
		{#if !isTyping && choices.length > 0}
			<div
				class="mt-8 space-y-3 border-t border-border pt-8"
				in:fade={{ duration: 300, delay: 100 }}
			>
				<p class="mb-4 text-sm font-medium tracking-wider text-muted-foreground uppercase">
					What do you do?
				</p>
				{#each choices as choice, i (choice.label)}
					<button
						onclick={() => onChoiceSelect?.(i)}
						disabled={isLoading}
						class="group flex w-full items-center gap-4 rounded-lg border p-4 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50 {choice.is_created
							? 'border-muted bg-muted/30 hover:border-muted-foreground/30 hover:bg-muted/50'
							: 'border-border bg-background/50 hover:border-primary/50 hover:bg-primary/5'}"
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
				{#if showCustomChoice && onCustomChoice}
					<div class="mt-6 border-t border-border pt-6">
						<p class="mb-3 text-sm font-medium text-muted-foreground">
							Or write your own action...
						</p>
						<div class="space-y-2">
							<Textarea
								bind:value={customChoiceText}
								maxlength={MAX_CUSTOM_CHOICE_LENGTH}
								disabled={isLoading}
								placeholder="Describe what you want to do..."
								class="min-h-20 resize-none font-mono"
							/>
							<div class="flex items-center justify-between">
								<span class="text-xs text-muted-foreground">
									{customChoiceText.length}/{MAX_CUSTOM_CHOICE_LENGTH}
								</span>
								<Button
									size="sm"
									onclick={handleCustomChoice}
									disabled={isLoading || !customChoiceText.trim()}
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
				<p class="mb-6 text-muted-foreground">✦ This path has ended ✦</p>
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
			<div class="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
				<Spinner class="h-4 w-4" />
				<span>Generating story...</span>
			</div>
		{/if}
	</CardContent>
</Card>
