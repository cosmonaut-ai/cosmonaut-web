import { getWorld, getWorldNodes } from '$lib/api/client';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
	const [world, nodes] = await Promise.all([
		getWorld(params.worldId),
		getWorldNodes(params.worldId, fetch)
	]);

	return {
		world,
		nodes
	};
};
