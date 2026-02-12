import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import { getNode, getWorldNodes, chooseOption, generateNodeAudio } from '$lib/api/client';
import type { Choice, StoryNode } from '$lib/types/api';
import { showError } from '$lib/utils/toast';
import { usageKeys } from './subscription';

/**
 * Query keys for nodes - use these for cache invalidation
 */
export const nodeKeys = {
	all: (worldId: string) => ['worlds', worldId, 'nodes'] as const,
	detail: (worldId: string, nodeId: string) => ['worlds', worldId, 'nodes', nodeId] as const
};

/** Helper type for values that can be passed directly or as a getter */
type MaybeGetter<T> = T | (() => T);

/** Resolve a value that might be a getter */
function resolve<T>(value: MaybeGetter<T>): T {
	return typeof value === 'function' ? (value as () => T)() : value;
}

/**
 * Query hook to fetch all nodes in a world
 */
export function useWorldNodes(worldId: MaybeGetter<string>) {
	return createQuery(() => {
		const id = resolve(worldId);
		return {
			queryKey: nodeKeys.all(id),
			queryFn: () => getWorldNodes(id),
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
			queryKey: nodeKeys.detail(wId, nId ?? ''),
			queryFn: () => getNode(wId, nId!),
			enabled: !!wId && !!nId,
			refetchInterval: (query: { state: { data?: StoryNode } }) => {
				if (!options?.enablePolling) return false;
				const status = query.state.data?.generation_status;
				// Poll while node is being generated elsewhere
				return status === 'generating' ? 2000 : false;
			}
		};
	});
}

/**
 * Type for choice option - either predefined or custom
 */
export type ChoiceOption = { choiceIndex: number } | { customChoice: string };

/**
 * Mutation hook to choose an option and navigate to the next node
 */
export function useChooseOption(worldId: MaybeGetter<string>) {
	const client = useQueryClient();
	return createMutation(() => {
		const wId = resolve(worldId);
		return {
			mutationFn: ({
				nodeId,
				choice,
				parentChoice
			}: {
				nodeId: string;
				choice: ChoiceOption;
				parentChoice?: Choice;
			}) => chooseOption(wId, nodeId, choice, parentChoice),
			onSuccess: (newNode: StoryNode, { nodeId: parentNodeId }) => {
				// Add the new node to the cache
				client.setQueryData(nodeKeys.detail(wId, newNode.id), newNode);
				// Invalidate the parent node so its choices reflect the newly explored path
				client.invalidateQueries({ queryKey: nodeKeys.detail(wId, parentNodeId) });
				// Invalidate the nodes list to include the new node
				// Use exact: true to prevent invalidating individual node queries (prefix matching)
				client.invalidateQueries({ queryKey: nodeKeys.all(wId), exact: true });
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
	client.setQueryData(nodeKeys.detail(worldId, node.id), node);
	// Invalidate the parent node so its choices reflect the explored path
	if (node.parent_id) {
		client.invalidateQueries({ queryKey: nodeKeys.detail(worldId, node.parent_id) });
	}
	// Use exact: true to prevent invalidating individual node detail queries (prefix matching)
	client.invalidateQueries({ queryKey: nodeKeys.all(worldId), exact: true });
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
			onSuccess: (
				data: { audio_url: string },
				{ nodeId, voiceId }: { nodeId: string; voiceId: string }
			) => {
				// Patch the cached node's audio dict with the new voice entry
				const cached = client.getQueryData<StoryNode>(nodeKeys.detail(wId, nodeId));
				if (cached) {
					client.setQueryData(nodeKeys.detail(wId, nodeId), {
						...cached,
						audio: { ...cached.audio, [voiceId]: data.audio_url }
					});
				}
				// Invalidate usage so the audio narrations counter updates
				client.invalidateQueries({ queryKey: usageKeys.all });
			},
			onError: (error: Error) => {
				// Caller handles 429 (quota exceeded) to show UpgradePrompt.
				// Only show a toast for unexpected errors.
				if (!('status' in error && (error as { status: number }).status === 429)) {
					showError('Audio generation failed', error.message);
				}
			}
		};
	});
}
