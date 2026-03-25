<script lang="ts">
	import { goto } from '$app/navigation';
	import { useFeaturedWorlds } from '$lib/queries';
	import { Card } from '$lib/components/ui/card';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Badge } from '$lib/components/ui/badge';
	import { Sparkles } from '@lucide/svelte';

	const featuredQuery = useFeaturedWorlds();

	const worlds = $derived(featuredQuery.data ?? []);
	const hasWorlds = $derived(worlds.length > 0);
</script>

{#if featuredQuery.isLoading}
	<section class="mb-12">
		<h2 class="mb-4 text-lg font-semibold text-foreground">Featured Worlds</h2>
		<div class="carousel-scroll flex gap-4 overflow-x-auto pb-2">
			{#each [1, 2, 3] as i (i)}
				<Card class="w-64 shrink-0 overflow-hidden sm:w-72">
					<Skeleton class="h-36 w-full rounded-b-none" />
					<div class="space-y-2 p-4">
						<Skeleton class="h-5 w-3/4" />
						<Skeleton class="h-4 w-full" />
						<Skeleton class="h-4 w-1/2" />
					</div>
				</Card>
			{/each}
		</div>
	</section>
{:else if hasWorlds}
	<section class="mb-12">
		<h2 class="mb-4 text-lg font-semibold text-foreground">Featured Worlds</h2>
		<div class="carousel-scroll flex gap-4 overflow-x-auto pb-2">
			{#each worlds as world (world.id)}
				<button
					type="button"
					class="group w-64 shrink-0 cursor-pointer text-left sm:w-72"
					onclick={() => goto(`/worlds/${world.id}`)}
				>
					<Card class="h-full overflow-hidden transition-colors group-hover:border-primary/40">
						<div class="relative h-36 w-full overflow-hidden bg-muted">
							{#if world.world_image_url}
								<img
									src={world.world_image_url}
									alt={world.world_image_alt_text || world.title || 'World image'}
									loading="lazy"
									class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
								/>
							{:else}
								<div
									class="flex h-full w-full items-center justify-center bg-linear-to-br from-primary/10 to-accent/10"
								>
									<img src="/logo.png" alt="" class="h-10 w-10 opacity-20" />
								</div>
							{/if}
						</div>
						<div class="space-y-1.5 p-4">
							<h3 class="line-clamp-1 text-sm font-semibold text-foreground">
								{world.title || 'Untitled World'}
							</h3>
							{#if world.genre}
								<Badge variant="secondary" class="gap-1 text-xs">
									<Sparkles class="h-3 w-3" />
									{world.genre}
								</Badge>
							{/if}
							{#if world.description}
								<p class="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
									{world.description}
								</p>
							{/if}
						</div>
					</Card>
				</button>
			{/each}
		</div>
	</section>
{/if}

<style>
	.carousel-scroll {
		scroll-snap-type: x mandatory;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: thin;
		scrollbar-color: oklch(from var(--muted-foreground) l c h / 0.3) transparent;
	}
	.carousel-scroll > :global(*) {
		scroll-snap-align: start;
	}
</style>
