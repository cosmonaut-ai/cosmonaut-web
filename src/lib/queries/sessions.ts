import {
	createInfiniteQuery,
	createMutation,
	createQuery,
	useQueryClient,
	type InfiniteData
} from '@tanstack/svelte-query';
import {
	createWorldSession,
	deleteSession,
	getSession,
	getSessionHandoff,
	getSessions,
	type PaginatedSessionsResponse
} from '$lib/api/sessions';
import type { CreateWorldSessionRequest } from '$lib/types/api';
import { showError, showSuccess } from '$lib/utils/toast';
import { queryKeys } from './keys';
import { type MaybeGetter, resolve } from './utils';

/**
 * Infinite query hook to fetch the current user's playthrough sessions.
 */
export function useSessions() {
	return createInfiniteQuery<
		PaginatedSessionsResponse,
		Error,
		InfiniteData<PaginatedSessionsResponse>,
		typeof queryKeys.sessions.all,
		string | null
	>(() => ({
		queryKey: queryKeys.sessions.all,
		queryFn: ({ pageParam }) => getSessions(pageParam),
		initialPageParam: null,
		getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
		staleTime: 5 * 60_000
	}));
}

/**
 * Query hook to fetch a specific playthrough session.
 */
export function useSession(
	sessionId: MaybeGetter<string>,
	options?: { enablePolling?: boolean; enabled?: MaybeGetter<boolean> }
) {
	return createQuery(() => {
		const id = resolve(sessionId);
		const enabled = options?.enabled === undefined ? true : resolve(options.enabled);
		return {
			queryKey: queryKeys.sessions.detail(id),
			queryFn: () => getSession(id),
			enabled: !!id && enabled,
			refetchInterval: (query: {
				state: { data?: import('$lib/types/api').WorldSession; error: Error | null };
			}) => {
				if (!options?.enablePolling) return false;
				if (query.state.error) return false;
				const world = query.state.data?.world;
				const genDone =
					world?.generation_status === 'completed' || world?.generation_status === 'failed';
				const imgDone =
					!world?.image_generation_status ||
					world.image_generation_status === 'completed' ||
					world.image_generation_status === 'failed';
				return genDone && imgDone ? false : 2_000;
			},
			refetchIntervalInBackground: false
		};
	});
}

/**
 * Disabled-by-default query hook for resolving inaccessible session links.
 */
export function useSessionHandoff(sessionId: MaybeGetter<string>, enabled: MaybeGetter<boolean>) {
	return createQuery(() => {
		const id = resolve(sessionId);
		return {
			queryKey: queryKeys.sessions.handoff(id),
			queryFn: () => getSessionHandoff(id),
			enabled: !!id && resolve(enabled),
			retry: false
		};
	});
}

/**
 * Mutation hook to create or retrieve a session for a root world.
 */
export function useCreateWorldSession(worldId: MaybeGetter<string>) {
	const client = useQueryClient();
	return createMutation(() => {
		const id = resolve(worldId);
		return {
			mutationFn: (data: CreateWorldSessionRequest = {}) => createWorldSession(id, data),
			onSuccess: (session) => {
				client.setQueryData(queryKeys.sessions.detail(session.id), session);
				client.invalidateQueries({ queryKey: queryKeys.sessions.all });
			},
			onError: (error: Error) => {
				showError('Failed to start story', error.message);
			}
		};
	});
}

/**
 * Mutation hook to remove a session from the user's library.
 */
export function useDeleteSession() {
	const client = useQueryClient();
	return createMutation(() => ({
		mutationFn: (sessionId: string) => deleteSession(sessionId),
		onSuccess: () => {
			client.invalidateQueries({ queryKey: queryKeys.sessions.all });
			client.invalidateQueries({ queryKey: queryKeys.user.all });
			showSuccess('Story removed');
		},
		onError: (error: Error) => {
			showError('Failed to remove story', error.message);
		}
	}));
}
