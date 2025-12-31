import { getNode } from '$lib/api/client';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, url, parent }) => {
	const worldId = params.worldId;
	const { world } = await parent();
	let currentNode = null;

	// Check if a specific node is requested via query parameter
	const nodeId = url.searchParams.get('node');
	const targetNodeId = nodeId || world.root_node_id;

	if (targetNodeId) {
		try {
			currentNode = await getNode(worldId, targetNodeId);
		} catch (err) {
			console.error('Error loading node:', err);
			// Continue without node if it fails
		}
	}

	return {
		currentNode
	};
};
