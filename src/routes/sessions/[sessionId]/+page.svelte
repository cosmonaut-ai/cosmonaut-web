<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { getSessionContext } from '$lib/contexts/session';
	import type { World } from '$lib/types/api';
	import WorldHomePage from '$lib/components/features/worlds/WorldHomePage.svelte';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Spinner } from '$lib/components/ui/spinner';

	const sessionId = $derived(page.params.sessionId!);
	const nodeIdFromUrl = $derived(page.url.searchParams.get('node'));
	const sessionQuery = getSessionContext();

	const session = $derived(sessionQuery.data);
	const world = $derived(session?.world);
	const isWorldComplete = $derived(world?.generation_status === 'completed');

	$effect(() => {
		if (isWorldComplete && nodeIdFromUrl) {
			goto(`/sessions/${sessionId}/nodes/${nodeIdFromUrl}`, { replaceState: true });
		}
	});

	function handleWorldUpdate(_: World) {
		sessionQuery.refetch();
	}
</script>

{#if isWorldComplete && !nodeIdFromUrl && session && world}
	<WorldHomePage {world} {session} onWorldUpdate={handleWorldUpdate} />
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
