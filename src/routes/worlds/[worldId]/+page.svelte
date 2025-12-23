<script lang="ts">
	import { goto } from '$app/navigation';
	import { getNode, makeChoice } from '$lib/api/client';
	import type { PageData } from './$types';
	import type { StoryNode } from '$lib/types/api';
	import StoryNodeComponent from '$lib/components/StoryNode.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	let { data }: { data: PageData } = $props();

	const initialNode = data.currentNode;
	const initialWorld = data.world;

	let currentNode = $state<StoryNode | null>(initialNode);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let world = $state(initialWorld);

	async function handleChoiceSelect(choiceIndex: number) {
		if (!currentNode || loading) return;

		try {
			loading = true;
			error = null;
			const newNode = await makeChoice(world.id, currentNode.id, choiceIndex);
			currentNode = newNode;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to make choice';
			console.error('Error making choice:', err);
		} finally {
			loading = false;
		}
	}

	async function handleBack() {
		if (!currentNode?.parent_id) return;

		try {
			loading = true;
			error = null;
			const parentNode = await getNode(world.id, currentNode.parent_id);
			currentNode = parentNode;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load parent node';
			console.error('Error loading parent node:', err);
		} finally {
			loading = false;
		}
	}

	function handleNavigateToNode(nodeId: string) {
		loading = true;
		getNode(world.id, nodeId)
			.then((node) => {
				currentNode = node;
				error = null;
			})
			.catch((err) => {
				error = err instanceof Error ? err.message : 'Failed to load node';
				console.error('Error loading node:', err);
			})
			.finally(() => {
				loading = false;
			});
	}
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto max-w-4xl px-4 py-8">
		<header class="mb-6">
			<div class="mb-4 flex items-center justify-between">
				<button
					onclick={() => goto('/')}
					class="flex items-center gap-2 text-gray-600 hover:text-gray-900"
				>
					← Back to Worlds
				</button>
				<button
					onclick={() => goto(`/worlds/${world.id}/map`)}
					class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
						/>
					</svg>
					View Story Map
				</button>
			</div>

			<h1 class="mb-2 text-4xl font-bold text-gray-900">
				{world.title || 'Untitled World'}
			</h1>
			{#if world.description}
				<p class="text-gray-600">{world.description}</p>
			{/if}
		</header>

		{#if error}
			<div class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
				<p class="text-red-800">{error}</p>
			</div>
		{/if}

		{#if currentNode?.ancestors && currentNode.ancestors.length > 0}
			<nav class="mb-6 rounded-lg bg-white p-4 shadow-md">
				<div class="flex flex-wrap items-center gap-2 text-sm text-gray-600">
					<span>Path:</span>
					{#each currentNode.ancestors as ancestorId, index (ancestorId)}
						<button
							onclick={() => handleNavigateToNode(ancestorId)}
							class="text-blue-600 underline hover:text-blue-800"
						>
							Node {index + 1}
						</button>
						{#if index < currentNode.ancestors.length - 1}
							<span>→</span>
						{/if}
					{/each}
					{#if currentNode}
						<span>→</span>
						<span class="font-semibold text-gray-900">Current</span>
					{/if}
				</div>
			</nav>
		{/if}

		{#if currentNode?.parent_id}
			<div class="mb-4">
				<button
					onclick={handleBack}
					disabled={loading}
					class="flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if loading}
						<LoadingSpinner size="sm" />
					{/if}
					← Back
				</button>
			</div>
		{/if}

		<StoryNodeComponent node={currentNode} onChoiceSelect={handleChoiceSelect} {loading} />
	</div>
</div>
