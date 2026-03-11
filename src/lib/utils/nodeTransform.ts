import type { StoryNode } from '$lib/types/api';
import type { Node, Edge } from '@xyflow/svelte';
import { logger } from '$lib/utils/logger';

export interface FlowNodeData extends Record<string, unknown> {
	storyNode: StoryNode;
	isRoot: boolean;
	isLeaf: boolean;
	isCurrent?: boolean;
	onNodeClick?: (nodeId: string) => void;
}

interface NodeWithDepth {
	node: StoryNode;
	depth: number;
	children: NodeWithDepth[];
}

/**
 * Transforms an array of StoryNodes into Svelte Flow nodes and edges
 */
export function transformNodesToFlow(storyNodes: StoryNode[]): {
	nodes: Node<FlowNodeData>[];
	edges: Edge[];
} {
	if (storyNodes.length === 0) {
		return { nodes: [], edges: [] };
	}

	// Build a map for quick lookup
	const nodeMap = new Map<string, StoryNode>();
	storyNodes.forEach((node) => nodeMap.set(node.id, node));

	// Find root node (no parent_id)
	const rootNode = storyNodes.find((node) => !node.parent_id);
	if (!rootNode) {
		// If no root found, use the first node
		logger.warn('No root node found, using first node as root');
		return transformNodesWithoutRoot(storyNodes);
	}

	// Build tree structure with depth information
	const tree = buildTreeWithDepth(rootNode, nodeMap, 0);

	// Calculate positions using hierarchical layout
	const positions = calculateHierarchicalLayout(tree);

	// Create Flow nodes
	const flowNodes: Node<FlowNodeData>[] = storyNodes.map((storyNode) => {
		const isRoot = !storyNode.parent_id;
		const isLeaf = !storyNode.choices.some((choice) => choice.target !== null);
		const position = positions.get(storyNode.id) || { x: 0, y: 0 };

		return {
			id: storyNode.id,
			type: 'custom',
			position,
			data: {
				storyNode,
				isRoot,
				isLeaf
			}
		};
	});

	// Create edges
	const edges: Edge[] = [];
	const edgeSet = new Set<string>(); // Prevent duplicate edges

	storyNodes.forEach((node) => {
		// Parent-child edges
		if (node.parent_id && nodeMap.has(node.parent_id)) {
			const edgeId = `${node.parent_id}-${node.id}`;
			if (!edgeSet.has(edgeId)) {
				edges.push({
					id: edgeId,
					source: node.parent_id,
					target: node.id,
					type: 'smoothstep',
					animated: false
				});
				edgeSet.add(edgeId);
			}
		}

		// Choice-target edges (if different from parent-child)
		node.choices.forEach((choice, index) => {
			if (choice.target && nodeMap.has(choice.target)) {
				const edgeId = `${node.id}-${choice.target}`;
				// Only add if not already added as parent-child edge
				if (!edgeSet.has(edgeId)) {
					edges.push({
						id: `${node.id}-choice${index}-${choice.target}`,
						source: node.id,
						target: choice.target,
						type: 'smoothstep',
						animated: true,
						style: 'stroke: #94a3b8; stroke-dasharray: 5;'
					});
					edgeSet.add(edgeId);
				}
			}
		});
	});

	return { nodes: flowNodes, edges };
}

/**
 * Builds a tree structure with depth information
 */
function buildTreeWithDepth(
	node: StoryNode,
	nodeMap: Map<string, StoryNode>,
	depth: number
): NodeWithDepth {
	const children: NodeWithDepth[] = [];

	// Find direct children (nodes with this node as parent)
	nodeMap.forEach((potentialChild) => {
		if (potentialChild.parent_id === node.id) {
			children.push(buildTreeWithDepth(potentialChild, nodeMap, depth + 1));
		}
	});

	return { node, depth, children };
}

/**
 * Calculates hierarchical layout positions for nodes
 */
function calculateHierarchicalLayout(tree: NodeWithDepth): Map<string, { x: number; y: number }> {
	const positions = new Map<string, { x: number; y: number }>();
	const VERTICAL_SPACING = 250;
	const HORIZONTAL_SPACING = 300;

	// Group nodes by depth
	const nodesByDepth = new Map<number, NodeWithDepth[]>();
	collectNodesByDepth(tree, nodesByDepth);

	// Calculate positions layer by layer
	nodesByDepth.forEach((nodesAtDepth, depth) => {
		const y = depth * VERTICAL_SPACING;
		const totalWidth = (nodesAtDepth.length - 1) * HORIZONTAL_SPACING;
		const startX = -totalWidth / 2;

		nodesAtDepth.forEach((nodeWithDepth, index) => {
			const x = startX + index * HORIZONTAL_SPACING;
			positions.set(nodeWithDepth.node.id, { x, y });
		});
	});

	return positions;
}

/**
 * Collects nodes grouped by their depth
 */
function collectNodesByDepth(
	nodeWithDepth: NodeWithDepth,
	nodesByDepth: Map<number, NodeWithDepth[]>
): void {
	if (!nodesByDepth.has(nodeWithDepth.depth)) {
		nodesByDepth.set(nodeWithDepth.depth, []);
	}
	nodesByDepth.get(nodeWithDepth.depth)!.push(nodeWithDepth);

	nodeWithDepth.children.forEach((child) => {
		collectNodesByDepth(child, nodesByDepth);
	});
}

/**
 * Fallback transformation when no root node is found
 */
function transformNodesWithoutRoot(storyNodes: StoryNode[]): {
	nodes: Node<FlowNodeData>[];
	edges: Edge[];
} {
	const HORIZONTAL_SPACING = 300;
	const VERTICAL_SPACING = 250;

	const flowNodes: Node<FlowNodeData>[] = storyNodes.map((storyNode, index) => {
		const isRoot = !storyNode.parent_id;
		const isLeaf = !storyNode.choices.some((choice) => choice.target !== null);

		return {
			id: storyNode.id,
			type: 'custom',
			position: {
				x: (index % 3) * HORIZONTAL_SPACING,
				y: Math.floor(index / 3) * VERTICAL_SPACING
			},
			data: {
				storyNode,
				isRoot,
				isLeaf
			}
		};
	});

	const edges: Edge[] = [];
	const nodeMap = new Map<string, StoryNode>();
	storyNodes.forEach((node) => nodeMap.set(node.id, node));

	storyNodes.forEach((node) => {
		if (node.parent_id && nodeMap.has(node.parent_id)) {
			edges.push({
				id: `${node.parent_id}-${node.id}`,
				source: node.parent_id,
				target: node.id,
				type: 'smoothstep'
			});
		}
	});

	return { nodes: flowNodes, edges };
}
