import { untrack } from 'svelte';
import { generateNodeText, getNode, retryNodeProcessing } from '$lib/api/client';
import { useQueryClient } from '@tanstack/svelte-query';
import { updateNodeInCache, usageKeys } from '$lib/queries';
import { showError } from '$lib/utils/toast';
import { ApiError, type StoryNode } from '$lib/types/api';
import type { StoryNodeGenerationStatus, StoryNodeProcessingStatus } from '$lib/types/api';

export interface UseStreamingNodeOptions {
	worldId: () => string;
	nodeId: () => string;
	effectiveNodeId: () => string | undefined;
	effectiveNodeStatus: () => StoryNodeGenerationStatus | undefined;
	effectiveProcessingStatus: () => StoryNodeProcessingStatus | undefined;
	loading: () => boolean;
	setLoading: (value: boolean) => void;
	currentNodeOverride: () => StoryNode | null;
	setCurrentNodeOverride: (node: StoryNode | null) => void;
	nodeQuery: { refetch: () => void };
	onStreamingComplete: (node: StoryNode) => void;
}

/**
 * Encapsulates streaming state and logic for story node text generation.
 * Use in StoryNodeView to handle streaming text, completion, and quota prompts.
 */
export function useStreamingNode(options: UseStreamingNodeOptions) {
	const {
		worldId,
		nodeId,
		effectiveNodeId,
		effectiveNodeStatus,
		effectiveProcessingStatus,
		loading,
		setLoading,
		currentNodeOverride,
		setCurrentNodeOverride,
		nodeQuery,
		onStreamingComplete
	} = options;

	const queryClient = useQueryClient();

	// Streaming state
	let isStreaming = $state(false);
	let streamingText = $state('');
	let streamingDone = $state(false);
	let pendingNode = $state<StoryNode | null>(null);
	let generatingNodeId = $state<string | null>(null);
	let retryingProcessingNodeId = $state<string | null>(null);
	let showQuotaPrompt = $state(false);
	let showAudioQuotaPrompt = $state(false);

	/** Start text generation for a node. Updates streaming state via callback. */
	function startGeneration(
		worldIdVal: string,
		nodeIdVal: string,
		opts?: { setLoading?: boolean }
	): Promise<StoryNode | void> {
		generatingNodeId = nodeIdVal;
		isStreaming = true;
		streamingText = '';
		streamingDone = false;
		if (opts?.setLoading) setLoading(true);

		return generateNodeText(worldIdVal, nodeIdVal, (text, done) => {
			streamingText = text;
			if (done) streamingDone = true;
		})
			.then((completedNode) => {
				updateNodeInCache(queryClient, worldIdVal, completedNode);
				pendingNode = completedNode;
				isStreaming = false;
				return completedNode;
			})
			.catch(async (err) => {
				isStreaming = false;
				streamingText = '';
				streamingDone = false;

				if (err instanceof ApiError && err.isQuotaExceeded) {
					showQuotaPrompt = true;
					queryClient.invalidateQueries({ queryKey: usageKeys.all });
					throw err;
				}

				if (err instanceof ApiError && err.isNodeAlreadyProcessed) {
					nodeQuery.refetch();
					throw err;
				}

				// Stream may have been interrupted (network stutter) while the backend
				// continues generating. Check actual node status before showing an error.
				try {
					const freshNode = await getNode(worldIdVal, nodeIdVal);
					if (
						freshNode.generation_status === 'generating' ||
						(freshNode.generation_status === 'completed' && freshNode.text)
					) {
						// Backend is still processing or already finished.
						// Update cache and clear override so the query data drives the UI.
						// For 'generating', the existing useNode polling (every 2s) +
						// isNodeGenerating UI will handle the transition to 'completed'.
						updateNodeInCache(queryClient, worldIdVal, freshNode);
						setCurrentNodeOverride(null);
						if (freshNode.generation_status === 'completed') {
							onStreamingComplete(freshNode);
							generatingNodeId = null;
						}
						return;
					}
				} catch {
					// Couldn't reach the server — fall through to error display
				}

				showError('Failed to generate text', err instanceof Error ? err.message : String(err));
				generatingNodeId = null;
				throw err;
			})
			.finally(() => {
				if (opts?.setLoading) setLoading(false);
			});
	}

	// Handle streaming completion
	$effect(() => {
		if (streamingDone && pendingNode) {
			const nodeToProcess = pendingNode;
			untrack(() => {
				setCurrentNodeOverride(nodeToProcess);
				onStreamingComplete(nodeToProcess);
				isStreaming = false;
				streamingText = '';
				streamingDone = false;
				pendingNode = null;
				generatingNodeId = null;
			});
		}
	});

	// Handle nodes that need text generation when loaded
	$effect(() => {
		const currentId = effectiveNodeId();
		const currentStatus = effectiveNodeStatus();

		if (!currentId || isStreaming || loading()) return;
		if (generatingNodeId === currentId) return;
		if (currentStatus === 'generating') return;
		if (currentStatus === 'completed' || currentStatus === 'failed') return;

		if (currentStatus === 'initialized') {
			const nodeIdToGenerate = currentId;
			const currentWorldId = worldId();

			untrack(() => {
				startGeneration(currentWorldId, nodeIdToGenerate, { setLoading: true });
			});
		}
	});

	// Automatically retry processing for nodes with failed processing_status
	$effect(() => {
		const currentId = effectiveNodeId();
		const processingStatus = effectiveProcessingStatus();

		if (!currentId || processingStatus !== 'failed') return;
		if (retryingProcessingNodeId === currentId) return;

		const nodeIdToRetry = currentId;
		const currentWorldId = worldId();

		untrack(() => {
			retryingProcessingNodeId = nodeIdToRetry;

			retryNodeProcessing(currentWorldId, nodeIdToRetry)
				.then((updatedNode) => {
					updateNodeInCache(queryClient, currentWorldId, updatedNode);
				})
				.catch((err) => {
					console.warn('Failed to retry node processing:', err);
					retryingProcessingNodeId = null;
				});
		});
	});

	// Clear generation guards when nodeId changes
	$effect(() => {
		const currentNodeId = nodeId();
		const override = currentNodeOverride();

		if (currentNodeId && override?.id !== currentNodeId) {
			if (generatingNodeId !== currentNodeId) {
				generatingNodeId = null;
			}
			if (retryingProcessingNodeId !== currentNodeId) {
				retryingProcessingNodeId = null;
			}
		}
	});

	return {
		get isStreaming() {
			return isStreaming;
		},
		get streamingText() {
			return streamingText;
		},
		get streamingDone() {
			return streamingDone;
		},
		get pendingNode() {
			return pendingNode;
		},
		get generatingNodeId() {
			return generatingNodeId;
		},
		get retryingProcessingNodeId() {
			return retryingProcessingNodeId;
		},
		get showQuotaPrompt() {
			return showQuotaPrompt;
		},
		get showAudioQuotaPrompt() {
			return showAudioQuotaPrompt;
		},
		set showQuotaPrompt(value: boolean) {
			showQuotaPrompt = value;
		},
		set showAudioQuotaPrompt(value: boolean) {
			showAudioQuotaPrompt = value;
		},
		startGeneration,
		setGeneratingNodeId: (id: string | null) => {
			generatingNodeId = id;
		}
	};
}
