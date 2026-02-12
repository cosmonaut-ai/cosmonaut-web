<script lang="ts">
	import { goto } from '$app/navigation';
	import { untrack } from 'svelte';
	import { generateNodeText, retryNodeProcessing } from '$lib/api/client';
	import { useQueryClient } from '@tanstack/svelte-query';
	import {
		useNode,
		useChooseOption,
		updateNodeInCache,
		useUsage,
		usageKeys,
		type ChoiceOption
	} from '$lib/queries';
	import { showError } from '$lib/utils/toast';
	import { ApiError, type Choice, type StoryNode } from '$lib/types/api';
	import StoryCard from './StoryCard.svelte';
	import SlideTransition from './SlideTransition.svelte';
	import AudioNarration from './AudioNarration.svelte';
	import UpgradePrompt from '$lib/components/subscription/UpgradePrompt.svelte';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import { ChevronLeft, RotateCcw, AlertTriangle, Map, Rocket } from '@lucide/svelte';

	interface Props {
		worldId: string;
		rootNodeId: string | null;
		nodeId: string;
	}

	let { worldId, rootNodeId, nodeId }: Props = $props();

	// Local state for node (used during navigation and streaming)
	let currentNodeOverride = $state<StoryNode | null>(null);
	let loading = $state(false);

	// Navigation direction for slide animation
	let slideDirection = $state<'forward' | 'back'>('forward');

	// Streaming state
	let isStreaming = $state(false);
	let streamingText = $state('');
	let streamingDone = $state(false);
	let pendingNode = $state<StoryNode | null>(null);

	// Track which node we've already started generating to prevent duplicate calls
	let generatingNodeId = $state<string | null>(null);

	// Track which node we've already started retrying processing for to prevent duplicate calls
	let retryingProcessingNodeId = $state<string | null>(null);

	// Quota exceeded prompt state
	let showQuotaPrompt = $state(false);
	let showAudioQuotaPrompt = $state(false);

	// Use TanStack Query for node data (pass getters to ensure reactivity)
	// Enable polling when node is in 'generating' status
	const nodeQuery = useNode(
		() => worldId,
		() => nodeId,
		{ enablePolling: true }
	);

	// Get stable values - prefer override (most recent) over query data
	const effectiveNodeId = $derived(currentNodeOverride?.id ?? nodeQuery.data?.id);
	const effectiveNodeStatus = $derived(
		currentNodeOverride?.generation_status ?? nodeQuery.data?.generation_status
	);
	const effectiveProcessingStatus = $derived(
		currentNodeOverride?.processing_status ?? nodeQuery.data?.processing_status
	);

	// Check if node is being generated elsewhere (poll until complete)
	const isNodeGenerating = $derived(effectiveNodeStatus === 'generating' && !isStreaming);

	// Check if node generation failed
	const isNodeFailed = $derived(effectiveNodeStatus === 'failed');

	// The current node is either the override (during streaming/navigation) or from the query
	const currentNode = $derived(currentNodeOverride ?? nodeQuery.data ?? null);

	const queryClient = useQueryClient();

	// Use mutation for choosing options
	const chooseMutation = useChooseOption(() => worldId);

	// Proactive quota check
	const usageQuery = useUsage();
	const usage = $derived(usageQuery.data);
	const isAtNodeLimit = $derived(usage ? usage.nodes_used >= usage.nodes_limit : false);

	const isProcessingChoice = $derived(isStreaming || isNodeGenerating || chooseMutation.isPending);
	const isLoading = $derived(
		loading || nodeQuery.isLoading || isNodeGenerating || chooseMutation.isPending
	);

	// Store last visited node in localStorage
	$effect(() => {
		if (currentNode?.id && worldId) {
			try {
				const key = `cosmonaut-last-node-${worldId}`;
				localStorage.setItem(key, currentNode.id);
			} catch {
				// localStorage might not be available
			}
		}
	});

	// Handle streaming completion
	$effect(() => {
		if (streamingDone && pendingNode) {
			const nodeToProcess = pendingNode;
			untrack(() => {
				currentNodeOverride = nodeToProcess;

				if (nodeToProcess.id) {
					goto(`/worlds/${worldId}/nodes/${nodeToProcess.id}`, {
						replaceState: true,
						noScroll: true
					});
				}

				isStreaming = false;
				streamingText = '';
				streamingDone = false;
				pendingNode = null;
				// Clear generation guard on successful completion
				generatingNodeId = null;
			});
		}
	});

	// Handle nodes that need text generation when loaded
	// Uses effectiveNodeId/Status which prefers override over query data
	$effect(() => {
		const currentId = effectiveNodeId;
		const currentStatus = effectiveNodeStatus;

		// Skip if no node, already streaming, loading, or already generating this node
		if (!currentId || isStreaming || loading) return;
		if (generatingNodeId === currentId) return;

		// If node is being generated elsewhere, let polling handle it
		if (currentStatus === 'generating') return;

		// If node is already completed or failed, nothing to do
		if (currentStatus === 'completed' || currentStatus === 'failed') return;

		// If node needs text generation (initialized only - failed nodes show error page)
		if (currentStatus === 'initialized') {
			const nodeIdToGenerate = currentId;
			const currentWorldId = worldId;

			untrack(() => {
				generatingNodeId = nodeIdToGenerate;
				isStreaming = true;
				streamingText = '';
				streamingDone = false;
				loading = true;

				generateNodeText(currentWorldId, nodeIdToGenerate, (text, done) => {
					streamingText = text;
					if (done) streamingDone = true;
				})
					.then((completedNode) => {
						updateNodeInCache(queryClient, currentWorldId, completedNode);
						pendingNode = completedNode;
						isStreaming = false;
					})
					.catch((err) => {
						if (err instanceof ApiError && err.isQuotaExceeded) {
							// Show upgrade prompt instead of generic error toast
							showQuotaPrompt = true;
							queryClient.invalidateQueries({ queryKey: usageKeys.all });
							// Keep generatingNodeId set so the effect doesn't re-trigger
							// (the node stays 'initialized' on the server, and retrying
							// would just hit the quota limit again in an infinite loop)
						} else if (err instanceof ApiError && err.isNodeAlreadyProcessed) {
							// The node was already completed/generating on the server (e.g. after
							// a network error mid-stream). Refetch the node so the cache reflects
							// the real status and the generation effect stops re-triggering.
							// Keep generatingNodeId set to prevent a retry loop while refetching.
							nodeQuery.refetch();
						} else {
							showError(
								'Failed to generate text',
								err instanceof Error ? err.message : String(err)
							);
							// Clear generating guard so retry is possible for non-quota errors
							generatingNodeId = null;
						}
						isStreaming = false;
						streamingText = '';
						streamingDone = false;
					})
					.finally(() => {
						loading = false;
					});
			});
		}
	});

	// Automatically retry processing for nodes with failed processing_status
	// This is invisible to the user - background processing (fact extraction + Pinecone upsert)
	// is re-enqueued when visiting a node that previously failed
	$effect(() => {
		const currentId = effectiveNodeId;
		const processingStatus = effectiveProcessingStatus;

		// Only retry if node has failed processing status
		if (!currentId || processingStatus !== 'failed') return;
		// Skip if already retrying this node
		if (retryingProcessingNodeId === currentId) return;

		const nodeIdToRetry = currentId;
		const currentWorldId = worldId;

		untrack(() => {
			retryingProcessingNodeId = nodeIdToRetry;

			retryNodeProcessing(currentWorldId, nodeIdToRetry)
				.then((updatedNode) => {
					// Update cache with the node's new processing_status (pending)
					updateNodeInCache(queryClient, currentWorldId, updatedNode);
				})
				.catch((err) => {
					// Silently log error - this is invisible to the user
					// The retry can be attempted again on the next visit
					console.warn('Failed to retry node processing:', err);
					// Clear retry guard so it can be attempted again
					retryingProcessingNodeId = null;
				});
		});
	});

	// Clear override and generation guard when nodeId changes (e.g., back/forward navigation)
	$effect(() => {
		if (nodeId && currentNodeOverride?.id !== nodeId) {
			currentNodeOverride = null;
			// Clear generation guard for the new node
			if (generatingNodeId !== nodeId) {
				generatingNodeId = null;
			}
			// Clear processing retry guard for the new node
			if (retryingProcessingNodeId !== nodeId) {
				retryingProcessingNodeId = null;
			}
		}
	});

	async function handleChoiceSelect(choiceIndex: number) {
		if (!currentNode || loading || isProcessingChoice) return;
		const parentChoice = currentNode.choices[choiceIndex];
		await executeChoice({ choiceIndex }, parentChoice);
	}

	async function handleCustomChoice(text: string) {
		if (!currentNode || loading || isProcessingChoice) return;
		const parentChoice: Choice = { label: text, target: null, is_custom: true };
		await executeChoice({ customChoice: text }, parentChoice);
	}

	async function executeChoice(choice: ChoiceOption, parentChoice?: Choice) {
		if (!currentNode) return;

		try {
			loading = true;
			slideDirection = 'forward';

			// Step 1: Call /choose - returns either a new initialized node or an existing one
			const node = await chooseMutation.mutateAsync({
				nodeId: currentNode.id,
				choice,
				parentChoice
			});

			// Step 2: Navigate to the node and set override
			// The generation effect will handle text generation if needed
			currentNodeOverride = node;
			goto(`/worlds/${worldId}/nodes/${node.id}`, { replaceState: false, noScroll: true });
		} catch (err) {
			if (err instanceof ApiError && err.isNodeProcessingConflict) {
				// 409 Conflict — the node has a processing error (e.g. failed fact extraction).
				// Automatically retry background processing and prompt the user to try again.
				try {
					await retryNodeProcessing(worldId, currentNode.id);
					nodeQuery.refetch();
					showError(
						'Story node busy',
						'A background task was still running. It has been re-queued — please try your choice again in a moment.'
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
			loading = false;
		}
	}

	async function handleBack() {
		if (!currentNode?.parent_id || isProcessingChoice) return;
		slideDirection = 'back';
		currentNodeOverride = null;
		goto(`/worlds/${worldId}/nodes/${currentNode.parent_id}`, {
			replaceState: false,
			noScroll: true
		});
	}

	async function handleRestart() {
		if (!rootNodeId || isProcessingChoice) return;
		slideDirection = 'back';
		currentNodeOverride = null;
		goto(`/worlds/${worldId}/nodes/${rootNodeId}`, {
			replaceState: false,
			noScroll: true
		});
	}

	const isEnding = $derived(
		currentNode?.generation_status === 'completed' &&
			(!currentNode?.choices || currentNode.choices.length === 0)
	);
	const canGoBack = $derived(!!currentNode?.parent_id);
	const pathLength = $derived((currentNode?.ancestors?.length || 0) + 1);

	// ── Audio Narration ──
	const audio = $derived(currentNode?.audio ?? {});
	let audioPlayerVisible = $state(false);
</script>

<main class="mx-auto max-w-4xl px-6 py-8 {audioPlayerVisible ? 'pb-24' : ''}">
	<!-- Path indicator -->
	{#if currentNode}
		<div class="mb-6 flex items-center justify-between">
			<div class="flex items-center gap-2">
				{#if canGoBack}
					<Button
						variant="ghost"
						size="sm"
						onclick={handleBack}
						disabled={isLoading || isProcessingChoice}
						class="gap-1"
					>
						<ChevronLeft class="h-4 w-4" />
						Previous
					</Button>
				{/if}
			</div>

			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				{#if pathLength > 1}
					<Button
						variant="ghost"
						size="sm"
						onclick={handleRestart}
						disabled={isLoading || isProcessingChoice}
						class="gap-1"
					>
						<RotateCcw class="h-4 w-4" />
						Restart
					</Button>
				{/if}
				<Button
					variant="ghost"
					size="sm"
					onclick={() => goto(`/worlds/${worldId}/graph?node=${nodeId}`)}
					disabled={isProcessingChoice}
					class="gap-1"
				>
					<Map class="h-4 w-4" />
					Map
				</Button>
				<AudioNarration
					{worldId}
					nodeId={currentNode.id}
					{audio}
					isNodeCompleted={currentNode?.generation_status === 'completed'}
					onQuotaExceeded={() => (showAudioQuotaPrompt = true)}
					bind:playerVisible={audioPlayerVisible}
				/>
			</div>
		</div>
	{/if}

	<!-- Story Content with Slide Transition -->
	{#if isStreaming || isNodeGenerating || isNodeFailed || currentNode}
		<div class="-mx-6 sm:mx-0">
			<!-- Key on the current node ID (or a streaming key when streaming a new node) -->
			<!-- This ensures transition plays when switching between nodes OR entering streaming -->
			<SlideTransition key={currentNode?.id ?? 'streaming'} direction={slideDirection}>
				{#if isStreaming}
					<!-- Streaming state - show text as it arrives -->
					<StoryCard
						text={streamingText.trim()}
						choices={[]}
						isTyping={true}
						isLoading={true}
						showCustomChoice={false}
					/>
				{:else if isNodeGenerating}
					<!-- Node is being generated by another session - show loading state -->
					<StoryCard
						text=""
						choices={[]}
						isTyping={true}
						isLoading={true}
						showCustomChoice={false}
					/>
				{:else if isNodeFailed}
					<!-- Node generation failed - show error page -->
					<Card class="border-destructive bg-destructive/5">
						<CardContent class="flex flex-col items-center justify-center py-16">
							<AlertTriangle class="mb-4 h-12 w-12 text-destructive" />
							<h2 class="mb-2 text-xl font-semibold text-destructive">Generation Failed</h2>
							<p class="mb-6 max-w-md text-center text-muted-foreground">
								Something went wrong while generating this part of the story. You can go back and
								try a different choice.
							</p>
							<div class="flex gap-3">
								{#if canGoBack}
									<Button variant="outline" onclick={handleBack}>
										<ChevronLeft class="mr-2 h-4 w-4" />
										Go Back
									</Button>
								{/if}
								{#if pathLength > 1}
									<Button variant="outline" onclick={handleRestart}>
										<RotateCcw class="mr-2 h-4 w-4" />
										Restart Story
									</Button>
								{/if}
								<Button variant="outline" onclick={() => goto('/dashboard')}>
									Return to Dashboard
								</Button>
							</div>
						</CardContent>
					</Card>
				{:else if currentNode}
					<StoryCard
						text={currentNode.text?.trim() ?? ''}
						choices={currentNode.choices}
						parentChoice={currentNode.parent_choice}
						isTyping={false}
						{isEnding}
						{isLoading}
						isAtQuotaLimit={isAtNodeLimit}
						showCustomChoice={!isEnding}
						onChoiceSelect={handleChoiceSelect}
						onCustomChoice={handleCustomChoice}
						onRestart={handleRestart}
					/>
				{/if}
			</SlideTransition>
		</div>
	{:else if isLoading}
		<!-- Loading state -->
		<Card class="border-l-4 border-l-primary">
			<CardContent class="flex items-center justify-center py-16">
				<div class="flex items-center gap-3 text-muted-foreground">
					<Spinner class="h-4 w-4" />
					<span>Loading story...</span>
				</div>
			</CardContent>
		</Card>
	{:else}
		<!-- No node available -->
		<Card class="border-dashed">
			<CardContent class="flex flex-col items-center justify-center gap-4 py-16 text-center">
				<div class="rounded-full border border-dashed border-muted-foreground/40 bg-muted/20 p-3">
					<Rocket class="h-8 w-8 text-muted-foreground" />
				</div>
				<div class="space-y-2">
					<h2 class="text-lg font-semibold">Looks like you're a bit lost...</h2>
					<p class="text-sm text-muted-foreground">
						We couldn't figure out where you're trying to get to! Try viewing the map or starting at
						the beginning.
					</p>
				</div>
				<div class="flex flex-col gap-3 sm:flex-row">
					<Button
						variant="outline"
						onclick={() => goto(`/worlds/${worldId}/map`)}
						disabled={isProcessingChoice}
					>
						<Map class="mr-2 h-4 w-4" />
						View Map
					</Button>
					<Button
						variant="outline"
						onclick={handleRestart}
						disabled={!rootNodeId || isProcessingChoice}
					>
						<RotateCcw class="mr-2 h-4 w-4" />
						Start at Beginning
					</Button>
				</div>
			</CardContent>
		</Card>
	{/if}

	<UpgradePrompt
		open={showQuotaPrompt}
		onOpenChange={(v) => (showQuotaPrompt = v)}
		resource="nodes"
	/>

	<UpgradePrompt
		open={showAudioQuotaPrompt}
		onOpenChange={(v) => (showAudioQuotaPrompt = v)}
		resource="audio"
	/>
</main>
