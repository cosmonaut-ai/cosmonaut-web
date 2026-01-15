<script lang="ts">
	import { goto, pushState } from '$app/navigation';
	import { navigating } from '$app/stores';
	import { page } from '$app/state';
	import { untrack } from 'svelte';
	import { chooseOption, generateNodeText, getWorld, getNode } from '$lib/api/client';
	import type { PageData } from './$types';
	import type { StoryNode, World, GenerationStatus } from '$lib/types/api';
	import WorldHeader from '$lib/components/story/WorldHeader.svelte';
	import StoryCard from '$lib/components/story/StoryCard.svelte';
	import SlideTransition from '$lib/components/story/SlideTransition.svelte';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { ChevronLeft, RotateCcw, Sparkles, Check, ArrowLeft } from '@lucide/svelte';

	let { data }: { data: PageData } = $props();

	let currentNode = $state<StoryNode | null>(null);
	let worldOverride = $state<World | null>(null);
	const world = $derived(worldOverride ?? data.world);
	let loading = $state(false);
	let error = $state<string | null>(null);

	// Navigation direction for slide animation
	let slideDirection = $state<'forward' | 'back'>('forward');

	// Streaming state
	let isStreaming = $state(false);
	let streamingText = $state('');
	let streamingDone = $state(false);
	let pendingNode = $state<StoryNode | null>(null);

	const isNavigating = $derived(!!$navigating);
	const isProcessingChoice = $derived(isStreaming);
	const isLoading = $derived(loading || isNavigating);

	// Generation status tracking
	const isWorldComplete = $derived(world.generation_status === 'completed');
	const isWorldFailed = $derived(world.generation_status === 'failed');
	const generationStatus = $derived<GenerationStatus>(world.generation_status);

	// Status steps for the progress display
	const generationStatuses: GenerationStatus[] = [
		'initialized',
		'generating_lore',
		'generating_narrator_profile',
		'completed'
	];

	function getStatusMessage(status: GenerationStatus): string {
		switch (status) {
			case 'initialized':
				return 'Initializing world...';
			case 'generating_lore':
				return 'Generating world lore and setting...';
			case 'generating_narrator_profile':
				return 'Creating narrative voice...';
			case 'completed':
				return 'World created successfully!';
			case 'failed':
				return 'World generation failed';
			default:
				return 'Processing...';
		}
	}

	function getStatusProgress(status: GenerationStatus): number {
		switch (status) {
			case 'initialized':
				return 10;
			case 'generating_lore':
				return 40;
			case 'generating_narrator_profile':
				return 70;
			case 'completed':
				return 100;
			case 'failed':
				return 100;
			default:
				return 0;
		}
	}

	function isGenerationStatusComplete(status: GenerationStatus): boolean {
		return (
			getStatusProgress(generationStatus) > getStatusProgress(status) ||
			generationStatus === 'completed'
		);
	}

	function isGenerationStatusActive(status: GenerationStatus): boolean {
		return status === generationStatus;
	}

	// Poll for world completion if not already complete
	$effect(() => {
		if (isWorldComplete || isWorldFailed) return;

		let cancelled = false;
		const pollInterval = 2000;

		async function pollStatus() {
			while (!cancelled) {
				try {
					const updatedWorld = await getWorld(world.id);
					if (cancelled) return;

					// Update world override which will automatically update generationStatus via $derived
					worldOverride = updatedWorld;

					if (updatedWorld.generation_status === 'completed') {
						// Reload the page data to get the root node
						if (updatedWorld.root_node_id) {
							// Small delay to let the UI show completion
							await new Promise((r) => setTimeout(r, 500));
							if (!cancelled) {
								goto(`/worlds/${updatedWorld.id}`, { invalidateAll: true });
							}
						}
						return;
					}

					if (updatedWorld.generation_status === 'failed') {
						error = 'World generation failed. Please try again.';
						return;
					}

					await new Promise((r) => setTimeout(r, pollInterval));
				} catch (err) {
					console.error('Error polling world status:', err);
					if (!cancelled) {
						await new Promise((r) => setTimeout(r, pollInterval));
					}
				}
			}
		}

		pollStatus();

		return () => {
			cancelled = true;
		};
	});

	// Sync state with data changes
	$effect(() => {
		const nodeFromState = page.state.currentNode;
		const dataNode = data.currentNode;

		untrack(() => {
			if (nodeFromState) {
				if (nodeFromState.id !== currentNode?.id) {
					currentNode = nodeFromState;
				}
				return;
			}

			if (currentNode && (currentNode.id === '' || isProcessingChoice || loading)) {
				return;
			}

			if (dataNode && dataNode.id !== currentNode?.id) {
				currentNode = dataNode;
			}
		});
	});

	// Store last visited node in localStorage
	$effect(() => {
		if (currentNode?.id && world?.id) {
			try {
				const key = `cosmonaut-last-node-${world.id}`;
				localStorage.setItem(key, currentNode.id);
			} catch {
				// localStorage might not be available
			}
		}
	});

	// Handle streaming completion
	$effect(() => {
		if (streamingDone && pendingNode) {
			// Capture the node reference before untrack to avoid null issues
			const nodeToProcess = pendingNode;
			untrack(() => {
				currentNode = nodeToProcess;

				if (nodeToProcess.id) {
					pushState(`?node=${nodeToProcess.id}`, { currentNode: nodeToProcess });
				}

				isStreaming = false;
				streamingText = '';
				streamingDone = false;
				pendingNode = null;
			});
		}
	});

	// Handle nodes that need text generation when loaded
	// This handles: page refresh on a generating node, navigating to an initialized node, or retrying failed nodes
	$effect(() => {
		if (!currentNode || isStreaming || loading) return;

		const nodeGenStatus = currentNode.generation_status;
		const nodeToGenerate = currentNode;

		// If node needs text generation, start it
		if (nodeGenStatus === 'initialized' || nodeGenStatus === 'failed') {
			untrack(() => {
				isStreaming = true;
				streamingText = '';
				streamingDone = false;
				loading = true;

				generateNodeText(world.id, nodeToGenerate.id, (text, done) => {
					streamingText = text;
					if (done) streamingDone = true;
				})
					.then((completedNode) => {
						pendingNode = completedNode;
						isStreaming = false;
					})
					.catch((err) => {
						error = err instanceof Error ? err.message : 'Failed to generate text';
						console.error('Error generating text:', err);
						isStreaming = false;
						streamingText = '';
						streamingDone = false;
					})
					.finally(() => {
						loading = false;
					});
			});
			return;
		}

		// If node is currently generating (by another client/tab), poll for updates
		if (nodeGenStatus === 'generating') {
			let cancelled = false;
			const pollInterval = 2000;

			async function pollNodeStatus() {
				while (!cancelled && currentNode?.id === nodeToGenerate.id) {
					try {
						const updatedNode = await getNode(world.id, nodeToGenerate.id);
						if (cancelled) return;

						if (updatedNode.generation_status === 'completed') {
							currentNode = updatedNode;
							return;
						}

						if (updatedNode.generation_status === 'failed') {
							error = 'Text generation failed. Retrying...';
							currentNode = updatedNode;
							return;
						}

						await new Promise((r) => setTimeout(r, pollInterval));
					} catch (err) {
						console.error('Error polling node status:', err);
						if (!cancelled) {
							await new Promise((r) => setTimeout(r, pollInterval));
						}
					}
				}
			}

			pollNodeStatus();

			return () => {
				cancelled = true;
			};
		}
	});

	async function handleChoiceSelect(choiceIndex: number) {
		if (!currentNode || loading || isProcessingChoice) return;
		await executeChoice({ choiceIndex });
	}

	async function handleCustomChoice(text: string) {
		if (!currentNode || loading || isProcessingChoice) return;
		await executeChoice({ customChoice: text });
	}

	async function executeChoice(choice: { choiceIndex: number } | { customChoice: string }) {
		if (!currentNode) return;

		try {
			loading = true;
			error = null;
			slideDirection = 'forward';

			// Step 1: ALWAYS call /choose first - it returns either a new initialized node or an existing one
			const node = await chooseOption(world.id, currentNode.id, choice);

			// Step 2: Navigate to the node
			currentNode = node;
			pushState(`?node=${node.id}`, { currentNode: node });

			// Step 3: Check if node needs text generation
			if (node.generation_status === 'completed' && node.text) {
				// Node already has generated text - nothing more to do
			} else if (node.generation_status === 'initialized' || node.generation_status === 'failed') {
				// Node needs text generation - stream it
				isStreaming = true;
				streamingText = '';
				streamingDone = false;
				pendingNode = null;

				const completedNode = await generateNodeText(world.id, node.id, (text, done) => {
					streamingText = text;
					if (done) streamingDone = true;
				});

				isStreaming = false;
				pendingNode = completedNode;
			}
			// If node.generation_status === 'generating', the effect will handle polling
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to make choice';
			console.error('Error making choice:', err);
			isStreaming = false;
			streamingText = '';
			streamingDone = false;
		} finally {
			loading = false;
		}
	}

	async function handleBack() {
		if (!currentNode?.parent_id || isProcessingChoice) return;
		slideDirection = 'back';
		goto(`?node=${currentNode.parent_id}`, { replaceState: false, noScroll: true });
	}

	async function handleRestart() {
		if (!world.root_node_id || isProcessingChoice) return;
		slideDirection = 'back';
		goto(`?node=${world.root_node_id}`, { replaceState: false, noScroll: true });
	}

	function handleWorldUpdate(updatedWorld: World) {
		worldOverride = updatedWorld;
	}

	const isEnding = $derived(!currentNode?.choices || currentNode.choices.length === 0);
	const canGoBack = $derived(!!currentNode?.parent_id);
	const pathLength = $derived((currentNode?.ancestors?.length || 0) + 1);
