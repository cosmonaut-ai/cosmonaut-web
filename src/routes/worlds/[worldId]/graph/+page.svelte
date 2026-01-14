<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { SvelteFlow, Controls, Background, BackgroundVariant, MiniMap } from '@xyflow/svelte';
	import type { NodeTypes } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';
	import type { PageData } from './$types';
	import { transformNodesToFlow } from '$lib/utils/nodeTransform';
	import FlowNode from '$lib/components/FlowNode.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Rocket } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	// Handle node click - navigate to the story page with that node
	function handleNodeClick(nodeId: string) {
		goto(`/worlds/${data.world.id}?node=${nodeId}`);
	}

	// Transform story nodes to flow format and add click handlers
	const { nodes: flowNodes, edges: flowEdges } = $derived.by(() => {
		const result = transformNodesToFlow(data.nodes);
		// Add click handler to all nodes
		result.nodes.forEach((node) => {
			node.data.onNodeClick = handleNodeClick;
		});
		return result;
	});

	// Use $state.raw for performance with large node arrays
	const nodes = $derived(flowNodes);
	const edges = $derived(flowEdges);

	// Define custom node types - cast to satisfy @xyflow/svelte types
	const nodeTypes = {
		custom: FlowNode
	} as NodeTypes;

	// Get current node from URL if present
	const currentNodeId = $derived(page.url.searchParams.get('node'));

	function handleBack() {
		const url = currentNodeId
			? `/worlds/${data.world.id}?node=${currentNodeId}`
			: `/worlds/${data.world.id}`;
		goto(url);
	}
</script>

<svelte:head>
	<title>{data.world.title || 'World'} - Story Map</title>
</svelte:head>

<div class="flex h-screen flex-col bg-background">
	<!-- Header -->
	<header class="border-b border-border bg-card/50">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
			<div class="flex items-center gap-4">
				<Button variant="ghost" size="sm" onclick={handleBack} class="gap-2">
					<ArrowLeft class="h-4 w-4" />
					Back to Story
				</Button>
				<div class="h-6 w-px bg-border"></div>
				<div class="flex items-center gap-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10"
					>
						<Rocket class="h-5 w-5 text-primary" />
					</div>
					<div>
						<h1 class="font-bold text-foreground">
							{data.world.title || 'Untitled World'}
						</h1>
						<p class="text-sm text-muted-foreground">Story Map</p>
					</div>
				</div>
			</div>

			<!-- Legend -->
			<div class="flex items-center gap-4 text-sm text-muted-foreground">
				<div class="flex items-center gap-2">
					<div
						class="h-3 w-3 rounded-full bg-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-background"
					></div>
					<span>Start</span>
				</div>
				<div class="flex items-center gap-2">
					<div
						class="h-3 w-3 rounded-full bg-amber-500 ring-2 ring-amber-500/30 ring-offset-2 ring-offset-background"
					></div>
					<span>End</span>
				</div>
				{#if currentNodeId}
					<div class="flex items-center gap-2">
						<div
							class="h-3 w-3 rounded-full bg-blue-500 ring-2 ring-blue-500/30 ring-offset-2 ring-offset-background"
						></div>
						<span>Current</span>
					</div>
				{/if}
			</div>
		</div>
	</header>

	<!-- Flow visualization -->
	<div class="flex-1">
		{#if nodes.length === 0}
			<div class="flex h-full items-center justify-center">
				<div class="text-center">
					<p class="text-lg text-muted-foreground">No story nodes found</p>
					<p class="mt-2 text-sm text-muted-foreground/70">
						Start creating your story to see the map
					</p>
				</div>
			</div>
		{:else}
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
				<Controls />
				<Background variant={BackgroundVariant.Dots} gap={16} size={1} />
				<MiniMap
					nodeColor={(node) => {
						if (node.id === currentNodeId) return 'oklch(0.623 0.214 259.1)'; // blue-500
						if (node.data?.isRoot) return 'oklch(0.9536 0.0872 97.9082)'; // primary (golden)
						if (node.data?.isLeaf) return 'oklch(0.769 0.188 70.08)'; // amber-500
						return 'oklch(0.377 0.0482 247.087)'; // secondary
					}}
					nodeStrokeWidth={3}
					pannable
					zoomable
					maskColor="oklch(0.2132 0.0183 245.2123 / 0.8)"
				/>
			</SvelteFlow>
		{/if}
	</div>
</div>

<style>
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
