<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { useNode, useUser } from '$lib/queries';
	import { getWorldContext } from '$lib/contexts/world';
	import { getImmersiveStoryContext } from '$lib/contexts/immersiveStory.svelte';
	import { ApiError, type StoryNode } from '$lib/types/api';
	import StoryCard from './StoryCard.svelte';
	import SlideTransition from './SlideTransition.svelte';
	import AudioNarration from '$lib/components/features/narrator/AudioNarration.svelte';
	import ShareModal from '$lib/components/features/worlds/ShareModal.svelte';
	import UpgradePrompt from '$lib/components/features/subscription/UpgradePrompt.svelte';
	import { useStreamingNode } from './useStreamingNode.svelte';
	import { useChoiceExecution } from './useChoiceExecution.svelte';
	import { useAuth } from '$lib/auth/auth.svelte';
	import { trackEvent } from '$lib/utils/analytics';
	import {
		DEFAULT_BRANCH_STORY_WORDS,
		DEFAULT_ROOT_STORY_WORDS,
		estimateInteractiveStoryLoadingProgress,
		estimateNarrationGenerationProgress,
		estimateStoryGenerationProgress
	} from '$lib/utils/generationProgress';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import { ChevronLeft, Undo, RotateCcw, TriangleAlert, Map, Rocket, Share2 } from '@lucide/svelte';

	interface Props {
		worldId: string;
		rootNodeId: string | null;
		nodeId: string;
	}

	let { worldId, rootNodeId, nodeId }: Props = $props();

	let currentNodeOverride = $state.raw<StoryNode | null>(null);
	let loading = $state(false);
	const immersiveStory = getImmersiveStoryContext();
	const IMMERSIVE_QUERY_PARAM = 'immersive';

	// Navigation direction for slide animation
	let slideDirection = $state<'forward' | 'back'>('forward');

	// ── Audio Narration ──
	let audioPlayerVisible = $state(false);
	let narrationStatus = $state({
		nodeId: null as string | null,
		currentTime: 0,
		duration: 0,
		paused: true,
		ended: false,
		isGenerating: false,
		audioUrl: null as string | null,
		timestampsUrl: null as string | null,
		hasAudio: false,
		voiceId: null as string | null,
		captionsUnavailable: false,
		hasStartedPlayback: false,
		generationStartedAt: null as number | null
	});
	let seekNarration = $state<((time: number) => void) | null>(null);

	function routeForNode(targetNodeId: string): string {
		const searchParams = new SvelteURLSearchParams(
			browser ? window.location.search : page.url.search
		);
		if (immersiveStory.active) {
			searchParams.set(IMMERSIVE_QUERY_PARAM, '1');
		} else {
			searchParams.delete(IMMERSIVE_QUERY_PARAM);
		}

		const query = searchParams.toString();
		return `/worlds/${worldId}/nodes/${targetNodeId}${query ? `?${query}` : ''}`;
	}

	function routeForMap(): string {
		const searchParams = new SvelteURLSearchParams(
			browser ? window.location.search : page.url.search
		);
		searchParams.set('node', currentNode?.id ?? nodeId);

		if (immersiveStory.active) {
			searchParams.set(IMMERSIVE_QUERY_PARAM, '1');
		} else {
			searchParams.delete(IMMERSIVE_QUERY_PARAM);
		}

		const query = searchParams.toString();
		return `/worlds/${worldId}/graph${query ? `?${query}` : ''}`;
	}

	// Use TanStack Query for node data (pass getters to ensure reactivity)
	// Enable polling when node is in 'generating' status
	const nodeQuery = useNode(
		() => worldId,
		() => nodeId,
		{ enablePolling: true }
	);

	// ── World data for progress estimates and ShareModal ──
	const worldQuery = getWorldContext();
	const world = $derived(worldQuery.data);

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
				goto(routeForNode(node.id), {
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

	const activeNarrationNodeId = $derived(currentNode?.id ?? nodeId);
	const narrationMatchesCurrentNode = $derived(narrationStatus.nodeId === activeNarrationNodeId);
	const currentNarrationTime = $derived(
		narrationMatchesCurrentNode ? narrationStatus.currentTime : 0
	);
	const currentNarrationDuration = $derived(
		narrationMatchesCurrentNode ? narrationStatus.duration : 0
	);
	const currentNarrationEnded = $derived(
		narrationMatchesCurrentNode ? narrationStatus.ended : false
	);
	const currentNarrationTimestampsUrl = $derived(
		narrationMatchesCurrentNode ? narrationStatus.timestampsUrl : null
	);
	const currentNarrationGenerating = $derived(
		narrationMatchesCurrentNode ? narrationStatus.isGenerating : false
	);
	const wordSeekEnabled = $derived(
		narrationMatchesCurrentNode &&
			narrationStatus.hasAudio &&
			narrationStatus.hasStartedPlayback &&
			!narrationStatus.isGenerating &&
			!!seekNarration
	);
	let progressClock = $state(Date.now());
	const storyGenerationActive = $derived(stream.isStreaming || isNodeGenerating);
	const storyGenerationComplete = $derived(
		stream.streamingDone || currentNode?.generation_status === 'completed'
	);
	const storyTargetWords = $derived(
		world?.node_text_length ??
			(currentNode?.parent_id ? DEFAULT_BRANCH_STORY_WORDS : DEFAULT_ROOT_STORY_WORDS)
	);
	const storyGenerationProgress = $derived(
		estimateStoryGenerationProgress({
			text: stream.streamingText,
			isGenerating: storyGenerationActive,
			isComplete: storyGenerationComplete,
			targetWords: storyTargetWords
		})
	);
	const narrationGenerationProgress = $derived(
		estimateNarrationGenerationProgress({
			isGenerating: currentNarrationGenerating,
			generationStartedAt: narrationMatchesCurrentNode ? narrationStatus.generationStartedAt : null,
			now: progressClock
		})
	);
	const immersiveLoadingProgress = $derived(
		estimateInteractiveStoryLoadingProgress({
			storyProgress: storyGenerationProgress,
			isStoryGenerating: storyGenerationActive,
			isStoryComplete: storyGenerationComplete,
			narrationProgress: narrationGenerationProgress,
			isNarrationGenerating: currentNarrationGenerating,
			hasNarration: !!currentNarrationTimestampsUrl
		})
	);
	const immersiveLoaderVisible = $derived(
		immersiveStory.active &&
			(storyGenerationActive || currentNarrationGenerating || !currentNarrationTimestampsUrl)
	);

	$effect(() => {
		if (!browser || !immersiveLoaderVisible) return;

		progressClock = Date.now();
		const interval = setInterval(() => {
			progressClock = Date.now();
		}, 250);

		return () => clearInterval(interval);
	});

	const choices = useChoiceExecution({
		worldId: () => worldId,
		currentNode: () => currentNode,
		isProcessingChoice: () => isProcessingChoice,
		loading: () => loading,
		setLoading: (v) => {
			loading = v;
		},
		setCurrentNodeOverride: (node) => {
			currentNodeOverride = node;
		},
		setSlideDirection: (dir) => {
			slideDirection = dir;
		},
		stream,
		nodeQueryRefetch: () => nodeQuery.refetch(),
		routeForNode
	});

	// Proactive quota check
	const usageQuery = useUser();
	const usage = $derived(usageQuery.data);
	const isAtNodeLimit = $derived(usage ? usage.nodes_used >= usage.nodes_limit : false);

	const isProcessingChoice = $derived(stream.isStreaming || isNodeGenerating || choices.isPending);
	const isLoading = $derived(
		loading || nodeQuery.isLoading || isNodeGenerating || choices.isPending
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

	async function handleBack() {
		const parentId = currentNode?.parent_id;
		if (!parentId) return;
		choices.cancel();
		stream.abortStream();
		slideDirection = 'back';
		currentNodeOverride = null;
		loading = false;
		goto(routeForNode(parentId), {
			replaceState: false,
			noScroll: true
		});
	}

	async function handleRestart() {
		if (!rootNodeId) return;
		trackEvent('story_restarted', { world_id: worldId });
		choices.cancel();
		stream.abortStream();
		slideDirection = 'back';
		currentNodeOverride = null;
		loading = false;
		goto(routeForNode(rootNodeId), {
			replaceState: false,
			noScroll: true
		});
	}

	function handleOpenMap() {
		goto(routeForMap(), { noScroll: true });
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

	$effect(() => {
		if (isNodeFailed || nodeQuery.isError) {
			immersiveStory.active = false;
		}
	});

	$effect(() => {
		const routeLoading = !currentNode && isLoading;
		const storyGenerating = stream.isStreaming || isNodeGenerating;
		const interactionDisabled = storyGenerating || routeLoading;

		immersiveStory.publish({
			nodeId: currentNode?.id ?? nodeId,
			text: stream.isStreaming ? stream.streamingText.trim() : (currentNode?.text?.trim() ?? ''),
			choices: interactionDisabled ? [] : (currentNode?.choices ?? []),
			currentTime: routeLoading ? 0 : currentNarrationTime,
			duration: routeLoading ? 0 : currentNarrationDuration,
			ended: routeLoading ? false : currentNarrationEnded,
			timestampsUrl: interactionDisabled ? null : currentNarrationTimestampsUrl,
			isNarrationGenerating: routeLoading ? false : currentNarrationGenerating,
			isStoryGenerating: storyGenerating,
			worldImageUrl: world?.world_image_url,
			worldImageAlt: world?.world_image_alt_text,
			title: routeLoading ? null : currentNode?.title,
			loadingProgress: routeLoading ? 0 : immersiveLoadingProgress,
			isEnding: routeLoading ? false : isEnding,
			isLoading,
			isAtQuotaLimit: isAtNodeLimit,
			showCustomChoice: !routeLoading && !isEnding,
			wordSeekEnabled: routeLoading ? false : wordSeekEnabled,
			canGoBack: routeLoading ? false : canGoBack,
			onBack: routeLoading ? undefined : handleBack,
			onOpenMap: handleOpenMap,
			onChoiceSelect: routeLoading ? undefined : choices.handleChoiceSelect,
			onCustomChoice: routeLoading ? undefined : choices.handleCustomChoice,
			onRestart: routeLoading ? undefined : handleRestart,
			onWordSeek: routeLoading
				? undefined
				: (time) => {
						if (wordSeekEnabled) seekNarration?.(time);
					}
		});
	});

	let shareModalOpen = $state(false);
	const auth = useAuth();
</script>

<main
	class="mx-auto max-w-4xl px-6 py-8 {audioPlayerVisible || immersiveStory.active ? 'pb-24' : ''}"
>
	<!-- Toolbar -->
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-1">
			<Button variant="ghost" size="sm" onclick={handleBack} disabled={!canGoBack} class="gap-1">
				<Undo class="h-4 w-4" />
				Undo
			</Button>
		</div>

		<div class="flex items-center gap-1">
			<Button variant="ghost" size="sm" onclick={handleOpenMap} class="gap-1">
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
				bind:immersiveActive={immersiveStory.active}
				bind:narrationStatus
				bind:seekNarration
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
						onChoiceSelect={choices.handleChoiceSelect}
						onCustomChoice={choices.handleCustomChoice}
						onRestart={handleRestart}
					/>
				{/if}
			</SlideTransition>
		</div>
	{:else if isLoading}
		<!-- Loading state -->
		<Card>
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
