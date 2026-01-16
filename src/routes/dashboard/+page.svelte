<script lang="ts">
	import { goto } from '$app/navigation';
	import { useWorlds, useDeleteWorld } from '$lib/queries';
	import WorldCard from '$lib/components/dashboard/WorldCard.svelte';
	import WorldCardSkeleton from '$lib/components/dashboard/WorldCardSkeleton.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Plus, Rocket, TrendingUp, Users } from '@lucide/svelte';

	const worldsQuery = useWorlds();
	const deleteMutation = useDeleteWorld();

	let deletingWorldId = $state<string | null>(null);

	function handleDeleteWorld(worldId: string) {
		deletingWorldId = worldId;
		deleteMutation.mutate(worldId, {
			onSettled: () => {
				deletingWorldId = null;
			}
		});
	}
</script>

<svelte:head>
	<title>Dashboard - Cosmonaut</title>
	<meta name="description" content="Manage your story worlds and explore new adventures." />
</svelte:head>

<div class="h-full overflow-y-auto bg-background">
	<main class="mx-auto max-w-7xl px-6 py-12">
		<!-- Your Worlds Section -->
		<section class="mb-16">
			<div class="mb-8 flex items-center justify-between">
				<div>
					<h1 class="text-3xl font-bold text-foreground">Your Worlds</h1>
					<p class="mt-1 text-muted-foreground">Create and explore your story universes</p>
				</div>
				<Button onclick={() => goto('/worlds/new')} class="gap-2">
					<Plus class="h-4 w-4" />
					Create World
				</Button>
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
				<!-- Empty state -->
				<Card class="border-dashed">
					<CardContent class="flex flex-col items-center justify-center py-16">
						<div
							class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10"
						>
							<Rocket class="h-8 w-8 text-primary" />
						</div>
						<h3 class="mb-2 text-xl font-semibold text-foreground">No worlds yet</h3>
						<p class="mb-6 max-w-md text-center text-muted-foreground">
							Create your first interactive story world and start exploring infinite narratives.
						</p>
						<Button onclick={() => goto('/worlds/new')} class="gap-2">
							<Plus class="h-4 w-4" />
							Create Your First World
						</Button>
					</CardContent>
				</Card>
			{:else}
				<!-- Worlds grid -->
				<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{#each worldsQuery.data ?? [] as world (world.id)}
						<WorldCard
							{world}
							onDelete={handleDeleteWorld}
							isDeleting={deletingWorldId === world.id}
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
</div>
