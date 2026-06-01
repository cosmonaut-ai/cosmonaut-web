<script lang="ts">
	import type { Snippet } from 'svelte';
	import { goto, replaceState } from '$app/navigation';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { useSession, useSessionHandoff } from '$lib/queries';
	import { setSessionContext } from '$lib/contexts/session';
	import {
		setImmersiveStoryContext,
		type ImmersiveStoryModel
	} from '$lib/contexts/immersiveStory.svelte';
	import { setSessionMediaContext } from '$lib/contexts/sessionMedia.svelte';
	import { ApiError } from '$lib/types/api';
	import ImmersiveStoryView from '$lib/components/features/narrator/ImmersiveStoryView.svelte';
	import SessionMediaPlayer from '$lib/components/features/media/SessionMediaPlayer.svelte';
	import WorldHeader from '$lib/components/features/worlds/WorldHeader.svelte';
	import WorldGenerationProgress from '$lib/components/features/worlds/WorldGenerationProgress.svelte';
	import WorldGenerationFailed from '$lib/components/features/worlds/WorldGenerationFailed.svelte';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { ShieldAlert } from '@lucide/svelte';
	import SEO from '$lib/components/shared/SEO.svelte';
	import ResourceLoadingSkeleton from '$lib/components/shared/ResourceLoadingSkeleton.svelte';
	import NetworkErrorCard from '$lib/components/shared/NetworkErrorCard.svelte';
	import NotFoundCard from '$lib/components/shared/NotFoundCard.svelte';

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	const IMMERSIVE_QUERY_PARAM = 'immersive';
	const immersiveStory = setImmersiveStoryContext();
	setSessionMediaContext();

	function immersiveParamEnabled(value: string | null): boolean {
		return value === '1' || value === 'true';
	}

	const sessionId = $derived(page.params.sessionId!);
	const nodeId = $derived(page.params.nodeId);

	const isGraphPage = $derived(page.url.pathname.includes('/graph'));
	const isMapPage = $derived(page.url.pathname.includes('/map'));
	const isNodePage = $derived(page.url.pathname.includes('/nodes/'));
	const isMainSessionPage = $derived(
		page.url.pathname === `/sessions/${sessionId}` ||
			page.url.pathname === `/sessions/${sessionId}/`
	);

	const sessionQuery = useSession(() => sessionId, {
		enablePolling: true
	});
	setSessionContext(sessionQuery);

	const session = $derived(sessionQuery.data);
	const world = $derived(session?.world);
	const isSessionLoading = $derived(sessionQuery.isLoading);
	const isWorldComplete = $derived(world?.generation_status === 'completed');
	const isWorldFailed = $derived(world?.generation_status === 'failed');
	const generationStatus = $derived(world?.generation_status ?? 'initialized');
	const isAccessDenied = $derived(
		sessionQuery.error instanceof ApiError && sessionQuery.error.isForbidden
	);
	const isNotFound = $derived(
		sessionQuery.error instanceof ApiError && sessionQuery.error.isNotFound
	);
	const isNetworkOrServerError = $derived(!!sessionQuery.error && !isAccessDenied && !isNotFound);

	const handoffQuery = useSessionHandoff(
		() => sessionId,
		() => isAccessDenied
	);

	$effect(() => {
		if (handoffQuery.data?.root_world_id) {
			goto(`/worlds/${handoffQuery.data.root_world_id}`, { replaceState: true });
		}
	});

	$effect(() => {
		if (immersiveParamEnabled(page.url.searchParams.get(IMMERSIVE_QUERY_PARAM))) {
			immersiveStory.active = true;
		}
	});

	$effect(() => {
		if (!browser || !(isNodePage || isGraphPage || isMapPage)) return;

		const url = new URL(window.location.href);
		if (immersiveStory.active) {
			url.searchParams.set(IMMERSIVE_QUERY_PARAM, '1');
		} else {
			url.searchParams.delete(IMMERSIVE_QUERY_PARAM);
		}

		const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
		const nextUrl = `${url.pathname}${url.search}${url.hash}`;
		if (currentUrl !== nextUrl) {
			replaceState(nextUrl, page.state);
		}
	});

	const immersiveRenderModel = $derived.by<ImmersiveStoryModel | null>(() => {
		if (!immersiveStory.active || !isNodePage) return null;

		const model = immersiveStory.model;
		if (!model) {
			return {
				nodeId: nodeId ?? '',
				text: '',
				choices: [],
				currentTime: 0,
				duration: 0,
				ended: false,
				timestampsUrl: null,
				isNarrationGenerating: false,
				isStoryGenerating: false,
				worldImageUrl: world?.world_image_url,
				worldImageAlt: world?.world_image_alt_text,
				title: null,
				loadingProgress: 0,
				isEnding: false,
				isLoading: true,
				isAtQuotaLimit: false,
				showCustomChoice: false,
				wordSeekEnabled: false,
				canGoBack: false
			};
		}

		if (nodeId && model.nodeId !== nodeId) {
			return {
				...model,
				nodeId,
				text: '',
				choices: [],
				currentTime: 0,
				duration: 0,
				ended: false,
				timestampsUrl: null,
				isNarrationGenerating: false,
				isStoryGenerating: false,
				title: null,
				loadingProgress: 0,
				isLoading: true,
				showCustomChoice: false,
				wordSeekEnabled: false,
				canGoBack: false,
				onBack: undefined,
				onChoiceSelect: undefined,
				onCustomChoice: undefined,
				onRestart: undefined,
				onWordSeek: undefined
			};
		}

		return model;
	});
