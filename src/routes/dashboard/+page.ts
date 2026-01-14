import { getWorlds } from '$lib/api/client';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	// Fetch user's worlds
	const worlds = await getWorlds();

	return {
		worlds
	};
};
