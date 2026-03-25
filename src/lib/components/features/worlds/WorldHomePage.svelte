<script lang="ts">
	import type { World } from '$lib/types/api';
	import { useAuth } from '$lib/auth/auth.svelte';
	import { Shield, ShieldPlus, BookOpen } from '@lucide/svelte';
	import WorldHeroSection from './WorldHeroSection.svelte';
	import WorldQuickActions from './WorldQuickActions.svelte';
	import WorldDetailsSection from './WorldDetailsSection.svelte';
	import ShareModal from './ShareModal.svelte';

	function getWorldLengthLabel(length: string | null): string | null {
		switch (length) {
			case 'short':
				return 'Short Story';
			case 'medium':
				return 'Medium Story';
			case 'long':
				return 'Long Story';
			default:
				return null;
		}
	}

	interface Props {
		world: World;
		lastNodeId?: string | null;
		onWorldUpdate?: (world: World) => void;
	}

	let { world, lastNodeId = null, onWorldUpdate }: Props = $props();

	const hasProgress = $derived(lastNodeId !== null && lastNodeId !== world.root_node_id);
	const hasEndings = $derived(
		world.potential_endings !== null && world.potential_endings.length > 0
	);

	let shareModalOpen = $state(false);
	const auth = useAuth();
</script>

<div class="world-home">
	<WorldHeroSection {world} />

	<WorldQuickActions
		{world}
		{lastNodeId}
		{hasProgress}
		{hasEndings}
		onShare={() => (shareModalOpen = true)}
	/>

	<WorldDetailsSection {world} />

	<footer class="mx-auto max-w-4xl px-6 pt-8 pb-12">
		<div class="border-t border-border/30 pt-6">
			<div
				class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground/60"
			>
				<span>Created {new Date(world.created_at).toLocaleDateString()}</span>
				<span>Updated {new Date(world.updated_at).toLocaleDateString()}</span>
				{#if world.genre}
					<span>{world.genre}</span>
				{/if}
				{#if getWorldLengthLabel(world.world_length)}
					<span>{getWorldLengthLabel(world.world_length)}</span>
				{:else if world.story_max_nodes}
					<span>Max {world.story_max_nodes} nodes</span>
				{/if}
				{#if world.vocab_level && world.vocab_level !== 'adult'}
					<span class="flex items-center gap-1.5">
						<BookOpen class="h-3.5 w-3.5" />
						{world.vocab_level === 'child' ? 'Child' : 'Teen'} Vocab
					</span>
				{/if}
				{#if world.content_filter === 'strict'}
					<span class="flex items-center gap-1.5">
						<ShieldPlus class="h-3.5 w-3.5" />
						Strict Filter
					</span>
				{:else if world.content_filter === 'moderate'}
					<span class="flex items-center gap-1.5">
						<Shield class="h-3.5 w-3.5" />
						Moderate Filter
					</span>
				{/if}
				{#if world.node_text_length}
					<span>~{world.node_text_length} words per node</span>
				{/if}
			</div>
		</div>
	</footer>
</div>

<ShareModal
	{world}
	open={shareModalOpen}
	onOpenChange={(open) => (shareModalOpen = open)}
	{onWorldUpdate}
	isOwner={world.author_id === auth.user?.sub}
/>
