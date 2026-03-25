import {
	createQuery,
	createMutation,
	createInfiniteQuery,
	useQueryClient,
	type InfiniteData
} from '@tanstack/svelte-query';
import {
	getWorlds,
	getWorld,
	getFeaturedWorlds,
	createWorld,
	deleteWorld,
	updateWorldSharing,
	createInviteToken,
	getInviteToken,
	deleteInviteToken
} from '$lib/api/worlds';
import type { PaginatedWorldsResponse } from '$lib/api/worlds';
import {
	ApiError,
	type CreateWorldRequest,
	type InviteToken,
	type UpdateWorldSharingRequest,
	type World
} from '$lib/types/api';
import { POLL_INTERVAL_MS } from '$lib/api/core';
import { showError, showSuccess, showWarning } from '$lib/utils/toast';
import { queryKeys } from './keys';
import { type MaybeGetter, resolve } from './utils';

/**
 * Query hook to fetch featured public worlds for the dashboard carousel.
 */
export function useFeaturedWorlds() {
	return createQuery(() => ({
		queryKey: queryKeys.worlds.featured,
		queryFn: getFeaturedWorlds,
		staleTime: 10 * 60_000
	}));
}

/**
 * Infinite query hook to fetch worlds for the current user with cursor pagination.
 * Pages are accumulated; call `fetchNextPage()` to load more when `hasNextPage` is true.
 */
export function useWorlds() {
	return createInfiniteQuery<
		PaginatedWorldsResponse,
		Error,
		InfiniteData<PaginatedWorldsResponse>,
		typeof queryKeys.worlds.all,
		string | null
	>(() => ({
		queryKey: queryKeys.worlds.all,
		queryFn: ({ pageParam }) => getWorlds(pageParam),
		initialPageParam: null,
		getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
		staleTime: 5 * 60_000
	}));
}

/**
 * Query hook to fetch a specific world by ID
 * Pass a getter function to ensure reactivity with $derived values
 * Supports polling for world generation status
 */
export function useWorld(
	worldId: MaybeGetter<string>,
	options?: { enablePolling?: boolean; invite?: MaybeGetter<string | null> }
) {
	return createQuery(() => {
		const id = resolve(worldId);
		return {
			queryKey: queryKeys.worlds.detail(id),
			queryFn: () =>
				getWorld(
					resolve(worldId),
					options?.invite !== undefined ? resolve(options.invite) : undefined
				),
			enabled: !!id,
			refetchInterval: (query: { state: { data?: World; error: Error | null } }) => {
				if (!options?.enablePolling) return false;
				if (query.state.error) return false;
				const world = query.state.data;
				const genDone =
					world?.generation_status === 'completed' || world?.generation_status === 'failed';
				const imgDone =
					!world?.image_generation_status ||
					world.image_generation_status === 'completed' ||
					world.image_generation_status === 'failed';
				return genDone && imgDone ? false : POLL_INTERVAL_MS;
			},
			refetchIntervalInBackground: false
		};
	});
}

/**
 * Mutation hook to create a new world
 */
export function useCreateWorld() {
	const client = useQueryClient();
	return createMutation(() => ({
		mutationFn: (data: CreateWorldRequest) => createWorld(data),
		onSuccess: () => {
			client.invalidateQueries({ queryKey: queryKeys.worlds.all });
			client.invalidateQueries({ queryKey: queryKeys.user.all });
			showSuccess('World created', 'Your world is being generated');
		},
		onError: (error: Error) => {
			if (error instanceof ApiError && error.isRateLimited) {
				showWarning(
					'Slow down',
					"You're creating worlds too quickly. Please wait a moment and try again."
				);
			} else if (error instanceof ApiError && error.isQuotaExceeded) {
				client.invalidateQueries({ queryKey: queryKeys.user.all });
				showError(
					'World creation limit reached',
					'Upgrade your plan or wait for your usage period to reset.'
				);
			} else {
				showError('Failed to create world', error.message);
			}
		}
	}));
}

/**
 * Mutation hook to delete a world
 */
export function useDeleteWorld() {
	const client = useQueryClient();
	return createMutation(() => ({
		mutationFn: (worldId: string) => deleteWorld(worldId),
		onSuccess: () => {
			client.invalidateQueries({ queryKey: queryKeys.worlds.all });
			client.invalidateQueries({ queryKey: queryKeys.user.all });
			showSuccess('World deleted');
		},
		onError: (error: Error) => {
			showError('Failed to delete world', error.message);
		}
	}));
}

/**
 * Mutation hook to update world sharing settings
 */
export function useUpdateWorldSharing(worldId: string) {
	const client = useQueryClient();
	return createMutation(() => ({
		mutationFn: (data: UpdateWorldSharingRequest) => updateWorldSharing(worldId, data),
		onSuccess: (updatedWorld: World) => {
			client.setQueryData(queryKeys.worlds.detail(worldId), updatedWorld);
			client.invalidateQueries({ queryKey: queryKeys.worlds.all });
		},
		onError: (error: Error) => {
			showError('Failed to update sharing settings', error.message);
		}
	}));
}

// ---------------------------------------------------------------------------
// Invite token queries
// ---------------------------------------------------------------------------

/**
 * Query hook to fetch the active invite token for a world (owner-only).
 * Only enabled when explicitly requested (e.g. when the share modal opens
 * for a private world).
 */
export function useInviteToken(worldId: MaybeGetter<string>, enabled: MaybeGetter<boolean> = true) {
	return createQuery(() => {
		const id = resolve(worldId);
		return {
			queryKey: queryKeys.worlds.inviteToken(id),
			queryFn: () => getInviteToken(id),
			enabled: !!id && resolve(enabled)
		};
	});
}

export function useCreateInviteToken(worldId: string) {
	const client = useQueryClient();
	return createMutation(() => ({
		mutationFn: () => createInviteToken(worldId),
		onSuccess: (token: InviteToken) => {
			client.setQueryData(queryKeys.worlds.inviteToken(worldId), token);
		},
		onError: (error: Error) => {
			showError('Failed to create invite link', error.message);
		}
	}));
}

export function useDeleteInviteToken(worldId: string) {
	const client = useQueryClient();
	return createMutation(() => ({
		mutationFn: () => deleteInviteToken(worldId),
		onSuccess: () => {
			client.setQueryData(queryKeys.worlds.inviteToken(worldId), null);
			showSuccess('Invite link deleted');
		},
		onError: (error: Error) => {
			showError('Failed to delete invite link', error.message);
		}
	}));
}
