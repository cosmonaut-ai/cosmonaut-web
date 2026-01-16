<script lang="ts">
	import type { Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useWorld } from '$lib/queries';
	import type { World } from '$lib/types/api';
	import WorldHeader from '$lib/components/story/WorldHeader.svelte';
	import WorldGenerationProgress from '$lib/components/story/WorldGenerationProgress.svelte';
	import WorldGenerationFailed from '$lib/components/story/WorldGenerationFailed.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// Get worldId from params (guaranteed to exist in this route)
	const worldId = $derived(page.params.worldId!);

	// Determine if we're on the graph page (which has its own full-screen layout)
	const isGraphPage = $derived(page.url.pathname.includes('/graph'));
	const isMapPage = $derived(page.url.pathname.includes('/map'));
	const isMainWorldPage = $derived(
		page.url.pathname === `/worlds/${worldId}` || page.url.pathname === `/worlds/${worldId}/`
	);

	// Use TanStack Query for world data with polling for generation status
	const worldQuery = useWorld(worldId, {
		enablePolling: true
	});

	// Derived world data
	const world = $derived(worldQuery.data);
	const isWorldLoading = $derived(worldQuery.isLoading);
	const isWorldComplete = $derived(world?.generation_status === 'completed');
	const isWorldFailed = $derived(world?.generation_status === 'failed');
	const generationStatus = $derived(world?.generation_status ?? 'initialized');

	function handleWorldUpdate(_: World) {
		// Invalidate the world query to refresh data
		worldQuery.refetch();
	}
</script>

<svelte:head>
	<title>{world?.title || 'World'} - Cosmonaut</title>
	<meta name="description" content={world?.description || 'Explore an interactive story world.'} />
</svelte:head>

{#if isWorldLoading}
	<!-- Loading world data -->
	<div class="h-full overflow-y-auto bg-background">
		<header class="border-b border-border bg-card/50">
			<div class="mx-auto flex max-w-3xl items-center gap-4 px-6 py-4">
				<Skeleton class="h-8 w-20" />
				<div class="h-4 w-px bg-border"></div>
				<Skeleton class="h-6 w-48" />
			</div>
		</header>
		<main class="mx-auto max-w-4xl px-6 py-8">
			<Card>
				<CardContent class="flex items-center justify-center py-16">
					<Spinner class="h-8 w-8" />
				</CardContent>
			</Card>
		</main>
	</div>
{:else if !world}
	<!-- World not found -->
	<div class="h-full overflow-y-auto bg-background">
		<main class="mx-auto max-w-3xl px-6 py-12">
			<Card class="border-destructive/50">
				<CardContent class="py-12 text-center">
					<p class="mb-4 text-muted-foreground">World not found.</p>
					<Button onclick={() => goto('/dashboard')}>Return to Dashboard</Button>
				</CardContent>
			</Card>
		</main>
	</div>
{:else if !isWorldComplete && !isWorldFailed}
	<!-- World Generation Progress View -->
	<div class="h-full overflow-y-auto bg-background">
		<WorldGenerationProgress {generationStatus} />
	</div>
{:else if isWorldFailed}
	<!-- World Generation Failed View -->
	<div class="h-full overflow-y-auto bg-background">
		<WorldGenerationFailed />
	</div>
{:else if isGraphPage || isMapPage}
	<!-- Graph/Map pages handle their own layout (full screen) -->
	<div class="flex h-full flex-col bg-background">
		<WorldHeader {world} onWorldUpdate={handleWorldUpdate} />
		<div class="min-h-0 flex-1">
			{@render children()}
		</div>
	</div>
{:else if isMainWorldPage}
	<!-- Main world page just needs to redirect -->
	<div class="h-full overflow-y-auto bg-background">
		{@render children()}
	</div>
{:else}
	<!-- Story pages with scrollable content -->
	<div class="h-full overflow-y-auto bg-background">
		<WorldHeader {world} onWorldUpdate={handleWorldUpdate} />
		{@render children()}
	</div>
{/if}
