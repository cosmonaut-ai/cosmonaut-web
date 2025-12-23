<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getWorlds, deleteWorld } from '$lib/api/client';
	import type { World } from '$lib/types/api';
	import WorldCard from '$lib/components/WorldCard.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	let worlds = $state<World[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		try {
			loading = true;
			error = null;
			worlds = await getWorlds();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load worlds';
			console.error('Error loading worlds:', err);
		} finally {
			loading = false;
		}
	});

	function handleCreateWorld() {
		goto('/worlds');
	}

	async function handleDeleteWorld(worldId: string) {
		try {
			error = null;
			await deleteWorld(worldId);
			// Remove the world from the list
			worlds = worlds.filter((w) => w.id !== worldId);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to delete world';
			console.error('Error deleting world:', err);
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto max-w-6xl px-4 py-8">
		<header class="mb-8">
			<div class="mb-4 flex items-center justify-between">
				<h1 class="text-4xl font-bold text-gray-900">Cosmonaut</h1>
				<button
					onclick={handleCreateWorld}
					class="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-700"
				>
					Create World
				</button>
			</div>
			<p class="text-gray-600">Explore interactive story worlds</p>
		</header>

		{#if loading}
			<div class="flex items-center justify-center py-12">
				<LoadingSpinner size="lg" />
			</div>
		{:else if error}
			<div class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
				<p class="text-red-800">Error: {error}</p>
				<button
					onclick={() => {
						loading = true;
						error = null;
						getWorlds()
							.then((w) => {
								worlds = w;
							})
							.catch((err) => {
								error = err instanceof Error ? err.message : 'Failed to load worlds';
							})
							.finally(() => {
								loading = false;
							});
					}}
					class="mt-2 text-red-600 underline hover:text-red-800"
				>
					Try again
				</button>
			</div>
		{:else if worlds.length === 0}
			<div class="rounded-lg bg-white py-12 text-center shadow-md">
				<p class="mb-4 text-gray-600">No worlds found.</p>
				<button
					onclick={handleCreateWorld}
					class="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
				>
					Create your first world
				</button>
			</div>
		{:else}
			<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
				{#each worlds as world (world.id)}
					<WorldCard {world} onDelete={handleDeleteWorld} />
				{/each}
			</div>
		{/if}
	</div>
</div>
