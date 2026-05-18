<script lang="ts">
	import { SvelteFlow, Background, BackgroundVariant } from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';
	import type { Node, Edge, NodeTypes } from '@xyflow/svelte';
	import PreviewFlowNode from './PreviewFlowNode.svelte';

	interface PreviewNode {
		id: string;
		title: string;
		summary: string;
		isRoot?: boolean;
		isLeaf?: boolean;
	}

	interface Props {
		nodes: PreviewNode[];
		edges: { source: string; target: string }[];
		positions: Record<string, { x: number; y: number }>;
		class?: string;
	}

	let {
		nodes: previewNodes,
		edges: previewEdges,
		positions,
		class: className = ''
	}: Props = $props();

	const flowNodes: Node[] = $derived(
		previewNodes.map((n) => ({
			id: n.id,
			type: 'preview',
			position: positions[n.id] ?? { x: 0, y: 0 },
			data: { title: n.title, summary: n.summary, isRoot: !!n.isRoot, isLeaf: !!n.isLeaf },
			draggable: false,
			selectable: false,
			connectable: false
		}))
	);

	const flowEdges: Edge[] = $derived(
		previewEdges.map((e, i) => ({
			id: `e${i}`,
			source: e.source,
			target: e.target,
			type: 'smoothstep',
			animated: false,
			style: 'stroke: oklch(0.65 0.05 90 / 0.5); stroke-width: 1.5px;'
		}))
	);

	const nodeTypes: NodeTypes = { preview: PreviewFlowNode };
</script>

<div
	class={`story-map-preview h-[420px] w-full overflow-hidden rounded-lg border border-border/60 bg-card/30 ${className}`}
>
	<SvelteFlow
		nodes={flowNodes}
		edges={flowEdges}
		{nodeTypes}
		fitView
		fitViewOptions={{ padding: 0.18 }}
		minZoom={0.5}
		maxZoom={1.2}
		zoomOnScroll={false}
		zoomOnPinch={false}
		zoomOnDoubleClick={false}
		panOnScroll={false}
		panOnDrag={false}
		preventScrolling={false}
		proOptions={{ hideAttribution: true }}
	>
		<Background variant={BackgroundVariant.Dots} gap={18} size={1} />
	</SvelteFlow>
</div>

<style>
	/* Hide selection rings since the preview is read-only */
	:global(.story-map-preview .svelte-flow__node) {
		cursor: default;
	}
	:global(.story-map-preview .svelte-flow__handle) {
		opacity: 0;
		pointer-events: none;
	}
</style>
