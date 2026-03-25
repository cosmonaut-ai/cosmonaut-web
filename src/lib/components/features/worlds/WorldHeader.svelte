<script lang="ts">
	import type { World } from '$lib/types/api';
	import { goto } from '$app/navigation';
	import { Globe, Lock } from '@lucide/svelte';
	import { Badge } from '$lib/components/ui/badge';

	interface Props {
		world: World;
	}

	let { world }: Props = $props();

	function handleWorldHome() {
		goto(`/worlds/${world.id}`);
	}
</script>

<header class="relative isolate overflow-hidden border-b border-border">
	<!-- Background image with blur and darken overlay -->
	{#if world.world_image_url}
		<div class="absolute inset-0 z-0 overflow-hidden">
			<img
				src={world.world_image_url}
				alt=""
				class="h-full w-full scale-110 object-cover blur-sm"
			/>
			<div class="absolute inset-0 bg-background/75"></div>
		</div>
	{:else}
		<div class="absolute inset-0 z-0 bg-card/50">
			{#if world.image_generation_status === 'pending'}
				<div class="absolute inset-0 animate-pulse bg-primary/5"></div>
			{/if}
		</div>
	{/if}

	<div class="relative z-10 mx-auto max-w-4xl px-6 py-4">
		<!-- World info — links to world home page -->
		<button
			onclick={handleWorldHome}
			class="world-info-link group -m-2 flex w-full cursor-pointer items-start gap-4 rounded-lg p-2 text-left transition-all duration-200 hover:bg-primary/5"
			aria-label="Go to world home page"
		>
			<!-- Icon -->
			<div
				class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 transition-all duration-200 group-hover:border-primary/50 group-hover:bg-primary/15"
			>
				<img src="/planet.png" alt="Planet" class="h-8 w-8" />
			</div>

			<!-- Title and meta -->
			<div class="min-w-0 flex-1">
				<div class="flex items-center gap-3">
					<h1
						class="truncate text-xl font-bold text-foreground transition-colors duration-200 group-hover:text-primary"
					>
						{world.title || 'Untitled World'}
					</h1>
					<Badge variant="outline" class="shrink-0 gap-1 border-border/50 bg-background/50">
						{#if world.visibility === 'public'}
							<Globe class="h-3 w-3" />
							Public
						{:else}
							<Lock class="h-3 w-3" />
							Private
						{/if}
					</Badge>
				</div>
				{#if world.description}
					<p class="mt-1 line-clamp-1 text-sm text-muted-foreground">
						{world.description}
					</p>
				{/if}
				{#if world.genre}
					<Badge variant="secondary" class="mt-2">{world.genre}</Badge>
				{/if}
			</div>
		</button>
	</div>
</header>
