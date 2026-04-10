<script lang="ts">
	import { goto } from '$app/navigation';
	import { useFeaturedWorlds } from '$lib/queries';
	import { Card } from '$lib/components/ui/card';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Badge } from '$lib/components/ui/badge';
	import { Sparkles, ChevronLeft, ChevronRight } from '@lucide/svelte';

	const featuredQuery = useFeaturedWorlds();

	const worlds = $derived(featuredQuery.data ?? []);
	const hasWorlds = $derived(worlds.length > 0);

	let scrollEl: HTMLDivElement | undefined = $state();
	let canScrollLeft = $state(false);
	let canScrollRight = $state(false);

	function updateScrollState() {
		if (!scrollEl) return;
		canScrollLeft = scrollEl.scrollLeft > 4;
		canScrollRight = scrollEl.scrollLeft < scrollEl.scrollWidth - scrollEl.clientWidth - 4;
	}

	function scroll(direction: -1 | 1) {
		if (!scrollEl) return;
		const card = scrollEl.querySelector<HTMLElement>('[data-card]');
		if (!card) return;
		const distance = card.offsetWidth + 16;
		scrollEl.scrollBy({ left: direction * distance, behavior: 'smooth' });
	}

	$effect(() => {
		if (!scrollEl) return;
		updateScrollState();
		const ro = new ResizeObserver(updateScrollState);
		ro.observe(scrollEl);
		return () => ro.disconnect();
	});
</script>

{#if featuredQuery.isLoading}
	<section class="mb-12">
		<h2 class="mb-4 text-lg font-semibold text-foreground">Featured Stories</h2>
		<div class="carousel-scroll flex gap-4 overflow-x-auto px-1 pb-2">
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
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-lg font-semibold text-foreground">Featured Stories</h2>

			<div class="flex gap-1">
				<button
					type="button"
					onclick={() => scroll(-1)}
					disabled={!canScrollLeft}
					class="grid h-8 w-8 place-items-center rounded-full border border-border
						text-muted-foreground transition-colors
						enabled:hover:bg-accent enabled:hover:text-foreground
						disabled:opacity-30"
					aria-label="Scroll left"
				>
					<ChevronLeft class="h-4 w-4" />
				</button>
				<button
					type="button"
					onclick={() => scroll(1)}
					disabled={!canScrollRight}
					class="grid h-8 w-8 place-items-center rounded-full border border-border
						text-muted-foreground transition-colors
						enabled:hover:bg-accent enabled:hover:text-foreground
						disabled:opacity-30"
					aria-label="Scroll right"
				>
					<ChevronRight class="h-4 w-4" />
				</button>
			</div>
		</div>

		<div class="relative">
			<div
				bind:this={scrollEl}
				onscroll={updateScrollState}
				class="carousel-scroll flex gap-4 overflow-x-auto px-1 pb-2"
			>
				{#each worlds as world (world.id)}
					<button
						type="button"
						data-card
						class="group w-64 shrink-0 cursor-pointer text-left sm:w-72"
						onclick={() => goto(`/worlds/${world.id}`)}
					>
						<Card class="h-full overflow-hidden transition-colors group-hover:border-primary/40">
							<div class="relative h-36 w-full overflow-hidden bg-muted">
								{#if world.world_image_url}
									<img
										src={world.world_image_url}
										alt={world.world_image_alt_text || world.title || 'Story image'}
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
									{world.title || 'Untitled Story'}
								</h3>
								{#if world.genre}
									<Badge variant="secondary" class="max-w-full gap-1 text-xs">
										<Sparkles class="h-3 w-3 shrink-0" />
										<span class="truncate">{world.genre}</span>
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

			{#if canScrollLeft}
				<div
					class="pointer-events-none absolute inset-y-0 left-0 w-12 bg-linear-to-r from-background to-transparent"
				></div>
			{/if}
			{#if canScrollRight}
				<div
					class="pointer-events-none absolute inset-y-0 right-0 w-12 bg-linear-to-l from-background to-transparent"
				></div>
			{/if}
		</div>
	</section>
{/if}

<style>
	.carousel-scroll {
		scroll-snap-type: x mandatory;
		scroll-padding-inline: 3rem;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
	}
	.carousel-scroll::-webkit-scrollbar {
		display: none;
	}
	.carousel-scroll > :global(*) {
		scroll-snap-align: start;
	}
</style>
