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
	import * as Dialog from '$lib/components/ui/dialog';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Trash2, ShieldCheck, Play } from '@lucide/svelte';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { getStatusBadgeVariant, getStatusText } from '$lib/utils/worldStatus';
	import { getWorldProgress } from '$lib/api/nodes';
	import { logger } from '$lib/utils/logger';

	function getWorldLengthLabel(length: string | null): string | null {
		switch (length) {
			case 'short':
				return 'Short';
			case 'medium':
				return 'Medium';
			case 'long':
				return 'Long';
			default:
				return null;
		}
	}

	interface Props {
		world: World;
		onDelete: (worldId: string) => void;
		isDeleting?: boolean;
		isOwner?: boolean;
		/** Stagger index for entrance animation (0-based) */
		index?: number;
	}

	let { world, onDelete, isDeleting = false, index = 0, isOwner = false }: Props = $props();

	let showDeleteDialog = $state(false);
	let isPlayLoading = $state(false);

	const isGenerating = $derived(
		world.generation_status !== 'completed' && world.generation_status !== 'failed'
	);

	const canPlay = $derived(world.generation_status === 'completed' && !!world.root_node_id);

	function handleClick() {
		if (isDeleting) return;
		goto(`/worlds/${world.id}`);
	}

	async function handlePlayClick(e: Event) {
		e.stopPropagation();
		if (isDeleting || isPlayLoading || !world.root_node_id) return;

		isPlayLoading = true;
		let targetNodeId = world.root_node_id;

		try {
			const progress = await getWorldProgress(world.id);
			if (progress.current_node_id) {
				targetNodeId = progress.current_node_id;
			}
		} catch (err) {
			logger.error('Failed to fetch world progress, falling back to root node:', err);
		}

		goto(`/worlds/${world.id}/nodes/${targetNodeId}`);
		isPlayLoading = false;
	}

	function handleDeleteClick(e: Event) {
		e.stopPropagation();
		if (isDeleting) return;
		showDeleteDialog = true;
	}

	function handleConfirmDelete() {
		onDelete(world.id);
	}

	function handleCancelDelete() {
		if (isDeleting) return;
		showDeleteDialog = false;
	}
</script>

<Card
	class="world-card group cursor-pointer"
	style="--entrance-delay: {index * 60}ms"
	onclick={handleClick}
	role="button"
	tabindex={0}
	aria-label="Open world: {world.title || 'Untitled World'}"
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick();
		}
	}}
