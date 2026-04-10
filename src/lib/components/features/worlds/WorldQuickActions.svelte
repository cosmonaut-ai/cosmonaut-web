<script lang="ts">
	import type { World } from '$lib/types/api';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { BookOpen, Map, Play, Share2, Calendar, Sparkles, Eye } from '@lucide/svelte';

	interface Props {
		world: World;
		lastNodeId?: string | null;
		hasProgress: boolean;
		hasEndings: boolean;
		onShare: () => void;
	}

	let { world, lastNodeId = null, hasProgress, hasEndings, onShare }: Props = $props();

	function handleEnterStory() {
		const targetNode = lastNodeId ?? world.root_node_id;
		if (targetNode) {
			goto(`/worlds/${world.id}/nodes/${targetNode}`);
		}
	}

	function handleViewMap() {
		goto(`/worlds/${world.id}/graph`);
	}
</script>

<section class="hero-enter hero-enter-5 mx-auto max-w-4xl px-6 py-8">
	<div class="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
		{#if world.root_node_id}
			<Button size="lg" class="group gap-2 px-8" onclick={handleEnterStory}>
				{#if hasProgress}
					<Play class="h-5 w-5 transition-transform group-hover:scale-110" />
					Continue
				{:else}
					<BookOpen class="h-5 w-5 transition-transform group-hover:scale-110" />
					Begin Story
				{/if}
			</Button>
		{/if}

		<Button variant="outline" size="lg" class="gap-2 px-6" onclick={handleViewMap}>
			<Map class="h-5 w-5" />
			View Map
		</Button>

		<Button
			variant="ghost"
			size="lg"
			class="gap-2 text-muted-foreground hover:text-foreground"
			onclick={onShare}
		>
			<Share2 class="h-5 w-5" />
			Share
		</Button>
	</div>

	<div
		class="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground/70"
	>
		<span class="flex items-center gap-1.5">
			<Calendar class="h-3.5 w-3.5" />
			Created {new Date(world.created_at).toLocaleDateString(undefined, {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			})}
		</span>
		{#if world.score}
			<span class="flex items-center gap-1.5">
				<Sparkles class="h-3.5 w-3.5" />
				Score: {world.score}
			</span>
		{/if}
		{#if hasEndings}
			<span class="flex items-center gap-1.5">
				<Eye class="h-3.5 w-3.5" />
				{world.potential_endings?.length} possible ending{world.potential_endings &&
				world.potential_endings.length !== 1
					? 's'
					: ''}
			</span>
		{/if}
	</div>
</section>

<style>
	.hero-enter {
		animation: hero-fade-up 0.8s ease-out both;
	}
	.hero-enter-5 {
		animation-delay: 0.75s;
	}

	@keyframes hero-fade-up {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.hero-enter {
			animation: none;
			opacity: 1;
		}
	}
</style>
