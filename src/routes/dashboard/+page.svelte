<script lang="ts">
	import { goto } from '$app/navigation';
	import { useAuth } from '$lib/auth/auth.svelte';
	import { useWorlds, useDeleteWorld, useUser } from '$lib/queries';
	import WorldCard from '$lib/components/features/worlds/WorldCard.svelte';
	import WorldCardSkeleton from '$lib/components/features/worlds/WorldCardSkeleton.svelte';
	import UsageLimitTooltip from '$lib/components/features/subscription/UsageLimitTooltip.svelte';
	import UpgradePrompt from '$lib/components/features/subscription/UpgradePrompt.svelte';
	import SubscriptionStatusBanner from '$lib/components/features/subscription/SubscriptionStatusBanner.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Tooltip, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Plus } from '@lucide/svelte';
	import SEO from '$lib/components/shared/SEO.svelte';
	import { trackEvent } from '$lib/utils/analytics';

	const auth = useAuth();
	const worldsQuery = useWorlds();
	const deleteMutation = useDeleteWorld();
	const usageQuery = useUser();

	const allWorlds = $derived(worldsQuery.data?.pages.flatMap((p) => p.items) ?? []);

	let deletingWorldId = $state<string | null>(null);
	let showUpgradePrompt = $state(false);

	const usage = $derived(usageQuery.data);
	const isAtWorldLimit = $derived(usage ? usage.worlds_created >= usage.worlds_limit : false);

	function handleDeleteWorld(worldId: string) {
		trackEvent('world_deleted');
		deletingWorldId = worldId;
		deleteMutation.mutate(worldId, {
			onSettled: () => {
				deletingWorldId = null;
			}
		});
	}

	function handleCreateWorld() {
		if (isAtWorldLimit) {
			showUpgradePrompt = true;
		} else {
			goto('/worlds/new');
		}
	}
</script>

<SEO
	title="Dashboard - Cosmonaut"
	description="Manage your story worlds and explore new adventures."
	path="/dashboard"
	noindex
/>

<div class="h-full overflow-y-auto bg-background">
	<main class="mx-auto max-w-7xl px-6 py-12">
		<!-- Subscription status warnings (payment issues, cancellation, paused) -->
		{#if usage}
			<SubscriptionStatusBanner class="mb-8" {usage} />
		{/if}

		<!-- Your Worlds Section -->
		<section class="mb-16">
			<div class="mb-8 flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-foreground">Your Worlds</h1>
					<p class="mt-1 text-muted-foreground">Create and explore your story universes</p>
				</div>
				{#if isAtWorldLimit}
					<Tooltip>
						<TooltipTrigger>
							<Button disabled class="gap-2">
								<Plus class="h-4 w-4" />
								Create World
							</Button>
						</TooltipTrigger>
						<UsageLimitTooltip resource="worlds" />
					</Tooltip>
				{:else}
					<Button onclick={handleCreateWorld} class="gap-2">
						<Plus class="h-4 w-4" />
						Create World
					</Button>
				{/if}
			</div>

			{#if worldsQuery.isLoading}
				<!-- Loading state - show skeleton cards -->
				<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{#each [1, 2, 3] as i (i)}
						<WorldCardSkeleton />
					{/each}
				</div>
			{:else if worldsQuery.isError}
				<Card class="border-destructive/50 bg-destructive/10">
					<CardContent class="py-8 text-center">
						<p class="text-destructive">
							Failed to load worlds: {worldsQuery.error?.message ?? 'Unknown error'}
						</p>
						<Button variant="outline" class="mt-4" onclick={() => worldsQuery.refetch()}>
							Try Again
						</Button>
					</CardContent>
				</Card>
			{:else if allWorlds.length === 0}
				<!-- Empty state — polished -->
				<Card class="empty-card border-dashed">
					<CardContent
						class="relative flex flex-col items-center justify-center overflow-hidden py-16"
					>
						<!-- Radial glow behind icon -->
						<div class="empty-glow" aria-hidden="true"></div>
						<img
							src="/art/no-worlds-astronaut.webp"
							alt=""
							loading="lazy"
							class="empty-icon relative mb-6 h-28 w-auto object-contain sm:h-36"
						/>
						<h3 class="mb-2 text-xl font-semibold text-foreground">No worlds yet</h3>
						<p class="mb-6 max-w-md text-center text-muted-foreground">
							Every great adventure starts with a single spark. Light yours.
						</p>
						<Button onclick={() => goto('/worlds/new')} class="empty-cta gap-2">
							<Plus class="h-4 w-4" />
							Create Your First World
						</Button>
					</CardContent>
				</Card>
			{:else}
				<!-- Worlds grid -->
				<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{#each allWorlds as world, i (world.id)}
						<WorldCard
							{world}
							onDelete={handleDeleteWorld}
							isDeleting={deletingWorldId === world.id}
							isOwner={world.author_id === auth.user?.sub}
							index={i}
						/>
					{/each}
				</div>

				{#if worldsQuery.hasNextPage}
					<div class="mt-8 flex justify-center">
						<Button
							variant="outline"
							disabled={worldsQuery.isFetchingNextPage}
							onclick={() => worldsQuery.fetchNextPage()}
							class="gap-2"
						>
							{#if worldsQuery.isFetchingNextPage}
								<Spinner class="h-4 w-4" />
								Loading...
							{:else}
								Load More
							{/if}
						</Button>
					</div>
				{/if}
			{/if}
		</section>
	</main>

	<UpgradePrompt
		open={showUpgradePrompt}
		onOpenChange={(v) => (showUpgradePrompt = v)}
		resource="worlds"
	/>
</div>

<style>
	/* ── Empty state glow ── */
	.empty-glow {
		position: absolute;
		top: 20%;
		left: 50%;
		transform: translateX(-50%);
		width: 200px;
		height: 200px;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			oklch(from var(--primary) l c h / 0.08) 0%,
			transparent 70%
		);
		filter: blur(40px);
		pointer-events: none;
	}

	/* Empty state illustration gentle pulse */
	.empty-icon {
		animation: icon-float 3s ease-in-out infinite;
	}

	@keyframes icon-float {
		0%,
		100% {
			transform: rotate(30deg) translateY(0);
		}
		50% {
			transform: rotate(30deg) translateY(-4px);
		}
	}

	/* CTA button subtle glow */
	:global(.empty-cta) {
		box-shadow: 0 0 20px oklch(from var(--primary) l c h / 0.15);
		transition: box-shadow 0.3s ease;
	}
	:global(.empty-cta:hover) {
		box-shadow: 0 0 28px oklch(from var(--primary) l c h / 0.25);
	}

	@media (prefers-reduced-motion: reduce) {
		.empty-icon {
			animation: none;
		}
	}
</style>
