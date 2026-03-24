<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useWorld, useWorldProgress } from '$lib/queries';
	import type { World } from '$lib/types/api';
	import WorldHomePage from '$lib/components/features/worlds/WorldHomePage.svelte';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Spinner } from '$lib/components/ui/spinner';

	const worldId = $derived(page.params.worldId!);

	// Check for node query parameter (from graph page navigation)
	const nodeIdFromUrl = $derived(page.url.searchParams.get('node'));

	const worldQuery = useWorld(() => worldId, {
		enablePolling: true
	});

	const progressQuery = useWorldProgress(() => worldId);
	const lastNodeId = $derived(progressQuery.data?.current_node_id ?? null);

	// Derived world data
	const world = $derived(worldQuery.data);
	const isWorldComplete = $derived(world?.generation_status === 'completed');

	// Only redirect when a specific node is requested via ?node= query param
	// (e.g. navigating back from the graph page to a specific story node)
	$effect(() => {
		if (isWorldComplete && nodeIdFromUrl) {
			goto(`/worlds/${worldId}/nodes/${nodeIdFromUrl}`, { replaceState: true });
		}
	});

	function handleWorldUpdate(_: World) {
		worldQuery.refetch();
	}
</script>

<!-- World home page when complete, loading state handled by layout -->
{#if isWorldComplete && !nodeIdFromUrl && world}
	<WorldHomePage {world} {lastNodeId} onWorldUpdate={handleWorldUpdate} />
{:else if isWorldComplete && nodeIdFromUrl}
	<main class="mx-auto max-w-4xl px-6 py-8">
		<Card>
			<CardContent class="flex items-center justify-center py-16">
				<div class="flex items-center gap-3 text-muted-foreground">
					<Spinner class="h-4 w-4" />
					<span>Loading story...</span>
				</div>
			</CardContent>
		</Card>
	</main>
{/if}
