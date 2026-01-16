<script lang="ts">
	import type { World } from '$lib/types/api';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import ShareModal from './ShareModal.svelte';
	import { ArrowLeft, Share2, Rocket, Globe, Lock } from '@lucide/svelte';
	import { Badge } from '$lib/components/ui/badge';

	interface Props {
		world: World;
		onWorldUpdate?: (world: World) => void;
	}

	let { world, onWorldUpdate }: Props = $props();

	let shareModalOpen = $state(false);

	function handleBack() {
		goto('/dashboard');
	}
</script>

<header class="border-b border-border bg-card/50">
	<div class="mx-auto max-w-4xl px-6 py-4">
		<!-- Top row: navigation and actions -->
		<div class="mb-4 flex items-center justify-between">
			<Button variant="ghost" size="sm" onclick={handleBack} class="gap-2">
				<ArrowLeft class="h-4 w-4" />
				Dashboard
			</Button>

			<Button variant="outline" size="sm" onclick={() => (shareModalOpen = true)} class="gap-2">
				<Share2 class="h-4 w-4" />
				Share
			</Button>
		</div>

		<!-- World info -->
		<div class="flex items-start gap-4">
			<!-- Icon -->
			<div
				class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10"
			>
				<Rocket class="h-6 w-6 text-primary" />
			</div>

			<!-- Title and meta -->
			<div class="min-w-0 flex-1">
				<div class="flex items-center gap-3">
					<h1 class="truncate text-xl font-bold text-foreground">
						{world.title || 'Untitled World'}
					</h1>
					<Badge variant="outline" class="shrink-0 gap-1">
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
		</div>
	</div>
</header>

<!-- Share Modal -->
<ShareModal
	{world}
	open={shareModalOpen}
	onOpenChange={(open) => (shareModalOpen = open)}
	{onWorldUpdate}
/>
