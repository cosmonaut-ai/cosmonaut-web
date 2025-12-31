import { getWorld } from '$lib/api/client';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ params }) => {
	const worldId = params.worldId;
	const world = await getWorld(worldId);

	return {
		world
	};
};