</script>

<svelte:head>
	<title>{world.title || 'Story'} - Cosmonaut</title>
	<meta name="description" content={world.description || 'Explore an interactive story world.'} />
</svelte:head>

<div class="min-h-screen bg-background">
	{#if !isWorldComplete && !isWorldFailed}
		<!-- World Generation Progress View -->
		<header class="border-b border-border bg-card/50">
			<div class="mx-auto flex max-w-3xl items-center gap-4 px-6 py-4">
				<Button variant="ghost" size="sm" onclick={() => goto('/dashboard')} class="gap-2">
					<ArrowLeft class="h-4 w-4" />
					Back
				</Button>
				<div class="h-4 w-px bg-border"></div>
				<div class="flex items-center gap-2">
					<Sparkles class="h-5 w-5 text-primary" />
					<span class="font-semibold text-foreground">Creating Your World</span>
				</div>
			</div>
		</header>

		<main class="mx-auto max-w-3xl px-6 py-12">
			<Card>
				<CardContent class="py-12">
					<div class="flex flex-col items-center">
						<!-- Animated icon -->
						<div
							class="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/30 bg-primary/10"
						>
							<Sparkles class="h-10 w-10 animate-pulse text-primary" />
						</div>

						<h2 class="mb-2 text-2xl font-bold text-foreground">Creating Your World</h2>
						<p class="mb-8 text-muted-foreground">{getStatusMessage(generationStatus)}</p>

						<!-- Progress Bar -->
						<div class="mb-8 w-full max-w-md">
							<div class="h-2 w-full overflow-hidden rounded-full bg-secondary">
								<div
									class="h-full rounded-full bg-primary transition-all duration-500"
									style="width: {getStatusProgress(generationStatus)}%"
								></div>
							</div>
						</div>

						<!-- Status Steps -->
						<div class="w-full max-w-md space-y-3">
							{#each generationStatuses as status (status)}
								{@const isActive = isGenerationStatusActive(status)}
								{@const isComplete = isGenerationStatusComplete(status)}
								<div
									class="flex items-center gap-4 rounded-lg px-4 py-3 transition-colors {isActive
										? 'bg-primary/10'
										: ''}"
								>
									<div
										class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors {isComplete
											? 'bg-primary text-primary-foreground'
											: isActive
												? 'border-2 border-primary bg-primary/20'
												: 'border border-border bg-secondary'}"
									>
										{#if isComplete}
											<Check class="h-4 w-4" />
										{:else if isActive}
											<div class="h-2 w-2 animate-pulse rounded-full bg-primary"></div>
										{:else}
											<div class="h-2 w-2 rounded-full bg-muted-foreground/50"></div>
										{/if}
									</div>
									<span
										class="text-sm {isActive
											? 'font-medium text-foreground'
											: isComplete
												? 'text-primary'
												: 'text-muted-foreground'}"
									>
										{getStatusMessage(status)}
									</span>
								</div>
							{/each}
						</div>
					</div>
				</CardContent>
			</Card>
		</main>
	{:else if isWorldFailed}
		<!-- World Generation Failed View -->
		<header class="border-b border-border bg-card/50">
			<div class="mx-auto flex max-w-3xl items-center gap-4 px-6 py-4">
				<Button variant="ghost" size="sm" onclick={() => goto('/dashboard')} class="gap-2">
					<ArrowLeft class="h-4 w-4" />
					Back
				</Button>
			</div>
		</header>

		<main class="mx-auto max-w-3xl px-6 py-12">
			<Card class="border-destructive/50">
				<CardContent class="py-12">
					<div class="flex flex-col items-center">
						<div
							class="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-destructive/30 bg-destructive/10"
						>
							<Sparkles class="h-10 w-10 text-destructive" />
						</div>

						<h2 class="mb-2 text-2xl font-bold text-foreground">World Generation Failed</h2>
						<p class="mb-8 text-muted-foreground">
							Something went wrong while creating your world. Please try again.
						</p>

						<Button onclick={() => goto('/worlds/new')} class="gap-2">
							<Sparkles class="h-4 w-4" />
							Try Again
						</Button>
					</div>
				</CardContent>
			</Card>
		</main>
	{:else}
		<!-- World Header -->
		<WorldHeader {world} currentNodeId={currentNode?.id} onWorldUpdate={handleWorldUpdate} />

		<main class="mx-auto max-w-4xl px-6 py-8">
			<!-- Error display -->
			{#if error}
				<Card class="mb-6 border-destructive/50 bg-destructive/10">
					<CardContent class="py-4">
						<p class="text-destructive">{error}</p>
					</CardContent>
				</Card>
			{/if}

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
						<span>Node {pathLength}</span>
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
					</div>
				</div>
			{/if}

		<!-- Story Content with Slide Transition -->
		{#if isStreaming}
			<div class="-mx-6 sm:mx-0">
				<!-- Streaming state - show text as it arrives -->
				<StoryCard
					text={streamingText.trim()}
					choices={[]}
					isTyping={true}
					isLoading={true}
					showCustomChoice={false}
				/>
			</div>
		{:else if currentNode}
			<div class="-mx-6 sm:mx-0">
				<SlideTransition key={currentNode.id} direction={slideDirection}>
					<StoryCard
						text={currentNode.text?.trim() ?? ''}
						choices={currentNode.choices}
						isTyping={false}
						{isEnding}
						{isLoading}
						showCustomChoice={!isEnding}
						onChoiceSelect={handleChoiceSelect}
						onCustomChoice={handleCustomChoice}
						onRestart={handleRestart}
					/>
				</SlideTransition>
			</div>
		{:else if isLoading}
			<!-- Loading state -->
			<Card class="border-l-4 border-l-primary">
				<CardContent class="flex items-center justify-center py-16">
					<div class="flex items-center gap-3 text-muted-foreground">
						<div class="h-2 w-2 animate-pulse rounded-full bg-primary"></div>
						<span>Loading story...</span>
					</div>
				</CardContent>
			</Card>
		{:else}
			<!-- No node available -->
			<Card class="border-dashed">
				<CardContent class="flex flex-col items-center justify-center py-16">
					<p class="mb-4 text-muted-foreground">No story node available.</p>
					<Button variant="outline" onclick={() => goto('/dashboard')}>Return to Dashboard</Button>
				</CardContent>
			</Card>
		{/if}
		</main>
	{/if}
</div>
