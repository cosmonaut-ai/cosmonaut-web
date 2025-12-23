<script lang="ts">
	import { goto } from '$app/navigation';
	import { createWorld, generateLore, generateStartNode } from '$lib/api/client';
	import type { World } from '$lib/types/api';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	type Step = 'init' | 'lore' | 'start-node';

	let step = $state<Step>('init');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let world = $state<World | null>(null);

	// Form state
	let worldPrompt = $state('');
	let narratorProfile = $state('');
	let nodeTextLength = $state<number | undefined>(300);
	let visibility = $state('private');

	async function handleInitWorld() {
		if (!worldPrompt.trim()) {
			error = 'World prompt is required';
			return;
		}

		try {
			loading = true;
			error = null;
			world = await createWorld({
				world_prompt: worldPrompt.trim(),
				narrator_profile: narratorProfile.trim() || undefined,
				node_text_length: nodeTextLength || undefined,
				visibility: visibility || undefined
			});
			step = 'lore';
			// Automatically generate lore
			await handleGenerateLore();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create world';
			console.error('Error creating world:', err);
		} finally {
			loading = false;
		}
	}

	async function handleGenerateLore() {
		if (!world) return;

		try {
			loading = true;
			error = null;
			world = await generateLore(world.id);
			// Keep step at 'lore' so user can see the results and click the button
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to generate lore';
			console.error('Error generating lore:', err);
		} finally {
			loading = false;
		}
	}

	async function handleGenerateStartNode() {
		if (!world) return;

		try {
			loading = true;
			error = null;
			step = 'start-node';
			world = await generateStartNode(world.id);
			// Redirect to play page
			if (world.root_node_id) {
				goto(`/worlds/${world.id}`);
			} else {
				error = 'Start node was not generated. Please try again.';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to generate start node';
			console.error('Error generating start node:', err);
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto max-w-3xl px-4 py-8">
		<header class="mb-8">
			<h1 class="mb-2 text-4xl font-bold text-gray-900">Create a New World</h1>
			<p class="text-gray-600">Build your interactive story universe</p>
		</header>

		{#if error}
			<div class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
				<p class="text-red-800">{error}</p>
			</div>
		{/if}

		{#if step === 'init'}
			<div class="rounded-lg bg-white p-6 shadow-md">
				<h2 class="mb-4 text-2xl font-semibold">Step 1: Initialize World</h2>
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleInitWorld();
					}}
					class="space-y-4"
				>
					<div>
						<label for="world_prompt" class="mb-1 block text-sm font-medium text-gray-700">
							World Prompt <span class="text-red-500">*</span>
						</label>
						<textarea
							id="world_prompt"
							bind:value={worldPrompt}
							placeholder="Describe the world you want to create, e.g., 'A cyberpunk city where AI and humans coexist'"
							required
							class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
							rows="4"
						></textarea>
					</div>

					<div>
						<label for="narrator_profile" class="mb-1 block text-sm font-medium text-gray-700">
							Narrator Profile (optional)
						</label>
						<input
							id="narrator_profile"
							type="text"
							bind:value={narratorProfile}
							placeholder="e.g., 'gritty and noir', 'mysterious and atmospheric'"
							class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label for="node_text_length" class="mb-1 block text-sm font-medium text-gray-700">
							Node Text Length (optional)
						</label>
						<input
							id="node_text_length"
							type="number"
							bind:value={nodeTextLength}
							min="100"
							max="1000"
							class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
						/>
					</div>

					<div>
						<label for="visibility" class="mb-1 block text-sm font-medium text-gray-700">
							Visibility (optional)
						</label>
						<select
							id="visibility"
							bind:value={visibility}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
						>
							<option value="private">Private</option>
							<option value="public">Public</option>
						</select>
					</div>

					<div class="flex gap-4 pt-4">
						<button
							type="button"
							onclick={() => goto('/')}
							class="rounded-lg border border-gray-300 px-6 py-2 transition-colors hover:bg-gray-50"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading}
							class="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#if loading}
								<LoadingSpinner size="sm" />
							{/if}
							Create World
						</button>
					</div>
				</form>
			</div>
		{:else if step === 'lore'}
			<div class="rounded-lg bg-white p-6 shadow-md">
				<h2 class="mb-4 text-2xl font-semibold">Step 2: Generating Lore</h2>
				{#if loading}
					<div class="flex flex-col items-center justify-center py-12">
						<LoadingSpinner size="lg" />
						<p class="mt-4 text-gray-600">Generating world lore...</p>
					</div>
				{:else if world}
					<div class="space-y-4">
						{#if world.title}
							<div>
								<h3 class="text-lg font-semibold text-gray-700">Title</h3>
								<p class="text-gray-900">{world.title}</p>
							</div>
						{/if}

						{#if world.description}
							<div>
								<h3 class="text-lg font-semibold text-gray-700">Description</h3>
								<p class="text-gray-900">{world.description}</p>
							</div>
						{/if}

						{#if world.setting}
							<div>
								<h3 class="text-lg font-semibold text-gray-700">Setting</h3>
								<p class="whitespace-pre-wrap text-gray-900">{world.setting}</p>
							</div>
						{/if}

						{#if world.characters && world.characters.length > 0}
							<div>
								<h3 class="text-lg font-semibold text-gray-700">Characters</h3>
								<ul class="list-inside list-disc text-gray-900">
									{#each world.characters as character (character)}
										<li>{character}</li>
									{/each}
								</ul>
							</div>
						{/if}

						{#if world.story_background}
							<div>
								<h3 class="text-lg font-semibold text-gray-700">Story Background</h3>
								<p class="whitespace-pre-wrap text-gray-900">{world.story_background}</p>
							</div>
						{/if}

						<div class="pt-4">
							<button
								onclick={handleGenerateStartNode}
								disabled={loading}
								class="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
							>
								{#if loading}
									<LoadingSpinner size="sm" />
								{/if}
								Generate Start Node
							</button>
						</div>
					</div>
				{/if}
			</div>
		{:else if step === 'start-node'}
			<div class="rounded-lg bg-white p-6 shadow-md">
				<h2 class="mb-4 text-2xl font-semibold">Step 3: Generating Start Node</h2>
				{#if loading}
					<div class="flex flex-col items-center justify-center py-12">
						<LoadingSpinner size="lg" />
						<p class="mt-4 text-gray-600">Generating the opening scene...</p>
					</div>
				{:else if world && !world.root_node_id}
					<div class="space-y-4">
						<p class="text-gray-600">Start node generation failed or is still in progress.</p>
						<button
							onclick={handleGenerateStartNode}
							disabled={loading}
							class="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#if loading}
								<LoadingSpinner size="sm" />
							{/if}
							Try Again
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>
