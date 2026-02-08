<script lang="ts">
	import { goto } from '$app/navigation';
	import { useWorlds, useDeleteWorld, useUsage } from '$lib/queries';
	import WorldCard from '$lib/components/dashboard/WorldCard.svelte';
	import WorldCardSkeleton from '$lib/components/dashboard/WorldCardSkeleton.svelte';
	import UsageLimitTooltip from '$lib/components/subscription/UsageLimitTooltip.svelte';
	import UpgradePrompt from '$lib/components/subscription/UpgradePrompt.svelte';
	import SubscriptionStatusBanner from '$lib/components/subscription/SubscriptionStatusBanner.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Tooltip, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { Plus, Rocket, TrendingUp, Users } from '@lucide/svelte';

	const worldsQuery = useWorlds();
	const deleteMutation = useDeleteWorld();
	const usageQuery = useUsage();

	let deletingWorldId = $state<string | null>(null);
	let showUpgradePrompt = $state(false);

	const usage = $derived(usageQuery.data);
	const isAtWorldLimit = $derived(usage ? usage.worlds_created >= usage.worlds_limit : false);

	function handleDeleteWorld(worldId: string) {
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

<svelte:head>
	<title>Dashboard - Cosmonaut</title>
	<meta name="description" content="Manage your story worlds and explore new adventures." />
</svelte:head>

<div class="h-full overflow-y-auto bg-background">
	<main class="mx-auto max-w-7xl px-6 py-12">
		<!-- Subscription status warnings (payment issues, cancellation, paused) -->
		{#if usage}
			<div class="mb-8">
				<SubscriptionStatusBanner {usage} />
			</div>
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
			{:else if worldsQuery.data?.length === 0}
				<!-- Empty state — polished -->
				<Card class="empty-card border-dashed">
					<CardContent
						class="relative flex flex-col items-center justify-center overflow-hidden py-16"
					>
						<!-- Radial glow behind icon -->
						<div class="empty-glow" aria-hidden="true"></div>
						<div
							class="empty-icon relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10"
						>
							<Rocket class="h-8 w-8 text-primary" />
						</div>
						<h3 class="mb-2 text-xl font-semibold text-foreground">No worlds yet</h3>
						<p class="mb-6 max-w-md text-center text-muted-foreground">
							Create your first interactive story world and start exploring infinite narratives.
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
					{#each worldsQuery.data ?? [] as world, i (world.id)}
						<WorldCard
							{world}
							onDelete={handleDeleteWorld}
							isDeleting={deletingWorldId === world.id}
							index={i}
						/>
					{/each}
				</div>
			{/if}
		</section>

		<!-- Trending Worlds Section (Scaffolded) -->
		<section class="mb-16">
			<div class="mb-8">
				<div class="flex items-center gap-3">
					<TrendingUp class="h-6 w-6 text-primary" />
					<h2 class="text-2xl font-bold text-foreground">Trending Worlds</h2>
				</div>
				<p class="mt-1 text-muted-foreground">Discover popular story worlds from the community</p>
			</div>

			<Card class="border-dashed">
				<CardContent class="flex flex-col items-center justify-center py-12">
					<TrendingUp class="mb-4 h-12 w-12 text-muted-foreground/50" />
					<h3 class="mb-2 text-lg font-semibold text-foreground">Coming Soon</h3>
					<p class="max-w-md text-center text-sm text-muted-foreground">
						Explore trending worlds created by other storytellers. This feature is under
						development.
					</p>
				</CardContent>
			</Card>
		</section>

		<!-- Multiplayer Section (Scaffolded) -->
		<section>
			<div class="mb-8">
				<div class="flex items-center gap-3">
					<Users class="h-6 w-6 text-primary" />
					<h2 class="text-2xl font-bold text-foreground">Multiplayer Adventures</h2>
				</div>
				<p class="mt-1 text-muted-foreground">Explore stories together with friends</p>
			</div>

			<Card class="border-dashed">
				<CardContent class="flex flex-col items-center justify-center py-12">
					<Users class="mb-4 h-12 w-12 text-muted-foreground/50" />
					<h3 class="mb-2 text-lg font-semibold text-foreground">Coming Soon</h3>
					<p class="max-w-md text-center text-sm text-muted-foreground">
						Create multiplayer lobbies and experience interactive stories with friends. This feature
						is under development.
					</p>
				</CardContent>
			</Card>
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

	/* Rocket icon gentle pulse */
	.empty-icon {
		animation: icon-float 3s ease-in-out infinite;
	}

	@keyframes icon-float {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-4px);
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
