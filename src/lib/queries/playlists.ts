import { createQuery } from '@tanstack/svelte-query';
import { getPlaylist } from '$lib/api/playlists';
import { queryKeys } from './keys';
import { type MaybeGetter, resolve } from './utils';

/**
 * Query hook to fetch a soundtrack playlist by ID.
 * Disabled by default — only fetches when a valid playlistId is provided
 * and `enabled` resolves to true.
 */
export function usePlaylist(
	playlistId: MaybeGetter<string | null | undefined>,
	options?: { enabled?: MaybeGetter<boolean> }
) {
	return createQuery(() => {
		const id = resolve(playlistId);
		const enabled = options?.enabled === undefined ? true : resolve(options.enabled);
		return {
			queryKey: queryKeys.playlists.detail(id ?? ''),
			queryFn: () => getPlaylist(id!),
			enabled: !!id && enabled,
			staleTime: Infinity
		};
	});
}
