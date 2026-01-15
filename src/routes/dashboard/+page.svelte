<script lang="ts">
	import { goto } from '$app/navigation';
	import { deleteWorld } from '$lib/api/client';
	import type { World } from '$lib/types/api';
	import type { PageData } from './$types';
	import WorldCard from '$lib/components/dashboard/WorldCard.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Plus, Rocket, TrendingUp, Users } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	let localWorlds = $state<World[] | null>(null);
	const worlds = $derived(localWorlds ?? data.worlds);

	async function handleDeleteWorld(worldId: string) {
		try {
			await deleteWorld(worldId);
			localWorlds = worlds.filter((w) => w.id !== worldId);
		} catch (err) {
			console.error('Failed to delete world:', err);
		}
	}
</script>

<svelte:head>
	<title>Dashboard - Cosmonaut</title>
	<meta name="description" content="Manage your story worlds and explore new adventures." />
</svelte:head>

<div class="min-h-screen bg-background">
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

			{#if worlds.length === 0}
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
					{#each worlds as world (world.id)}
						<WorldCard {world} onDelete={handleDeleteWorld} />
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
