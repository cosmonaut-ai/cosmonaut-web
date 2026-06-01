<script lang="ts">
	import type { Snippet } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { useWorld } from '$lib/queries';
	import { setWorldContext } from '$lib/contexts/world';
	import { ApiError } from '$lib/types/api';
	import WorldGenerationProgress from '$lib/components/features/worlds/WorldGenerationProgress.svelte';
	import WorldGenerationFailed from '$lib/components/features/worlds/WorldGenerationFailed.svelte';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { ShieldAlert } from '@lucide/svelte';
	import SEO from '$lib/components/shared/SEO.svelte';
	import ResourceLoadingSkeleton from '$lib/components/shared/ResourceLoadingSkeleton.svelte';
	import NetworkErrorCard from '$lib/components/shared/NetworkErrorCard.svelte';
	import NotFoundCard from '$lib/components/shared/NotFoundCard.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	const worldId = $derived(page.params.worldId!);
	const inviteToken = $derived(page.url.searchParams.get('invite'));

	const worldQuery = useWorld(() => page.params.worldId!, {
		enablePolling: true,
		invite: () => inviteToken
	});
	setWorldContext(worldQuery);

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
	<ResourceLoadingSkeleton />
{:else if isAccessDenied}
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
							You don't have access to this story
						</h2>
						<p class="mb-6 max-w-md text-sm text-muted-foreground">
							This story is private. Ask the owner to share an invite link with you.
						</p>
					{/if}
					<Button onclick={() => goto('/dashboard')}>Return to Dashboard</Button>
				</CardContent>
			</Card>
		</main>
	</div>
{:else if isNetworkOrServerError}
	<NetworkErrorCard
		message="We couldn't load this story. This might be a temporary issue."
		onRetry={() => worldQuery.refetch()}
	/>
{:else if !world}
	<NotFoundCard message="This story doesn't exist - or it's been deleted." />
{:else if !isWorldComplete && !isWorldFailed}
	<div class="min-h-full bg-background">
		<WorldGenerationProgress {generationStatus} />
	</div>
{:else if isWorldFailed}
	<div class="min-h-full bg-background">
		<WorldGenerationFailed worldPrompt={world?.world_prompt} />
	</div>
{:else}
	<div class="min-h-full bg-background">
		{@render children()}
	</div>
{/if}
