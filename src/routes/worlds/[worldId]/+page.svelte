<script lang="ts">
	import { goto, pushState } from '$app/navigation';
	import { navigating } from '$app/stores';
	import { page } from '$app/state';
	import { untrack } from 'svelte';
	import { getNode, makeChoiceStreaming } from '$lib/api/client';
	import type { PageData } from './$types';
	import type { StoryNode } from '$lib/types/api';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';
	import StreamingText from '$lib/components/StreamingText.svelte';

	let { data }: { data: PageData } = $props();

	let currentNode = $state<StoryNode | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	const world = $derived(data.world);

	// Sync state with data changes (e.g. from navigation or shallow routing)
	$effect(() => {
		const nodeFromState = page.state.currentNode;
		const dataNode = data.currentNode;

		untrack(() => {
			// 1. If we have state from pushState, that is the source of truth
			if (nodeFromState) {
				if (nodeFromState.id !== currentNode?.id) {
					currentNode = nodeFromState;
				}
				return;
			}

			// 2. If we are currently showing a node that we just streamed (it might not have an ID yet)
			// or if we are in the middle of a transition, don't let stale dataNode override it.
			if (currentNode && (currentNode.id === '' || isProcessingChoice || loading)) {
				return;
			}

			// 3. Only fall back to dataNode if we don't have page state
			// and the ID is different from what we're currently showing
			if (dataNode && dataNode.id !== currentNode?.id) {
				currentNode = dataNode;
			}
		});
	});

	// Streaming state
	let isStreaming = $state(false);
	let streamingText = $state('');
	let streamingDone = $state(false);
	let typewriterDone = $state(false);
	let pendingNode = $state<StoryNode | null>(null);

	const isNavigating = $derived(!!$navigating);
	const isProcessingChoice = $derived(isStreaming || (streamingDone && !typewriterDone));
	const isLoading = $derived(loading || isNavigating || isProcessingChoice);

	// Handle completion of typewriter effect
	$effect(() => {
		const node = pendingNode;
		if (typewriterDone && node) {
			untrack(() => {
				currentNode = node;
				if (node.id) {
					pushState(`?node=${node.id}`, { currentNode: node });
				}
				isStreaming = false;
				streamingText = '';
				streamingDone = false;
				typewriterDone = false;
				pendingNode = null;
			});
		}
	});

	async function handleChoiceSelect(choiceIndex: number) {
		if (!currentNode || loading || isProcessingChoice) return;

		const choice = currentNode.choices[choiceIndex];
		if (choice?.target) {
			handleNavigateToNode(choice.target);
			return;
		}

		try {
			loading = true;
			isStreaming = true;
			streamingText = '';
			streamingDone = false;
			typewriterDone = false;
			pendingNode = null;
			error = null;

			const newNode = await makeChoiceStreaming(
				world.id,
				currentNode.id,
				choiceIndex,
				(text, done) => {
					streamingText = text;
					if (done) streamingDone = true;
				}
			);

			isStreaming = false;
			// Store the node but don't display it yet - wait for typewriter
			pendingNode = newNode;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to make choice';
			console.error('Error making choice:', err);
			isStreaming = false;
			streamingText = '';
			streamingDone = false;
			typewriterDone = false;
		} finally {
			loading = false;
		}
	}

	async function handleBack() {
		if (!currentNode?.parent_id) return;
		goto(`?node=${currentNode.parent_id}`, { replaceState: false, noScroll: true });
	}

	function handleNavigateToNode(nodeId: string) {
		goto(`?node=${nodeId}`, { replaceState: false, noScroll: true });
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
					onclick={() =>
						goto(`/worlds/${world.id}/map${currentNode ? '?node=' + currentNode.id : ''}`)}
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
					disabled={isLoading}
					class="flex items-center gap-2 rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if isLoading && !isProcessingChoice}
						<LoadingSpinner size="sm" />
					{/if}
					← Back
				</button>
			</div>
		{/if}

		<!-- Story Node Display -->
		{#if isProcessingChoice}
			<!-- Streaming View with Typewriter Effect -->
			<article class="mb-6 rounded-lg bg-white p-6 shadow-md">
				<div class="prose prose-lg mb-6 max-w-none">
					<StreamingText
						text={streamingText}
						done={streamingDone}
						onComplete={() => {
							typewriterDone = true;
						}}
					/>
				</div>

				{#if isProcessingChoice}
					<div class="flex items-center gap-2 text-sm text-gray-500">
						<LoadingSpinner size="sm" />
						<span>Generating story...</span>
					</div>
				{/if}
			</article>
		{:else if isLoading && !currentNode}
			<div class="flex items-center justify-center py-12">
				<LoadingSpinner size="lg" />
			</div>
		{:else if currentNode}
			<article class="mb-6 rounded-lg bg-white p-6 shadow-md">
				{#if currentNode.title}
					<h2 class="mb-4 text-2xl font-bold text-gray-900">{currentNode.title}</h2>
				{/if}

				<div class="prose prose-lg mb-6 max-w-none">
					<StreamingText text={currentNode.text} done={true} />
				</div>

				{#if currentNode.choices && currentNode.choices.length > 0}
					<div class="mt-6 space-y-3">
						{#each currentNode.choices as choice, index (index)}
							<button
								onclick={() => handleChoiceSelect(index)}
								disabled={isLoading}
								class="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-left transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
							>
								<span class="text-gray-900">{choice.label}</span>
								{#if choice.target === null}
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
	</div>
</div>
