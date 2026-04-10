import { goto } from '$app/navigation';
import { retryNodeProcessing } from '$lib/api/nodes';
import { useChooseOption, type ChoiceOption } from '$lib/queries';
import { showError } from '$lib/utils/toast';
import { ApiError, type StoryNode } from '$lib/types/api';
import { trackEvent } from '$lib/utils/analytics';

interface UseChoiceExecutionOptions {
	worldId: () => string;
	currentNode: () => StoryNode | null;
	isProcessingChoice: () => boolean;
	loading: () => boolean;
	setLoading: (v: boolean) => void;
	setCurrentNodeOverride: (node: StoryNode | null) => void;
	setSlideDirection: (dir: 'forward' | 'back') => void;
	stream: {
		setGeneratingNodeId: (id: string | null) => void;
		startGeneration: (
			worldId: string,
			nodeId: string,
			opts: { setLoading: boolean }
		) => Promise<StoryNode | void>;
		abortStream: () => void;
		isStreaming: boolean;
	};
	nodeQueryRefetch: () => void;
}

export function useChoiceExecution(options: UseChoiceExecutionOptions) {
	const chooseMutation = useChooseOption(options.worldId);
	let executionController: AbortController | null = null;

	/** Cancel any in-flight choice execution (mutation + generation). */
	function cancel() {
		if (executionController) {
			executionController.abort();
			executionController = null;
		}
	}

	async function handleChoiceSelect(targetId: string) {
		const node = options.currentNode();
		if (!node || options.loading() || options.isProcessingChoice()) return;
		if (!node.parent_id) {
			trackEvent('story_started', { world_id: options.worldId() });
		}
		trackEvent('choice_made', { world_id: options.worldId(), choice_type: 'preset' });
		await executeChoice({ targetId });
	}

	async function handleCustomChoice(text: string) {
		const node = options.currentNode();
		if (!node || options.loading() || options.isProcessingChoice()) return;
		trackEvent('custom_choice_made', { world_id: options.worldId(), choice_type: 'custom' });
		await executeChoice({ customChoice: text });
	}

	async function executeChoice(choice: ChoiceOption) {
		const node = options.currentNode();
		if (!node) return;

		cancel();
		const controller = new AbortController();
		executionController = controller;

		try {
			options.setLoading(true);
			options.setSlideDirection('forward');

			const newNode = await chooseMutation.mutateAsync({
				nodeId: node.id,
				choice
			});

			if (controller.signal.aborted) return;

			options.setCurrentNodeOverride(newNode);
			goto(`/worlds/${options.worldId()}/nodes/${newNode.id}`, {
				replaceState: false,
				noScroll: true
			});

			if (newNode.generation_status === 'initialized') {
				options.stream.setGeneratingNodeId(newNode.id);
				await options.stream.startGeneration(options.worldId(), newNode.id, { setLoading: true });
				return;
			}
		} catch (err) {
			if (controller.signal.aborted) return;

			if (err instanceof ApiError && err.isNodeProcessingConflict) {
				try {
					await retryNodeProcessing(options.worldId(), node.id);
					options.nodeQueryRefetch();
					showError(
						'Story node busy',
						'A background task was still running. It has been re-queued - please try your choice again in a moment.'
					);
				} catch {
					showError(
						'Story node busy',
						'This node encountered a processing issue. Please wait a moment and try again.'
					);
				}
			} else {
				showError('Failed to make choice', err instanceof Error ? err.message : String(err));
			}
		} finally {
			if (!controller.signal.aborted) {
				options.setLoading(false);
			}
		}
	}

	return {
		get isPending() {
			return chooseMutation.isPending;
		},
		handleChoiceSelect,
		handleCustomChoice,
		cancel
	};
}
