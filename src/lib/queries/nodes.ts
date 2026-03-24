import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import { getNode, getWorldNodes, getWorldProgress, chooseOption } from '$lib/api/nodes';
import { generateNodeAudio } from '$lib/api/voices';
import { POLL_INTERVAL_MS, ApiError } from '$lib/api/core';
import type { StoryNode } from '$lib/types/api';
import { showError } from '$lib/utils/toast';
import { queryKeys } from './keys';
import { type MaybeGetter, resolve } from './utils';

/**
 * Query hook to fetch all nodes in a world
 */
export function useWorldNodes(worldId: MaybeGetter<string>) {
	return createQuery(() => {
		const id = resolve(worldId);
		return {
			queryKey: queryKeys.nodes.all(id),
			queryFn: () => getWorldNodes(id),
			enabled: !!id
		};
	});
}

/**
 * Query hook to fetch the user's last-visited node in a world
 */
export function useWorldProgress(worldId: MaybeGetter<string>) {
	return createQuery(() => {
		const id = resolve(worldId);
		return {
			queryKey: queryKeys.nodes.progress(id),
			queryFn: () => getWorldProgress(id),
			enabled: !!id
		};
	});
}

/**
 * Query hook to fetch a specific node by ID
 * Pass getter functions to ensure reactivity with $derived values
 * @param options.enablePolling - If true, polls every 2 seconds while node is in 'generating' status
 */
export function useNode(
	worldId: MaybeGetter<string>,
	nodeId: MaybeGetter<string | null | undefined>,
	options?: { enablePolling?: boolean }
) {
	return createQuery(() => {
		const wId = resolve(worldId);
		const nId = resolve(nodeId);
		return {
			queryKey: queryKeys.nodes.detail(wId, nId ?? ''),
			queryFn: () => getNode(wId, nId!),
			enabled: !!wId && !!nId,
			refetchInterval: (query: { state: { data?: StoryNode; error: Error | null } }) => {
				if (!options?.enablePolling) return false;
				if (query.state.error) return false;
				const status = query.state.data?.generation_status;
				return status === 'generating' ? POLL_INTERVAL_MS : false;
			},
			refetchIntervalInBackground: false
		};
	});
}

/**
 * Type for choice option - either predefined or custom
 */
export type ChoiceOption = { targetId: string } | { customChoice: string };

/**
 * Mutation hook to choose an option and navigate to the next node
 */
export function useChooseOption(worldId: MaybeGetter<string>) {
	const client = useQueryClient();
	return createMutation(() => {
		const wId = resolve(worldId);
		return {
			mutationFn: ({ nodeId, choice }: { nodeId: string; choice: ChoiceOption }) =>
				chooseOption(wId, nodeId, choice),
			onSuccess: (newNode: StoryNode, { nodeId: parentNodeId }) => {
				// Add the new node to the cache
				client.setQueryData(queryKeys.nodes.detail(wId, newNode.id), newNode);
				// Invalidate the parent node so its choices reflect the newly explored path
				client.invalidateQueries({ queryKey: queryKeys.nodes.detail(wId, parentNodeId) });
				// Invalidate the nodes list to include the new node
				// Use exact: true to prevent invalidating individual node queries (prefix matching)
				client.invalidateQueries({ queryKey: queryKeys.nodes.all(wId), exact: true });
			}
			// Note: no onError here — the caller uses mutateAsync and handles all
			// errors directly (409 retry logic + user-facing toasts) to avoid duplicates.
		};
	});
}

/**
 * Helper to update a node in the cache (used after streaming completes)
 */
export function updateNodeInCache(
	client: ReturnType<typeof useQueryClient>,
	worldId: string,
	node: StoryNode
) {
	client.setQueryData(queryKeys.nodes.detail(worldId, node.id), node);

	// Optimistically update the node within the all-nodes list cache so the
	// graph page (and any other consumer) sees fresh data immediately without
	// waiting for a background refetch.
	client.setQueryData<StoryNode[]>(queryKeys.nodes.all(worldId), (prev) => {
		if (!prev) return prev;
		const idx = prev.findIndex((n) => n.id === node.id);
		if (idx >= 0) {
			const updated = [...prev];
			updated[idx] = node;
			return updated;
		}
		return [...prev, node];
	});

	if (node.parent_id) {
		client.invalidateQueries({ queryKey: queryKeys.nodes.detail(worldId, node.parent_id) });
	}
	// Still invalidate to ensure eventual consistency with the server
	client.invalidateQueries({ queryKey: queryKeys.nodes.all(worldId), exact: true });
}

/**
 * Mutation hook to generate audio narration for a story node with a specific voice.
 * On success, patches the node's `audio` dict in the TanStack cache and
 * invalidates the usage query so the audio narrations counter stays current.
 */
export function useGenerateAudio(worldId: MaybeGetter<string>) {
	const client = useQueryClient();
	return createMutation(() => {
		const wId = resolve(worldId);
		return {
			mutationFn: ({ nodeId, voiceId }: { nodeId: string; voiceId: string }) =>
				generateNodeAudio(wId, nodeId, voiceId),
			onSuccess: (data: { audio_url: string }, variables: { nodeId: string; voiceId: string }) => {
				const cached = client.getQueryData<StoryNode>(
					queryKeys.nodes.detail(wId, variables.nodeId)
				);
				if (cached) {
					client.setQueryData(queryKeys.nodes.detail(wId, variables.nodeId), {
						...cached,
						audio: { ...cached.audio, [variables.voiceId]: data.audio_url }
					});
				}
				client.invalidateQueries({ queryKey: queryKeys.user.all });
			},
			onError: (error: Error) => {
				if (!(error instanceof ApiError && error.isQuotaExceeded)) {
					showError('Audio generation failed', error.message);
				}
			}
		};
	});
}
