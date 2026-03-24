<script lang="ts">
	import { SvelteFlow, Controls, Background, BackgroundVariant, MiniMap } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';
	import type { Node, Edge, NodeTypes } from '@xyflow/svelte';

	interface Props {
		nodes: Node[];
		edges: Edge[];
		nodeTypes: NodeTypes;
		currentNodeId: string | null;
		graphColors: { start: string; end: string; current: string; default: string };
	}

	let { nodes, edges, nodeTypes, currentNodeId, graphColors }: Props = $props();
</script>

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
		nodeColor={(node: {
			id: string;
			data?: { isRoot?: boolean; isLeaf?: boolean; storyNode?: { choices: unknown[] } };
		}) => {
			if (node.id === currentNodeId) return graphColors.current;
			if (node.data?.isRoot) return graphColors.start;
			if (node.data?.isLeaf && node.data.storyNode?.choices.length === 0) return graphColors.end;
			return graphColors.default;
		}}
		nodeStrokeWidth={3}
		pannable
		zoomable
		maskColor="oklch(0.2132 0.0183 245.2123 / 0.8)"
	/>
</SvelteFlow>
