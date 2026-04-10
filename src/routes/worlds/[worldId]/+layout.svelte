<script lang="ts">
	import type { Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useWorld } from '$lib/queries';
	import { setWorldContext } from '$lib/contexts/world';
	import { ApiError } from '$lib/types/api';
	import WorldHeader from '$lib/components/features/worlds/WorldHeader.svelte';
	import WorldGenerationProgress from '$lib/components/features/worlds/WorldGenerationProgress.svelte';
	import WorldGenerationFailed from '$lib/components/features/worlds/WorldGenerationFailed.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import { TriangleAlert, ShieldAlert } from '@lucide/svelte';
	import SEO from '$lib/components/shared/SEO.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// Get worldId from params (guaranteed to exist in this route)
	const worldId = $derived(page.params.worldId!);
	const inviteToken = $derived(page.url.searchParams.get('invite'));

	// Determine if we're on the graph page (which has its own full-screen layout)
	const isGraphPage = $derived(page.url.pathname.includes('/graph'));
	const isMapPage = $derived(page.url.pathname.includes('/map'));
	const isMainWorldPage = $derived(
		page.url.pathname === `/worlds/${worldId}` || page.url.pathname === `/worlds/${worldId}/`
	);

	// Use TanStack Query for world data with polling for generation status
	const worldQuery = useWorld(() => page.params.worldId!, {
		enablePolling: true,
		invite: () => inviteToken
	});
	setWorldContext(worldQuery);

	// Derived world data
	const world = $derived(worldQuery.data);
	const isWorldLoading = $derived(worldQuery.isLoading);
	const isWorldComplete = $derived(world?.generation_status === 'completed');
	const isWorldFailed = $derived(world?.generation_status === 'failed');
	const generationStatus = $derived(world?.generation_status ?? 'initialized');
	const isAccessDenied = $derived(
		worldQuery.error instanceof ApiError && worldQuery.error.isForbidden
	);
	const isNotFound = $derived(worldQuery.error instanceof ApiError && worldQuery.error.isNotFound);
	const isNetworkOrServerError = $derived(!!worldQuery.error && !isAccessDenied && !isNotFound);
</script>

<SEO
	title="{world?.title || 'World'} - Cosmonaut"
	description={world?.description || 'Explore an interactive story world.'}
	path="/worlds/{worldId}"
	ogImage={world?.world_image_url || undefined}
	ogImageWidth={world?.world_image_width ? Number(world.world_image_width) : undefined}
	ogImageHeight={world?.world_image_height ? Number(world.world_image_height) : undefined}
	ogImageAlt={world?.world_image_alt_text || world?.title || 'Story world image'}
	noindex
/>

{#if isWorldLoading}
	<!-- Loading world data -->
	<div class="min-h-full bg-background">
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
{:else if isAccessDenied}
	<!-- Access denied -->
	<div class="min-h-full bg-background">
		<main class="mx-auto max-w-3xl px-6 py-12">
			<Card class="border-border/50">
				<CardContent class="flex flex-col items-center py-12 text-center">
					<div
						class="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10"
					>
						<ShieldAlert class="h-6 w-6 text-primary" />
					</div>
					{#if inviteToken}
						<h2 class="mb-2 text-lg font-semibold text-foreground">
							Invalid or expired invite link
						</h2>
						<p class="mb-6 max-w-md text-sm text-muted-foreground">
							This invite link is no longer valid. Ask the owner for a new invite link.
						</p>
					{:else}
						<h2 class="mb-2 text-lg font-semibold text-foreground">
							You don't have access to this world
						</h2>
						<p class="mb-6 max-w-md text-sm text-muted-foreground">
							This world is private. Ask the owner to share an invite link with you.
						</p>
					{/if}
					<Button onclick={() => goto('/dashboard')}>Return to Dashboard</Button>
				</CardContent>
			</Card>
		</main>
	</div>
{:else if isNetworkOrServerError}
	<!-- Network or server error - offer retry -->
	<div class="min-h-full bg-background">
		<main class="mx-auto max-w-3xl px-6 py-12">
			<Card class="border-destructive/50">
				<CardContent class="flex flex-col items-center py-12 text-center">
					<TriangleAlert class="mb-4 h-8 w-8 text-destructive" />
					<p class="mb-2 font-semibold text-foreground">Something went wrong</p>
					<p class="mb-6 text-sm text-muted-foreground">
						We couldn't load this world. This might be a temporary issue.
					</p>
					<div class="flex gap-3">
						<Button variant="outline" onclick={() => worldQuery.refetch()}>Try Again</Button>
						<Button onclick={() => goto('/dashboard')}>Return to Dashboard</Button>
					</div>
				</CardContent>
			</Card>
		</main>
	</div>
{:else if !world}
	<!-- World not found (404 or no data) -->
	<div class="min-h-full bg-background">
		<main class="mx-auto max-w-3xl px-6 py-12">
			<Card class="border-destructive/50">
				<CardContent class="py-12 text-center">
					<p class="mb-4 text-muted-foreground">This world doesn't exist - or it's been deleted.</p>
					<Button onclick={() => goto('/dashboard')}>Return to Dashboard</Button>
				</CardContent>
			</Card>
		</main>
	</div>
{:else if !isWorldComplete && !isWorldFailed}
	<!-- World Generation Progress View -->
	<div class="min-h-full bg-background">
		<WorldGenerationProgress {generationStatus} />
	</div>
{:else if isWorldFailed}
	<!-- World Generation Failed View -->
	<div class="min-h-full bg-background">
		<WorldGenerationFailed worldPrompt={world?.world_prompt} />
	</div>
{:else if isGraphPage || isMapPage}
	<!-- Graph/Map pages handle their own layout (full screen, absolute to fill #main-content) -->
	<div class="absolute inset-0 flex flex-col bg-background">
		<WorldHeader {world} />
		<div class="min-h-0 flex-1">
			{@render children()}
		</div>
	</div>
{:else if isMainWorldPage}
	<!-- Main world page - has its own navigation -->
	<div class="min-h-full bg-background">
		{@render children()}
	</div>
{:else}
	<!-- Story pages with scrollable content -->
	<div class="min-h-dvh bg-background">
		<WorldHeader {world} />
		{@render children()}
	</div>
{/if}
