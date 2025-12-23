<script lang="ts">
	import type { StoryNode } from '$lib/types/api';
	import LoadingSpinner from './LoadingSpinner.svelte';

	let {
		node,
		onChoiceSelect,
		loading = false
	} = $props<{
		node: StoryNode | null;
		onChoiceSelect: (choiceIndex: number) => void;
		loading?: boolean;
	}>();
</script>

{#if loading && !node}
	<div class="flex items-center justify-center py-12">
		<LoadingSpinner size="lg" />
	</div>
{:else if node}
	<article class="mb-6 rounded-lg bg-white p-6 shadow-md">
		{#if node.title}
			<h2 class="mb-4 text-2xl font-bold text-gray-900">{node.title}</h2>
		{/if}

		<div class="prose prose-lg mb-6 max-w-none">
			<p class="leading-relaxed whitespace-pre-wrap text-gray-700">{node.text}</p>
		</div>

		{#if node.choices && node.choices.length > 0}
			<div class="mt-6 space-y-3">
				{#each node.choices as choice, index (index)}
					<button
						onclick={() => onChoiceSelect(index)}
						disabled={loading}
						class="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
					>
						<span class="text-gray-900">{choice.label}</span>
						{#if loading && choice.target === null}
							<LoadingSpinner size="sm" />
						{:else if choice.target === null}
							<span class="text-sm text-gray-400">→</span>
						{/if}
					</button>
				{/each}
			</div>
		{:else}
			<div class="py-4 text-center text-gray-500 italic">The story ends here.</div>
		{/if}
	</article>
{:else}
	<div class="py-12 text-center text-gray-500">No story node available.</div>
{/if}