>
	<!-- Image or Animated Gradient Header -->
	{#if world.world_image_url}
		<div class="h-40 w-full overflow-hidden rounded-t-xl bg-card">
			<img
				src={world.world_image_url}
				alt={world.world_image_alt_text || world.title || 'World image'}
				loading="lazy"
				class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
			/>
		</div>
	{:else}
		<div class="world-card-gradient h-40 w-full rounded-t-xl"></div>
	{/if}

	<CardHeader class="pb-3">
		<div class="flex items-start justify-between gap-3">
			<CardTitle class="line-clamp-1 text-lg">{world.title || 'Untitled World'}</CardTitle>
			<Badge
				variant={getStatusBadgeVariant(world.generation_status)}
				class="shrink-0 {isGenerating ? 'world-badge-generating' : ''}"
			>
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
			<div class="flex items-center gap-2 text-xs text-muted-foreground">
				<span>{new Date(world.created_at).toLocaleDateString()}</span>
				{#if getWorldLengthLabel(world.world_length)}
					<span class="text-border">|</span>
					<span>{getWorldLengthLabel(world.world_length)}</span>
				{/if}
				{#if world.family_friendly}
					<Tooltip>
						<TooltipTrigger class="inline-flex text-primary/70">
							<ShieldCheck class="h-3.5 w-3.5" />
						</TooltipTrigger>
						<TooltipContent>Family Friendly</TooltipContent>
					</Tooltip>
				{/if}
			</div>

			<div class="flex items-center gap-1.5">
				<Tooltip>
					<TooltipTrigger>
						<Button
							variant="secondary"
							size="sm"
							onclick={handleDeleteClick}
							disabled={isDeleting}
							class="h-9 w-9 p-0 text-muted-foreground hover:text-destructive disabled:opacity-50"
							aria-label={isOwner
								? `Delete world: ${world.title || 'Untitled World'}`
								: `Remove world: ${world.title || 'Untitled World'}`}
						>
							{#if isDeleting}
								<Spinner class="h-4 w-4" />
							{:else}
								<Trash2 class="h-4 w-4" />
							{/if}
						</Button>
					</TooltipTrigger>
					<TooltipContent>{isOwner ? 'Delete World' : 'Remove from Library'}</TooltipContent>
				</Tooltip>
				{#if canPlay}
					<Tooltip>
						<TooltipTrigger>
							<Button
								variant="secondary"
								size="sm"
								onclick={handlePlayClick}
								disabled={isPlayLoading || isDeleting}
								class="h-9 w-9 p-0 text-muted-foreground hover:text-primary disabled:opacity-50"
								aria-label="Continue story: {world.title || 'Untitled World'}"
							>
								{#if isPlayLoading}
									<Spinner class="h-4 w-4" />
								{:else}
									<Play class="h-4 w-4" />
								{/if}
							</Button>
						</TooltipTrigger>
						<TooltipContent>Continue Story</TooltipContent>
					</Tooltip>
				{/if}
			</div>
		</div>
	</CardContent>
</Card>

<Dialog.Root
	bind:open={showDeleteDialog}
	onOpenChange={(open) => !isDeleting && (showDeleteDialog = open)}
>
	<Dialog.Content showCloseButton={!isDeleting} onclick={(e: Event) => e.stopPropagation()}>
		<Dialog.Header>
			<Dialog.Title>{isOwner ? 'Delete World' : 'Remove from Library'}</Dialog.Title>
			<Dialog.Description>
				{#if isOwner}
					This will remove the world from your library. If no other users have saved it, the world
					will be permanently deleted.
				{:else}
					This will remove the world from your library. You can rejoin later if the world is still
					accessible.
				{/if}
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Button variant="outline" onclick={handleCancelDelete} disabled={isDeleting}>Cancel</Button>
			<Button variant="destructive" onclick={handleConfirmDelete} disabled={isDeleting}>
				{#if isDeleting}
					<Spinner class="mr-2 h-4 w-4" />
					{isOwner ? 'Deleting...' : 'Removing...'}
				{:else}
					{isOwner ? 'Delete' : 'Remove'}
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

<style>
	/* ── Entrance animation ── */
	:global(.world-card) {
		animation: card-enter 0.5s ease-out both;
		animation-delay: var(--entrance-delay, 0ms);
	}

	@keyframes card-enter {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ── Hover lift & glow ── */
	:global(.world-card) {
		transition:
			transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			border-color 0.3s ease;
	}

	:global(.world-card:hover) {
		transform: translateY(-3px);
		border-color: var(--primary);
		box-shadow:
			0 8px 24px oklch(from var(--primary) l c h / 0.1),
			0 2px 8px oklch(0 0 0 / 0.15);
	}

	:global(.world-card:active) {
		transform: translateY(-1px);
		transition-duration: 0.1s;
	}

	/* ── Animated gradient fallback ── */
	.world-card-gradient {
		background: linear-gradient(
			135deg,
			oklch(from var(--primary) l c h / 0.2) 0%,
			oklch(from var(--accent) l c h / 0.12) 50%,
			oklch(from var(--secondary) l c h / 0.2) 100%
		);
		background-size: 200% 200%;
		animation: gradient-shift 8s ease-in-out infinite;
	}

	@keyframes gradient-shift {
		0%,
		100% {
			background-position: 0% 50%;
		}
		50% {
			background-position: 100% 50%;
		}
	}

	/* ── Generating badge pulse ── */
	:global(.world-badge-generating) {
		animation: badge-pulse 2s ease-in-out infinite;
	}

	@keyframes badge-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.6;
		}
	}

	/* ── Reduced motion ── */
	@media (prefers-reduced-motion: reduce) {
		:global(.world-card) {
			animation: none;
			opacity: 1;
		}
		:global(.world-card:hover) {
			transform: none;
		}
		:global(.world-card:active) {
			transform: none;
		}
		.world-card-gradient {
			animation: none;
		}
		:global(.world-badge-generating) {
			animation: none;
		}
	}
</style>
