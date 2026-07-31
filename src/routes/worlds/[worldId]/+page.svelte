<script lang="ts">
	import { page } from '$app/state';
	import { getWorldContext } from '$lib/contexts/world';
	import type { World } from '$lib/types/api';
	import WorldHomePage from '$lib/components/features/worlds/WorldHomePage.svelte';

	const inviteToken = $derived(page.url.searchParams.get('invite'));
	const worldQuery = getWorldContext();

	// Derived world data
	const world = $derived(worldQuery.data);
	const isWorldComplete = $derived(world?.generation_status === 'completed');

	function handleWorldUpdate(_: World) {
		worldQuery.refetch();
	}
</script>

<!-- World home page when complete, loading state handled by layout -->
{#if isWorldComplete && world}
	<WorldHomePage {world} {inviteToken} onWorldUpdate={handleWorldUpdate} />
{/if}
