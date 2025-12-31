<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { SvelteFlow, Controls, Background, MiniMap } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';
	import type { PageData } from './$types';
	import { transformNodesToFlow } from '$lib/utils/nodeTransform';
	import FlowNode from '$lib/components/FlowNode.svelte';

	let { data }: { data: PageData } = $props();

	const { world, nodes: storyNodes } = data;

	// Handle node click - navigate to the story page with that node
	function handleNodeClick(nodeId: string) {
		console.log('Node clicked:', nodeId);
		goto(`/worlds/${world.id}?node=${nodeId}`);
	}

	// Transform story nodes to flow format
	const { nodes: flowNodes, edges: flowEdges } = transformNodesToFlow(storyNodes);

	// Add click handler to all nodes
	flowNodes.forEach((node) => {
		node.data.onNodeClick = handleNodeClick;
	});

	// Use $state.raw for performance with large node arrays
	const nodes = $state.raw(flowNodes);
	const edges = $state.raw(flowEdges);

	// Define custom node types
	const nodeTypes = {
		custom: FlowNode
	};

	// Get current node from URL if present
	const currentNodeId = $page.url.searchParams.get('node');
</script>

<svelte:head>
	<title>{world.title || 'World'} - Story Map</title>
</svelte:head>

<div class="flex h-screen flex-col bg-gray-50">
	<!-- Header -->
	<header class="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
		<div class="mx-auto flex max-w-7xl items-center justify-between">
			<div class="flex items-center gap-4">
				<button
					onclick={() =>
						goto(`/worlds/${world.id}${currentNodeId ? '?node=' + currentNodeId : ''}`)}
					class="flex items-center gap-2 text-gray-600 hover:text-gray-900"
				>
					← Back to Story
				</button>
				<div class="h-6 w-px bg-gray-300"></div>
				<div>
					<h1 class="text-xl font-bold text-gray-900">
						{world.title || 'Untitled World'}
					</h1>
					<p class="text-sm text-gray-600">Story Map</p>
				</div>
			</div>
			<div class="flex items-center gap-2 text-sm text-gray-600">
				<div class="flex items-center gap-2">
					<div class="h-3 w-3 rounded-full bg-green-400 ring-2 ring-green-400 ring-offset-2"></div>
					<span>Start</span>
				</div>
				<div class="flex items-center gap-2">
					<div
						class="h-3 w-3 rounded-full bg-orange-400 ring-2 ring-orange-400 ring-offset-2"
					></div>
					<span>End</span>
				</div>
			</div>
		</div>
	</header>

	<!-- Flow visualization -->
	<div class="flex-1">
		{#if nodes.length === 0}
			<div class="flex h-full items-center justify-center">
				<div class="text-center">
					<p class="text-lg text-gray-600">No story nodes found</p>
					<p class="text-sm text-gray-500">Start creating your story to see the map</p>
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
					animated: false
				}}
			>
				<Controls />
				<Background variant="dots" gap={16} size={1} />
				<MiniMap
					nodeColor={(node) => {
						if (node.id === currentNodeId) return '#3b82f6';
						if (node.data?.isRoot) return '#4ade80';
						if (node.data?.isLeaf) return '#fb923c';
						return '#e5e7eb';
					}}
					nodeStrokeWidth={3}
					pannable
					zoomable
				/>
			</SvelteFlow>
		{/if}
	</div>
</div>

<style>
	:global(.svelte-flow) {
		background-color: #fafafa;
	}

	:global(.svelte-flow__controls) {
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
	}

	:global(.svelte-flow__minimap) {
		box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
	}
</style>
