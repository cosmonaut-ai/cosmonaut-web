<script lang="ts">
	import { goto } from '$app/navigation';
	import type { World } from '$lib/types/api';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Trash2 } from '@lucide/svelte';

	interface Props {
		world: World;
		onDelete: (worldId: string) => Promise<void>;
	}

	let { world, onDelete }: Props = $props();

	let showDeleteConfirm = $state(false);
	let deleting = $state(false);

	function handleClick() {
		goto(`/worlds/${world.id}`);
	}

	async function handleDelete(e: Event) {
		e.stopPropagation();

		if (!showDeleteConfirm) {
			showDeleteConfirm = true;
			return;
		}

		try {
			deleting = true;
			await onDelete(world.id);
		} catch (err) {
			console.error('Error deleting world:', err);
		} finally {
			deleting = false;
			showDeleteConfirm = false;
		}
	}

	function handleCancelDelete(e: Event) {
		e.stopPropagation();
		showDeleteConfirm = false;
	}

	function getStatusBadgeVariant(
		status: string
	): 'default' | 'secondary' | 'destructive' | 'outline' {
		switch (status) {
			case 'completed':
				return 'default';
			case 'failed':
				return 'destructive';
			default:
				return 'secondary';
		}
	}

	function getStatusText(status: string): string {
		switch (status) {
			case 'completed':
				return 'Ready';
			case 'generating_lore':
				return 'Generating Lore';
			case 'generating_narrator_profile':
				return 'Creating Narrator';
			case 'generating_start_node':
				return 'Generating Story';
			case 'initialized':
				return 'Initializing';
			case 'failed':
				return 'Failed';
			default:
				return status;
		}
	}
</script>

<Card
	class="group cursor-pointer overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
	onclick={handleClick}
	role="button"
	tabindex={0}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick();
		}
	}}
>
	<!-- Image or Gradient Header -->
	{#if world.world_image_url}
		<div class="h-40 w-full overflow-hidden bg-card">
			<img
				src={world.world_image_url}
				alt={world.world_image_alt_text || world.title || 'World image'}
				class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
			/>
		</div>
	{:else}
		<div class="h-40 w-full bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20"></div>
	{/if}

	<CardHeader class="pb-3">
		<div class="flex items-start justify-between gap-3">
			<CardTitle class="line-clamp-1 text-lg">{world.title || 'Untitled World'}</CardTitle>
			<Badge variant={getStatusBadgeVariant(world.generation_status)} class="shrink-0">
				{getStatusText(world.generation_status)}
			</Badge>
		</div>
		{#if world.genre}
			<CardDescription class="mt-1">
				<Badge variant="outline" class="text-xs">{world.genre}</Badge>
			</CardDescription>
		{/if}
	</CardHeader>

	<CardContent class="pt-0">
		{#if world.description}
			<p class="mb-4 line-clamp-2 text-sm text-muted-foreground">
				{world.description}
			</p>
		{:else}
			<p class="mb-4 text-sm text-muted-foreground/60 italic">No description available</p>
		{/if}

		<!-- Footer -->
		<div class="flex items-center justify-between border-t border-border pt-3">
			<span class="text-xs text-muted-foreground">
				{new Date(world.created_at).toLocaleDateString()}
			</span>

			{#if showDeleteConfirm}
				<div class="flex gap-2">
					<Button
						variant="ghost"
						size="sm"
						onclick={handleCancelDelete}
						disabled={deleting}
						class="h-7 px-2 text-xs"
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						size="sm"
						onclick={handleDelete}
						disabled={deleting}
						class="h-7 px-2 text-xs"
					>
						{deleting ? 'Deleting...' : 'Confirm'}
					</Button>
				</div>
			{:else}
				<Button
					variant="ghost"
					size="sm"
					onclick={handleDelete}
					class="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
					aria-label="Delete world"
				>
					<Trash2 class="h-4 w-4" />
				</Button>
			{/if}
		</div>
	</CardContent>
</Card>
