<script lang="ts">
	import { page } from '$app/state';
	import { useWorld } from '$lib/queries';
	import StoryNodeView from '$lib/components/features/stories/StoryNodeView.svelte';

	// Get worldId and nodeId from params (guaranteed to exist in this route)
	const worldId = page.params.worldId!;
	const nodeId = $derived(page.params.nodeId!);

	// Use TanStack Query for world data (cached from layout)
	const worldQuery = useWorld(worldId);

	// Derived world data
	const world = $derived(worldQuery.data);
</script>

<!-- WorldHeader is rendered by the layout -->
<!-- StoryNodeView handles its own loading/error states for node data -->
{#if world}
	<StoryNodeView {worldId} rootNodeId={world.root_node_id} {nodeId} />
{/if}
