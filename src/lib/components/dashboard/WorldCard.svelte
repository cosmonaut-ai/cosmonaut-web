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
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Trash2 } from '@lucide/svelte';

	interface Props {
		world: World;
		onDelete: (worldId: string) => void;
		isDeleting?: boolean;
	}

	let { world, onDelete, isDeleting = false }: Props = $props();

	let showDeleteDialog = $state(false);

	function handleClick() {
		if (isDeleting) return;
		goto(`/worlds/${world.id}`);
	}

	function handleDeleteClick(e: Event) {
		e.stopPropagation();
		if (isDeleting) return;
		showDeleteDialog = true;
	}

	function handleConfirmDelete() {
		onDelete(world.id);
		// Don't close the dialog - it will close when deletion is complete
		// as the card will be removed from the list
	}

	function handleCancelDelete() {
		if (isDeleting) return;
		showDeleteDialog = false;
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

			<Button
				variant="ghost"
				size="sm"
				onclick={handleDeleteClick}
				disabled={isDeleting}
				class="h-7 w-7 p-0 text-muted-foreground hover:text-destructive disabled:opacity-50"
				aria-label="Delete world"
			>
				{#if isDeleting}
					<Spinner class="h-4 w-4" />
				{:else}
					<Trash2 class="h-4 w-4" />
				{/if}
			</Button>
		</div>
	</CardContent>
</Card>

<Dialog
	bind:open={showDeleteDialog}
	onOpenChange={(open) => !isDeleting && (showDeleteDialog = open)}
>
	<DialogContent showCloseButton={!isDeleting} onclick={(e: Event) => e.stopPropagation()}>
		<DialogHeader>
			<DialogTitle>Delete World</DialogTitle>
			<DialogDescription>
				Are you sure you want to delete "{world.title || 'Untitled World'}"? This action cannot be
				undone and all story progress will be permanently lost.
			</DialogDescription>
		</DialogHeader>
		<DialogFooter>
			<Button variant="outline" onclick={handleCancelDelete} disabled={isDeleting}>Cancel</Button>
			<Button variant="destructive" onclick={handleConfirmDelete} disabled={isDeleting}>
				{#if isDeleting}
					<Spinner class="mr-2 h-4 w-4" />
					Deleting...
				{:else}
					Delete
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
