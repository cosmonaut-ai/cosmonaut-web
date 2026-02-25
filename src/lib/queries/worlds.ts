import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import { getWorlds, getWorld, createWorld, deleteWorld, updateWorldSharing } from '$lib/api/client';
import {
	ApiError,
	type CreateWorldRequest,
	type UpdateWorldSharingRequest,
	type World
} from '$lib/types/api';
import { showError, showSuccess } from '$lib/utils/toast';
import { usageKeys } from './subscription';

/**
 * Query keys for worlds - use these for cache invalidation
 */
export const worldKeys = {
	all: ['worlds'] as const,
	detail: (id: string) => ['worlds', id] as const
};

/**
 * Query hook to fetch all worlds for the current user
 */
export function useWorlds() {
	return createQuery(() => ({
		queryKey: worldKeys.all,
		queryFn: getWorlds
	}));
}

type MaybeGetter<T> = T | (() => T);

/** Resolve a value that might be a getter */
function resolve<T>(value: MaybeGetter<T>): T {
	return typeof value === 'function' ? (value as () => T)() : value;
}

/**
 * Query hook to fetch a specific world by ID
 * Pass a getter function to ensure reactivity with $derived values
 * Supports polling for world generation status
 */
export function useWorld(worldId: MaybeGetter<string>, options?: { enablePolling?: boolean }) {
	return createQuery(() => {
		const id = resolve(worldId);
		return {
			queryKey: worldKeys.detail(id),
			queryFn: () => getWorld(id),
			enabled: !!id,
			refetchInterval: (query: { state: { data?: World; error: Error | null } }) => {
				if (!options?.enablePolling) return false;
				if (query.state.error) return false;
				const status = query.state.data?.generation_status;
				return status === 'completed' || status === 'failed' ? false : 2000;
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
			client.invalidateQueries({ queryKey: worldKeys.all });
			client.invalidateQueries({ queryKey: usageKeys.all });
			showSuccess('World created', 'Your world is being generated');
		},
		onError: (error: Error) => {
			if (error instanceof ApiError && error.isStorageQuotaExceeded) {
				client.invalidateQueries({ queryKey: usageKeys.all });
				showError(
					'Saved worlds limit reached',
					'Delete an existing world or upgrade your plan to create more.'
				);
			} else if (error instanceof ApiError && error.isQuotaExceeded) {
				client.invalidateQueries({ queryKey: usageKeys.all });
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
			client.invalidateQueries({ queryKey: worldKeys.all });
			client.invalidateQueries({ queryKey: usageKeys.all });
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
			client.setQueryData(worldKeys.detail(worldId), updatedWorld);
			client.invalidateQueries({ queryKey: worldKeys.all });
			showSuccess('Sharing settings updated');
		},
		onError: (error: Error) => {
			showError('Failed to update sharing settings', error.message);
		}
	}));
}
