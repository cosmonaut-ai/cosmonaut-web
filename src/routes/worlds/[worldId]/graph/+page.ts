import { getWorldNodes } from '$lib/api/client';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, parent, fetch }) => {
	const { world } = await parent();
	const nodes = await getWorldNodes(params.worldId, fetch);

	return {
		world,
		nodes
	};
};
