<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import type { NodeTypes } from '@xyflow/svelte';
	import { useWorldNodes } from '$lib/queries';
	import { transformNodesToFlow } from '$lib/utils/nodeTransform';
	import FlowNode from '$lib/components/shared/FlowNode.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { BookOpen } from '@lucide/svelte';

	const worldId = page.params.worldId!;
	const nodesQuery = useWorldNodes(worldId);

	const storyNodes = $derived(nodesQuery.data ?? []);
	const isLoading = $derived(nodesQuery.isLoading);
	const currentNodeId = $derived(page.url.searchParams.get('node'));

	function handleNodeClick(nodeId: string) {
		goto(`/worlds/${worldId}/nodes/${nodeId}`);
	}

	const { nodes: flowNodes, edges: flowEdges } = $derived.by(() => {
		if (!storyNodes.length) return { nodes: [], edges: [] };
		const result = transformNodesToFlow(storyNodes);
		result.nodes.forEach((node) => {
			node.data.onNodeClick = handleNodeClick;
			node.data.isCurrent = node.id === currentNodeId;
		});
		return result;
	});

	const graphColors = {
		start: 'oklch(0.723 0.219 142.5)',
		end: 'oklch(0.705 0.191 47.604)',
		current: 'var(--chart-2)',
		default: 'var(--secondary)'
	};

	const nodes = $derived(flowNodes);
	const edges = $derived(flowEdges);

	const nodeTypes = {
		custom: FlowNode
	} as NodeTypes;

	function handleBackToStory() {
		const url = currentNodeId ? `/worlds/${worldId}/nodes/${currentNodeId}` : `/worlds/${worldId}`;
		goto(url);
	}

	// Lazy-load the heavy @xyflow/svelte library
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let xyflowComponents = $state<Record<string, any> | null>(null);

	onMount(async () => {
		const [mod, _css] = await Promise.all([
			import('@xyflow/svelte'),
			import('@xyflow/svelte/dist/style.css')
		]);
		xyflowComponents = {
			SvelteFlow: mod.SvelteFlow,
			Controls: mod.Controls,
			Background: mod.Background,
			BackgroundVariant: mod.BackgroundVariant,
			MiniMap: mod.MiniMap
		};
	});
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
			<div class="text-center">
				<p class="text-lg text-muted-foreground">No story nodes found</p>
				<p class="mt-2 text-sm text-muted-foreground/70">
					Start creating your story to see the map
				</p>
			</div>
		</div>
	{:else if !xyflowComponents}
		<div class="flex h-full items-center justify-center">
			<p class="text-sm text-muted-foreground">Loading graph...</p>
		</div>
	{:else}
		{@const SvelteFlow = xyflowComponents.SvelteFlow}
		{@const FlowControls = xyflowComponents.Controls}
		{@const FlowBackground = xyflowComponents.Background}
		{@const BGVariant = xyflowComponents.BackgroundVariant}
		{@const FlowMiniMap = xyflowComponents.MiniMap}

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
					class="pointer-events-auto gap-1.5 shadow-lg"
				>
					<BookOpen class="h-4 w-4" />
					Story
				</Button>
			</div>
		</div>

		<SvelteFlow
			{nodes}
			{edges}
			{nodeTypes}
			fitView
			fitViewOptions={{ padding: 0.2 }}
			minZoom={0.1}
			maxZoom={2}
			defaultEdgeOptions={{
				type: 'smoothstep',
				animated: false,
				style: 'stroke: oklch(0.9536 0.0872 97.9082); stroke-width: 2px;'
			}}
		>
			<FlowControls />
			<FlowBackground variant={BGVariant.Dots} gap={16} size={1} />
			<FlowMiniMap
				nodeColor={(node: { id: string; data?: { isRoot?: boolean; isLeaf?: boolean } }) => {
					if (node.id === currentNodeId) return graphColors.current;
					if (node.data?.isRoot) return graphColors.start;
					if (node.data?.isLeaf) return graphColors.end;
					return graphColors.default;
				}}
				nodeStrokeWidth={3}
				pannable
				zoomable
				maskColor="oklch(0.2132 0.0183 245.2123 / 0.8)"
			/>
		</SvelteFlow>
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
