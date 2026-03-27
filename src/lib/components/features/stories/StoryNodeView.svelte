<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { retryNodeProcessing } from '$lib/api/nodes';
	import { useNode, useChooseOption, useUser, useWorld, type ChoiceOption } from '$lib/queries';
	import { showError } from '$lib/utils/toast';
	import { ApiError, type StoryNode } from '$lib/types/api';
	import StoryCard from './StoryCard.svelte';
	import SlideTransition from './SlideTransition.svelte';
	import AudioNarration from '$lib/components/features/narrator/AudioNarration.svelte';
	import ShareModal from '$lib/components/features/worlds/ShareModal.svelte';
	import UpgradePrompt from '$lib/components/features/subscription/UpgradePrompt.svelte';
	import { useStreamingNode } from './useStreamingNode.svelte';
	import { useAuth } from '$lib/auth/auth.svelte';
	import { trackEvent } from '$lib/utils/analytics';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import { ChevronLeft, RotateCcw, TriangleAlert, Map, Rocket, Share2 } from '@lucide/svelte';

	interface Props {
		worldId: string;
		rootNodeId: string | null;
		nodeId: string;
	}

	let { worldId, rootNodeId, nodeId }: Props = $props();

	let currentNodeOverride = $state.raw<StoryNode | null>(null);
	let loading = $state(false);

	// Navigation direction for slide animation
	let slideDirection = $state<'forward' | 'back'>('forward');

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
	const stream = useStreamingNode({
		worldId: () => worldId,
		nodeId: () => nodeId,
		effectiveNodeId: () => effectiveNodeId,
		effectiveNodeStatus: () => effectiveNodeStatus,
		loading: () => loading,
		setLoading: (v) => {
			loading = v;
		},
		currentNodeOverride: () => currentNodeOverride,
		setCurrentNodeOverride: (node) => {
			currentNodeOverride = node;
		},
		nodeQuery,
		onStreamingComplete: (node) => {
			if (node.id) {
				goto(`/worlds/${worldId}/nodes/${node.id}`, {
					replaceState: true,
					noScroll: true
				});
			}
		}
	});

	// Check if node is being generated elsewhere (poll until complete)
	const isNodeGenerating = $derived(effectiveNodeStatus === 'generating' && !stream.isStreaming);

	// Check if node generation failed
	const isNodeFailed = $derived(effectiveNodeStatus === 'failed');

	// The current node is either the override (during streaming/navigation) or from the query
	const currentNode = $derived(currentNodeOverride ?? nodeQuery.data ?? null);

	// Use mutation for choosing options
	const chooseMutation = useChooseOption(() => worldId);

	// Proactive quota check
	const usageQuery = useUser();
	const usage = $derived(usageQuery.data);
	const isAtNodeLimit = $derived(usage ? usage.nodes_used >= usage.nodes_limit : false);

	const isProcessingChoice = $derived(
		stream.isStreaming || isNodeGenerating || chooseMutation.isPending
	);
	const isLoading = $derived(
		loading || nodeQuery.isLoading || isNodeGenerating || chooseMutation.isPending
	);

	// Clear override when nodeId changes (e.g., back/forward navigation)
	$effect(() => {
		if (nodeId && currentNodeOverride?.id !== nodeId) {
			currentNodeOverride = null;
		}
	});

	// Reset scroll position when navigating to a new node so the footer
	// (pushed off-screen by min-h-dvh) doesn't stay in view.
	$effect(() => {
		void nodeId;
		if (browser) {
			window.scrollTo({ top: 0 });
		}
	});

	async function handleChoiceSelect(targetId: string) {
		if (!currentNode || loading || isProcessingChoice) return;
		if (!currentNode.parent_id) {
			trackEvent('story_started', { world_id: worldId });
		}
		trackEvent('choice_made', { world_id: worldId, choice_type: 'preset' });
		await executeChoice({ targetId });
	}

	async function handleCustomChoice(text: string) {
		if (!currentNode || loading || isProcessingChoice) return;
		trackEvent('custom_choice_made', { world_id: worldId, choice_type: 'custom' });
		await executeChoice({ customChoice: text });
	}

	async function executeChoice(choice: ChoiceOption) {
		if (!currentNode) return;

		try {
			loading = true;
			slideDirection = 'forward';

			// Step 1: Call /choose - returns either a new initialized node or an existing one
			const node = await chooseMutation.mutateAsync({
				nodeId: currentNode.id,
				choice
			});

			// Step 2: Navigate to the node and set override
			currentNodeOverride = node;
			goto(`/worlds/${worldId}/nodes/${node.id}`, { replaceState: false, noScroll: true });

			// Step 3: If the node needs generation, start immediately instead of
			// waiting for the $effect cycle (saves ~50-150ms of re-render delay).
			if (node.generation_status === 'initialized') {
				stream.setGeneratingNodeId(node.id);
				await stream.startGeneration(worldId, node.id, { setLoading: true });
				return; // loading will be cleared by the finally above
			}
		} catch (err) {
			if (err instanceof ApiError && err.isNodeProcessingConflict) {
				// 409 Conflict - the node has a processing error (e.g. failed fact extraction).
				// Automatically retry background processing and prompt the user to try again.
				try {
					await retryNodeProcessing(worldId, currentNode.id);
					nodeQuery.refetch();
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
			loading = false;
		}
	}

	async function handleBack() {
		const parentId = currentNode?.parent_id;
		if (!parentId) return;
		stream.abortStream();
		slideDirection = 'back';
		currentNodeOverride = null;
		goto(`/worlds/${worldId}/nodes/${parentId}`, {
			replaceState: false,
			noScroll: true
		});
	}

	async function handleRestart() {
		if (!rootNodeId) return;
		trackEvent('story_restarted', { world_id: worldId });
		stream.abortStream();
		slideDirection = 'back';
		currentNodeOverride = null;
		goto(`/worlds/${worldId}/nodes/${rootNodeId}`, {
			replaceState: false,
			noScroll: true
		});
	}

	async function handleRetryGeneration() {
		if (!currentNode || stream.isStreaming) return;
		stream.setGeneratingNodeId(currentNode.id);
		await stream.startGeneration(worldId, currentNode.id, { setLoading: true });
	}

	const isEnding = $derived(
		currentNode?.generation_status === 'completed' &&
			(!currentNode?.choices || currentNode.choices.length === 0)
	);
	const canGoBack = $derived(!!currentNode?.parent_id);
	const pathLength = $derived((currentNode?.ancestors?.length || 0) + 1);

	$effect(() => {
		if (isEnding) {
			trackEvent('story_ended', { world_id: worldId, path_length: pathLength });
		}
	});

	// ── Audio Narration ──
	let audioPlayerVisible = $state(false);

	// ── World data for ShareModal ──
	const worldQuery = useWorld(() => worldId);
	const world = $derived(worldQuery.data);
	let shareModalOpen = $state(false);
	const auth = useAuth();
</script>

<main class="mx-auto max-w-4xl px-6 py-8 {audioPlayerVisible ? 'pb-24' : ''}">
	<!-- Toolbar -->
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-1">
			<Button variant="ghost" size="sm" onclick={handleBack} disabled={!canGoBack} class="gap-1">
				<ChevronLeft class="h-4 w-4" />
				Undo
			</Button>
		</div>

		<div class="flex items-center gap-1">
			<Button
				variant="ghost"
				size="sm"
				onclick={() => goto(`/worlds/${worldId}/graph?node=${nodeId}`)}
				class="gap-1"
			>
				<Map class="h-4 w-4" />
				Map
			</Button>
			<AudioNarration
				{worldId}
				nodeId={currentNode?.id ?? nodeId}
				audio={currentNode?.audio ?? {}}
				isNodeCompleted={currentNode?.generation_status === 'completed'}
				onQuotaExceeded={() => (stream.showAudioQuotaPrompt = true)}
				bind:playerVisible={audioPlayerVisible}
				nodeTextLength={currentNode?.text?.length ?? 0}
			/>
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={() => (shareModalOpen = true)}
				aria-label="Share"
			>
				<Share2 class="h-4 w-4" />
			</Button>
		</div>
	</div>

	<!-- Story Content with Slide Transition -->
	{#if stream.isStreaming || isNodeGenerating || isNodeFailed || currentNode}
		<div class="-mx-6 sm:mx-0">
			<!-- Key on the current node ID (or a streaming key when streaming a new node) -->
			<!-- This ensures transition plays when switching between nodes OR entering streaming -->
			<SlideTransition key={currentNode?.id ?? 'streaming'} direction={slideDirection}>
				{#if stream.isStreaming}
					<!-- Streaming state - show text as it arrives -->
					<StoryCard
						text={stream.streamingText.trim()}
						choices={[]}
						parentChoice={currentNode?.parent_choice}
						isTyping={true}
						isLoading={true}
						showCustomChoice={false}
					/>
				{:else if isNodeGenerating}
					<!-- Node is being generated by another session - show loading state -->
					<StoryCard
						text=""
						choices={[]}
						parentChoice={currentNode?.parent_choice}
						isTyping={true}
						isLoading={true}
						showCustomChoice={false}
					/>
				{:else if isNodeFailed}
					<!-- Node generation failed - show error page with retry -->
					<Card class="border-destructive bg-destructive/5">
						<CardContent class="flex flex-col items-center justify-center py-16">
							<TriangleAlert class="mb-4 h-12 w-12 text-destructive" />
							<h2 class="mb-2 text-xl font-semibold text-destructive">Generation Failed</h2>
							<p class="mb-6 max-w-md text-center text-muted-foreground">
								Something went wrong while generating this part of the story.
							</p>
							<div class="flex flex-wrap justify-center gap-3">
								<Button
									variant="default"
									onclick={handleRetryGeneration}
									disabled={stream.isStreaming}
									class="gap-2"
								>
									<RotateCcw class="h-4 w-4" />
									Retry
								</Button>
								{#if canGoBack}
									<Button variant="outline" onclick={handleBack}>
										<ChevronLeft class="mr-2 h-4 w-4" />
										Go Back
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
	{:else if nodeQuery.isError && nodeQuery.error instanceof ApiError && nodeQuery.error.isWrongSession}
		<!-- Node belongs to a different playthrough session -->
		<Card class="border-border/50">
			<CardContent class="flex flex-col items-center py-12 text-center">
				<div
					class="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10"
				>
					<Map class="h-6 w-6 text-primary" />
				</div>
				<h2 class="mb-2 text-lg font-semibold text-foreground">Different playthrough</h2>
				<p class="mb-6 max-w-md text-sm text-muted-foreground">
					This story path belongs to a different playthrough session. Navigate back to your own
					path, or explore the map to find your way.
				</p>
				<div class="flex gap-3">
					<Button variant="outline" onclick={() => goto(`/worlds/${worldId}/map`)}>
						<Map class="mr-2 h-4 w-4" />
						View Map
					</Button>
					{#if rootNodeId}
						<Button onclick={() => goto(`/worlds/${worldId}/nodes/${rootNodeId}`)}>
							Start from Beginning
						</Button>
					{/if}
				</div>
			</CardContent>
		</Card>
	{:else if nodeQuery.isError}
		<!-- Query error state -->
		<Card class="border-destructive bg-destructive/5">
			<CardContent class="flex flex-col items-center justify-center gap-4 py-16">
				<TriangleAlert class="h-12 w-12 text-destructive" />
				<p class="text-destructive">Failed to load story node. Please try again.</p>
				<Button variant="outline" onclick={() => nodeQuery.refetch()}>Retry</Button>
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
		open={stream.showQuotaPrompt}
		onOpenChange={(v) => (stream.showQuotaPrompt = v)}
		resource="nodes"
	/>

	<UpgradePrompt
		open={stream.showAudioQuotaPrompt}
		onOpenChange={(v) => (stream.showAudioQuotaPrompt = v)}
		resource="audio"
	/>

	{#if world}
		<ShareModal
			{world}
			open={shareModalOpen}
			onOpenChange={(open) => (shareModalOpen = open)}
			onWorldUpdate={() => worldQuery.refetch()}
			isOwner={world.author_id === auth.user?.sub}
		/>
	{/if}
</main>