</script>

<SEO
	title="{world?.title || 'Session'} - Cosmonaut"
	description={world?.description || 'Explore an interactive story world.'}
	path="/sessions/{sessionId}"
	ogImage={world?.world_image_url || undefined}
	ogImageWidth={world?.world_image_width ? Number(world.world_image_width) : undefined}
	ogImageHeight={world?.world_image_height ? Number(world.world_image_height) : undefined}
	ogImageAlt={world?.world_image_alt_text || world?.title || 'Story world image'}
	noindex
/>

{#if isSessionLoading || (isAccessDenied && handoffQuery.isLoading)}
	<ResourceLoadingSkeleton />
{:else if isAccessDenied}
	<div class="min-h-full bg-background">
		<main class="mx-auto max-w-3xl px-6 py-12">
			<Card class="border-border/50">
				<CardContent class="flex flex-col items-center py-12 text-center">
					<div
						class="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-primary/20 bg-primary/10"
					>
						<ShieldAlert class="h-6 w-6 text-primary" />
					</div>
					<h2 class="mb-2 text-lg font-semibold text-foreground">Private playthrough</h2>
					<p class="mb-6 max-w-md text-sm text-muted-foreground">
						This link points to another person's saved playthrough. Ask them for the story link if
						you'd like to start your own session.
					</p>
					<Button onclick={() => goto('/dashboard')}>Return to Dashboard</Button>
				</CardContent>
			</Card>
		</main>
	</div>
{:else if isNetworkOrServerError}
	<NetworkErrorCard
		message="We couldn't load this playthrough. This might be a temporary issue."
		onRetry={() => sessionQuery.refetch()}
	/>
{:else if !session || !world}
	<NotFoundCard message="This playthrough doesn't exist - or it's been deleted." />
{:else if !isWorldComplete && !isWorldFailed}
	<div class="min-h-full bg-background">
		<WorldGenerationProgress {generationStatus} />
	</div>
{:else if isWorldFailed}
	<div class="min-h-full bg-background">
		<WorldGenerationFailed worldPrompt={world?.world_prompt} />
	</div>
{:else if isGraphPage || isMapPage}
	<div class="absolute inset-0 flex flex-col bg-background">
		<WorldHeader {world} {sessionId} />
		<div class="min-h-0 flex-1">
			{@render children()}
		</div>
	</div>
{:else if isMainSessionPage}
	<div class="min-h-full bg-background">
		{@render children()}
	</div>
{:else}
	<div class="min-h-dvh bg-background">
		<WorldHeader {world} {sessionId} />
		{@render children()}
	</div>
{/if}

{#if immersiveRenderModel}
	<ImmersiveStoryView
		nodeId={immersiveRenderModel.nodeId}
		text={immersiveRenderModel.text}
		choices={immersiveRenderModel.choices}
		currentTime={immersiveRenderModel.currentTime}
		duration={immersiveRenderModel.duration}
		ended={immersiveRenderModel.ended}
		timestampsUrl={immersiveRenderModel.timestampsUrl}
		isNarrationGenerating={immersiveRenderModel.isNarrationGenerating}
		isStoryGenerating={immersiveRenderModel.isStoryGenerating}
		worldImageUrl={immersiveRenderModel.worldImageUrl}
		worldImageAlt={immersiveRenderModel.worldImageAlt}
		title={immersiveRenderModel.title}
		loadingProgress={immersiveRenderModel.loadingProgress}
		isEnding={immersiveRenderModel.isEnding}
		isLoading={immersiveRenderModel.isLoading}
		isAtQuotaLimit={immersiveRenderModel.isAtQuotaLimit}
		showCustomChoice={immersiveRenderModel.showCustomChoice}
		wordSeekEnabled={immersiveRenderModel.wordSeekEnabled}
		canGoBack={immersiveRenderModel.canGoBack}
		onBack={immersiveRenderModel.onBack}
		onOpenMap={immersiveRenderModel.onOpenMap}
		onChoiceSelect={immersiveRenderModel.onChoiceSelect}
		onCustomChoice={immersiveRenderModel.onCustomChoice}
		onRestart={immersiveRenderModel.onRestart}
		onWordSeek={immersiveRenderModel.onWordSeek}
		onExit={() => immersiveStory.setActive(false)}
	/>
{/if}

{#if isWorldComplete && session}
	<SessionMediaPlayer />
{/if}
