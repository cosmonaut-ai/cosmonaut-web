<script lang="ts">
	import { page } from '$app/state';
	import { getSessionContext } from '$lib/contexts/session';
	import StoryNodeView from '$lib/components/features/stories/StoryNodeView.svelte';

	const sessionId = $derived(page.params.sessionId!);
	const nodeId = $derived(page.params.nodeId!);

	const sessionQuery = getSessionContext();
	const session = $derived(sessionQuery.data);
	const rootNodeId = $derived(session?.world.root_node_id ?? null);
</script>

{#if session}
	<StoryNodeView {sessionId} {rootNodeId} {nodeId} />
{/if}
