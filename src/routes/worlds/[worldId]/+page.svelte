<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useWorld } from '$lib/queries';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Spinner } from '$lib/components/ui/spinner';

	// Get worldId from params (guaranteed to exist in this route)
	const worldId = page.params.worldId!;

	// Check for node query parameter (from graph page navigation)
	const nodeIdFromUrl = $derived(page.url.searchParams.get('node'));

	// Use TanStack Query for world data
	const worldQuery = useWorld(worldId, {
		enablePolling: true
	});

	// Derived world data
	const world = $derived(worldQuery.data);
	const isWorldComplete = $derived(world?.generation_status === 'completed');

	// Redirect to node page when world is complete
	$effect(() => {
		if (isWorldComplete) {
			// Use node from URL if provided, otherwise use root node
			const targetNodeId = nodeIdFromUrl ?? world?.root_node_id;
			if (targetNodeId) {
				goto(`/worlds/${worldId}/nodes/${targetNodeId}`, { replaceState: true });
			}
		}
	});
</script>

<!-- This page handles redirect when world is complete -->
<!-- Loading/error/generation states are handled by the layout -->
{#if isWorldComplete}
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
