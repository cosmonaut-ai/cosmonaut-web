<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import type { NodeTypes } from '@xyflow/svelte';
	import { useWorld, useWorldNodes } from '$lib/queries';
	import { transformNodesToFlow } from '$lib/utils/nodeTransform';
	import FlowNode from '$lib/components/shared/FlowNode.svelte';
	import StoryGraph from '$lib/components/shared/StoryGraph.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { BookOpen, Rocket } from '@lucide/svelte';

	const worldId = page.params.worldId!;
	const worldQuery = useWorld(worldId);
	const nodesQuery = useWorldNodes(worldId);
	const rootNodeId = $derived(worldQuery.data?.root_node_id ?? null);

	const storyNodes = $derived(nodesQuery.data ?? []);
	const isLoading = $derived(nodesQuery.isLoading);
	const currentNodeId = $derived(page.url.searchParams.get('node'));

	function handleNodeClick(nodeId: string) {
		goto(`/worlds/${worldId}/nodes/${nodeId}`);
	}

	const graphColors = {
		start: 'oklch(0.723 0.219 142.5)',
		end: 'oklch(0.705 0.191 47.604)',
		current: 'var(--chart-2)',
		default: 'var(--secondary)'
	};

	const { nodes: flowNodes, edges: flowEdges } = $derived.by(() => {
		if (!storyNodes.length) return { nodes: [], edges: [] };
		const result = transformNodesToFlow(storyNodes);
		result.nodes.forEach((node) => {
			node.data.onNodeClick = handleNodeClick;
			node.data.isCurrent = node.id === currentNodeId;
		});
		return result;
	});

	const nodes = $derived(flowNodes);
	const edges = $derived(flowEdges);

	const nodeTypes = {
		custom: FlowNode
	} as NodeTypes;

	function handleBackToStory() {
		const url = currentNodeId ? `/worlds/${worldId}/nodes/${currentNodeId}` : `/worlds/${worldId}`;
		goto(url);
	}
</script>

<!-- WorldHeader is rendered by the layout -->
<div class="relative h-full w-full">
	{#if isLoading}
		<div
			class="flex h-full items-center justify-center"
			role="status"
			aria-label="Loading story map"
		>
			<div class="flex flex-col items-center gap-4">
				<!-- Skeleton placeholder mimicking the graph layout -->
				<div class="flex items-center gap-6">
					<Skeleton class="h-10 w-24 rounded-lg" />
					<Skeleton class="h-1 w-12 rounded" />
					<Skeleton class="h-10 w-24 rounded-lg" />
					<Skeleton class="h-1 w-12 rounded" />
					<Skeleton class="h-10 w-24 rounded-lg" />
				</div>
				<div class="flex items-center gap-6">
					<Skeleton class="h-10 w-24 rounded-lg" />
					<Skeleton class="h-1 w-12 rounded" />
					<Skeleton class="h-10 w-24 rounded-lg" />
				</div>
				<p class="text-sm text-muted-foreground">Loading story map...</p>
			</div>
		</div>
	{:else if nodesQuery.isError}
		<div class="flex h-full items-center justify-center">
			<div class="flex flex-col items-center justify-center gap-4 p-8">
				<p class="text-destructive">Failed to load story nodes. Please try again.</p>
				<Button variant="outline" onclick={() => nodesQuery.refetch()}>Retry</Button>
			</div>
		</div>
	{:else if nodes.length === 0}
		<div class="flex h-full items-center justify-center">
			<div class="flex flex-col items-center gap-4 text-center">
				<div class="rounded-full border border-dashed border-muted-foreground/40 bg-muted/20 p-3">
					<Rocket class="h-8 w-8 text-muted-foreground" />
				</div>
				<div class="space-y-2">
					<p class="text-lg text-muted-foreground">No story nodes yet</p>
					<p class="text-sm text-muted-foreground/70">
						Start your adventure to build out the story map
					</p>
				</div>
				{#if rootNodeId}
					<Button onclick={() => goto(`/worlds/${worldId}/nodes/${rootNodeId}`)} class="gap-2">
						<BookOpen class="h-4 w-4" />
						Enter the Story
					</Button>
				{/if}
			</div>
		</div>
	{:else}
		<div class="pointer-events-none absolute inset-x-0 top-0 z-10 px-6 py-8">
			<div class="mx-auto flex max-w-4xl items-center justify-between gap-4">
				<div class="pointer-events-auto flex items-center gap-2">
					<Badge class="legend-badge legend-badge-start shadow-lg">Start</Badge>
					<Badge class="legend-badge legend-badge-end shadow-lg">End</Badge>
					{#if currentNodeId}
						<Badge class="legend-badge legend-badge-current shadow-lg">Current</Badge>
					{/if}
				</div>

				<Button
					variant="outline"
					size="sm"
					onclick={handleBackToStory}
					class="pointer-events-auto gap-1.5"
				>
					<BookOpen class="h-4 w-4" />
					Story
				</Button>
			</div>
		</div>

		<StoryGraph {nodes} {edges} {nodeTypes} {currentNodeId} {graphColors} />
	{/if}
</div>

<style>
	/* Legend badge styling matching flow node colors */
	:global(.legend-badge) {
		border-width: 2px !important;
	}

	:global(.legend-badge-start) {
		/* Green (green-500) */
		background-color: color-mix(in oklch, oklch(0.723 0.219 142.5) 15%, var(--card)) !important;
		border-color: oklch(0.723 0.219 142.5) !important;
		color: oklch(0.723 0.219 142.5) !important;
	}

	:global(.legend-badge-end) {
		/* Orange (orange-500) */
		background-color: color-mix(in oklch, oklch(0.705 0.191 47.604) 15%, var(--card)) !important;
		border-color: oklch(0.705 0.191 47.604) !important;
		color: oklch(0.705 0.191 47.604) !important;
	}

	:global(.legend-badge-current) {
		background-color: color-mix(in oklch, var(--chart-2) 15%, var(--card)) !important;
		border-color: var(--chart-2) !important;
		color: var(--chart-2) !important;
	}

	/* Dark theme styling for SvelteFlow - using oklch color format */
	:global(.svelte-flow) {
		background-color: var(--background) !important;
	}

	:global(.svelte-flow__background) {
		background-color: var(--background) !important;
	}

	:global(.svelte-flow__background pattern circle) {
		fill: oklch(from var(--muted-foreground) l c h / 0.4) !important;
	}

	:global(.svelte-flow__controls) {
		background-color: var(--card) !important;
		border: 1px solid var(--border) !important;
		box-shadow: 0 4px 12px oklch(0 0 0 / 0.3) !important;
		border-radius: 0.5rem !important;
		overflow: hidden;
	}

	:global(.svelte-flow__controls-button) {
		background-color: var(--card) !important;
		border-color: var(--border) !important;
		color: var(--foreground) !important;
	}

	:global(.svelte-flow__controls-button:hover) {
		background-color: var(--secondary) !important;
	}

	:global(.svelte-flow__controls-button svg) {
		fill: var(--foreground) !important;
	}

	:global(.svelte-flow__minimap) {
		background-color: var(--card) !important;
		border: 1px solid var(--border) !important;
		box-shadow: 0 4px 12px oklch(0 0 0 / 0.3) !important;
		border-radius: 0.5rem !important;
		overflow: hidden;
	}

	:global(.svelte-flow__minimap-mask) {
		fill: oklch(from var(--background) l c h / 0.7) !important;
	}

	:global(.svelte-flow__edge-path) {
		stroke: var(--primary) !important;
		stroke-width: 2px !important;
	}

	:global(.svelte-flow__attribution) {
		display: none !important;
	}
</style>
