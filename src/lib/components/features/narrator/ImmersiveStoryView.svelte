<script lang="ts">
	import { browser } from '$app/environment';
	import type { Choice } from '$lib/types/api';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import OrbitProgressLoader from '$lib/components/shared/OrbitProgressLoader.svelte';
	import {
		buildCaptionParagraphs,
		findActiveCaptionWordIndex,
		getCaptionWords,
		type CaptionParagraph
	} from '$lib/utils/audioCaptions';
	import { prefersReducedMotion } from '$lib/utils/media';
	import { Undo, Map, Minimize2, RotateCcw } from '@lucide/svelte';
	import { fade } from 'svelte/transition';
	import ChoiceList from '../stories/ChoiceList.svelte';

	const IMMERSIVE_SCROLL_LOCK_CLASS = 'immersive-scroll-lock';
	const CAPTION_HIGHLIGHT_LEAD_SECONDS = 0.1;

	interface Props {
		nodeId: string;
		text: string;
		choices?: Choice[];
		currentTime: number;
		duration: number;
		ended: boolean;
		timestampsUrl: string | null;
		isNarrationGenerating?: boolean;
		isStoryGenerating?: boolean;
		worldImageUrl?: string | null;
		worldImageAlt?: string | null;
		title?: string | null;
		loadingProgress?: number;
		isEnding?: boolean;
		isLoading?: boolean;
		isAtQuotaLimit?: boolean;
		showCustomChoice?: boolean;
		wordSeekEnabled?: boolean;
		canGoBack?: boolean;
		onBack?: () => void;
		onOpenMap?: () => void;
		onChoiceSelect?: (targetId: string) => void;
		onCustomChoice?: (text: string) => void;
		onRestart?: () => void;
		onWordSeek?: (time: number) => void;
		onExit: () => void;
	}

	let {
		nodeId,
		text,
		choices = [],
		currentTime,
		duration,
		ended,
		timestampsUrl,
		isNarrationGenerating = false,
		isStoryGenerating = false,
		worldImageUrl = null,
		worldImageAlt = null,
		title = null,
		loadingProgress = 0,
		isEnding = false,
		isLoading = false,
		isAtQuotaLimit = false,
		showCustomChoice = true,
		wordSeekEnabled = false,
		canGoBack = false,
		onBack,
		onOpenMap,
		onChoiceSelect,
		onCustomChoice,
		onRestart,
		onWordSeek,
		onExit
	}: Props = $props();

	let captionScroller = $state<HTMLDivElement | null>(null);
	let captionParagraphs = $state<CaptionParagraph[]>([]);
	let captionError = $state<string | null>(null);
	let isLoadingCaptions = $state(false);
	let choicesRevealed = $state(false);
	let lastNodeId = $state<string | null>(null);
	let lastScrolledLineTop = $state<number | null>(null);
	let captionSourceKey: string | null = null;
	let captionRequestId = 0;
	let captionAbortController: AbortController | null = null;
	let scrollAnimationFrame: number | null = null;

	const captionWords = $derived(getCaptionWords(captionParagraphs));
	const captionDisplayTime = $derived(Math.max(0, currentTime + CAPTION_HIGHLIGHT_LEAD_SECONDS));
	const activeWordIndex = $derived(findActiveCaptionWordIndex(captionWords, captionDisplayTime));
	const audioEndTime = $derived(
		Number.isFinite(duration) && duration > 0
			? duration
			: (captionWords[captionWords.length - 1]?.end ?? 0)
	);
	const storyAudioAtEnd = $derived(
		ended || (audioEndTime > 0 && currentTime >= audioEndTime - 0.2)
	);
	const showChoices = $derived(choicesRevealed && !isStoryGenerating && !isNarrationGenerating);
	const showCaptionLoading = $derived(isLoadingCaptions && captionParagraphs.length === 0);
	const statusText = $derived(
		isStoryGenerating
			? 'Generating story...'
			: isNarrationGenerating
				? 'Generating narration...'
				: isLoading
					? 'Loading story...'
					: !timestampsUrl
						? 'Preparing narration...'
						: 'Loading story...'
	);
	const canSeekWords = $derived(wordSeekEnabled && !!onWordSeek);

	function cancelCaptionScrollAnimation() {
		if (scrollAnimationFrame === null) return;

		cancelAnimationFrame(scrollAnimationFrame);
		scrollAnimationFrame = null;
	}

	function easeOutCubic(progress: number) {
		return 1 - Math.pow(1 - progress, 3);
	}

	function scrollCaptionContainer(container: HTMLDivElement, top: number) {
		cancelCaptionScrollAnimation();

		const startTop = container.scrollTop;
		const distance = top - startTop;

		if (Math.abs(distance) < 1 || prefersReducedMotion) {
			container.scrollTop = top;
			return;
		}

		const duration = Math.min(700, Math.max(420, Math.abs(distance) * 1.35));
		const start = performance.now();

		const step = (now: number) => {
			const progress = Math.min((now - start) / duration, 1);
			container.scrollTop = startTop + distance * easeOutCubic(progress);

			if (progress < 1) {
				scrollAnimationFrame = requestAnimationFrame(step);
			} else {
				scrollAnimationFrame = null;
			}
		};

		scrollAnimationFrame = requestAnimationFrame(step);
	}

	$effect(() => {
		return () => {
			captionAbortController?.abort();
			cancelCaptionScrollAnimation();
		};
	});

	$effect(() => {
		if (!browser) return;

		document.documentElement.classList.add(IMMERSIVE_SCROLL_LOCK_CLASS);
		document.body.classList.add(IMMERSIVE_SCROLL_LOCK_CLASS);

		return () => {
			document.documentElement.classList.remove(IMMERSIVE_SCROLL_LOCK_CLASS);
			document.body.classList.remove(IMMERSIVE_SCROLL_LOCK_CLASS);
		};
	});

	$effect(() => {
		if (nodeId !== lastNodeId) {
			lastNodeId = nodeId;
			choicesRevealed = false;
			captionSourceKey = null;
			captionAbortController?.abort();
			captionAbortController = null;
			captionParagraphs = [];
			captionError = null;
			isLoadingCaptions = false;
			lastScrolledLineTop = null;
			cancelCaptionScrollAnimation();
		}
	});

	$effect(() => {
		if (storyAudioAtEnd) {
			choicesRevealed = true;
		} else if (choicesRevealed) {
			choicesRevealed = false;
		}
	});

	$effect(() => {
		const container = captionScroller;
		const index = activeWordIndex;

		if (!container || index < 0) return;

		const activeWord = container.querySelector<HTMLElement>(`[data-caption-word-index="${index}"]`);
		if (!activeWord) return;

		const lineTop = activeWord.offsetTop;
		if (lastScrolledLineTop !== null && Math.abs(lineTop - lastScrolledLineTop) < 2) {
			return;
		}

		lastScrolledLineTop = lineTop;
		const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
		const targetTop = Math.min(Math.max(0, lineTop - container.clientHeight * 0.46), maxScrollTop);
		scrollCaptionContainer(container, targetTop);
	});

	$effect(() => {
		const url = timestampsUrl;
		const storyText = text.trim();
		const sourceKey = url && storyText ? `${nodeId}\u0000${url}\u0000${storyText}` : null;

		if (!sourceKey || !url) {
			captionSourceKey = null;
			captionRequestId += 1;
			captionAbortController?.abort();
			captionAbortController = null;
			isLoadingCaptions = false;
			captionError = null;
			captionParagraphs = [];
			lastScrolledLineTop = null;
			cancelCaptionScrollAnimation();
			return;
		}

		if (sourceKey === captionSourceKey) return;

		captionSourceKey = sourceKey;
		const requestId = ++captionRequestId;
		captionAbortController?.abort();
		const controller = new AbortController();
		captionAbortController = controller;

		isLoadingCaptions = true;
		captionError = null;

		fetch(url, { signal: controller.signal })
			.then((response) => {
				if (!response.ok) {
					throw new Error('Caption timestamps could not be loaded.');
				}
				return response.json();
			})
			.then((alignment) => {
				if (requestId !== captionRequestId) return;
				const paragraphs = buildCaptionParagraphs(storyText, alignment);

				if (paragraphs.length === 0) {
					throw new Error('Caption timestamps are unavailable for this narration.');
				}

				captionParagraphs = paragraphs;
				lastScrolledLineTop = null;
				cancelCaptionScrollAnimation();
			})
			.catch((err: unknown) => {
				if (controller.signal.aborted || requestId !== captionRequestId) return;
				captionParagraphs = [];
				lastScrolledLineTop = null;
				cancelCaptionScrollAnimation();
				captionError = err instanceof Error ? err.message : 'Captions could not be loaded.';
			})
			.finally(() => {
				if (requestId === captionRequestId) {
					isLoadingCaptions = false;
					if (captionAbortController === controller) {
						captionAbortController = null;
					}
				}
			});
	});
</script>

<section class="fixed inset-0 z-40 overflow-hidden bg-background text-white">
	{#if worldImageUrl}
		<img
			src={worldImageUrl}
			alt={worldImageAlt ?? ''}
			aria-hidden="true"
			class="absolute inset-0 h-full w-full scale-105 object-cover opacity-90 blur-md brightness-[0.45]"
		/>
	{:else}
		<div
			class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_42%),linear-gradient(145deg,#08090d,#18120d_52%,#050506)]"
		></div>
	{/if}
	<div class="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-black/80"></div>
	<div
		class="header-fade pointer-events-none absolute inset-x-0 top-0 z-20 h-14 overflow-visible"
	></div>

	<header
		class="pointer-events-none absolute inset-x-0 top-0 z-30 grid h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-4 sm:px-6"
	>
		<div class="pointer-events-auto flex items-center gap-1">
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={() => onBack?.()}
				disabled={!canGoBack || !onBack}
				aria-label="Undo choice"
				title="Undo"
				class="border border-white/10 bg-white/5 text-white hover:bg-white/15 hover:text-white disabled:opacity-35"
			>
				<Undo class="h-4 w-4" />
			</Button>
		</div>
		<div class="min-w-0 px-1 text-center">
			{#if title}
				<p class="truncate text-sm font-medium text-white/65">{title}</p>
			{/if}
		</div>
		<div class="pointer-events-auto flex items-center gap-1">
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={() => onOpenMap?.()}
				disabled={!onOpenMap}
				aria-label="Open story map"
				title="Map"
				class="border border-white/10 bg-white/5 text-white hover:bg-white/15 hover:text-white disabled:opacity-35"
			>
				<Map class="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon-sm"
				onclick={onExit}
				aria-label="Exit immersive view"
				class="border border-white/10 bg-white/5 text-white hover:bg-white/15 hover:text-white"
			>
				<Minimize2 class="h-4 w-4" />
			</Button>
		</div>
	</header>

	<div class="relative z-10 h-dvh">
		<div class="h-full">
			{#if isStoryGenerating || isNarrationGenerating || !timestampsUrl}
				<div class="flex h-full items-center justify-center px-6 pb-24">
					<div class="flex flex-col items-center gap-5 text-center text-white/80">
						<OrbitProgressLoader
							percentage={loadingProgress}
							label={statusText}
							size={190}
							class="text-white"
						/>
						<p class="text-sm font-medium tracking-wide text-white/70">{statusText}</p>
					</div>
				</div>
			{:else if showCaptionLoading}
				<div class="flex h-full items-center justify-center px-6 pb-24">
					<Spinner class="h-6 w-6 text-primary" />
				</div>
			{:else if captionError}
				<div class="flex h-full items-center justify-center px-6 pb-24">
					<div
						class="max-w-sm rounded-lg border border-white/10 bg-black/35 p-5 text-center backdrop-blur"
					>
						<p class="mb-4 text-sm text-white/75">{captionError}</p>
						<Button
							variant="outline"
							onclick={onExit}
							class="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
						>
							Exit
						</Button>
					</div>
				</div>
			{:else}
				<div
					bind:this={captionScroller}
					class="caption-scroll h-full overflow-hidden px-5 pb-24 sm:px-8"
					aria-live="polite"
				>
					<div class="caption-copy mx-auto max-w-4xl py-[42vh]">
						{#each captionParagraphs as paragraph (paragraph.id)}
							<p class="caption-paragraph">
								{#each paragraph.tokens as token (token.id)}
									{#if token.type === 'word'}
										<button
											type="button"
											tabindex="-1"
											data-caption-word-index={token.wordIndex}
											aria-current={token.wordIndex === activeWordIndex ? 'true' : undefined}
											disabled={!canSeekWords}
											onclick={() => {
												if (canSeekWords) onWordSeek?.(Math.max(0, token.start - 0.03));
											}}
											class="caption-word {token.emphasized ? 'caption-word-emphasized' : ''}
												{canSeekWords ? 'caption-word-seekable' : ''}
												{token.wordIndex === activeWordIndex
												? 'caption-word-active'
												: token.wordIndex < activeWordIndex
													? 'caption-word-read'
													: 'caption-word-upcoming'}"
										>
											{token.text}
										</button>
									{:else}
										{token.text}
									{/if}
								{/each}
							</p>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>

	{#if showChoices}
		<div
			class="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[58dvh] bg-gradient-to-t from-black/90 via-black/58 to-transparent"
			in:fade={{ duration: prefersReducedMotion ? 0 : 450 }}
		></div>
		<div
			class="pointer-events-none absolute inset-x-0 bottom-20 z-30 px-4 sm:bottom-24 sm:px-6"
			in:fade={{ duration: prefersReducedMotion ? 0 : 500 }}
		>
			<div
				class="immersive-choices immersive-choices-panel pointer-events-auto mx-auto max-h-[66dvh] max-w-4xl overflow-y-auto rounded-lg border border-white/15 bg-black/70 p-4 shadow-2xl backdrop-blur-xl sm:p-5"
			>
				{#if choices.length > 0}
					<ChoiceList
						{choices}
						{isLoading}
						{isAtQuotaLimit}
						{showCustomChoice}
						{onChoiceSelect}
						{onCustomChoice}
					/>
				{:else if isEnding}
					<div class="flex flex-col items-center gap-4 py-4 text-center">
						<p class="font-orbitron text-xl text-white">This path has ended</p>
						{#if onRestart}
							<Button
								variant="outline"
								onclick={onRestart}
								class="gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
							>
								<RotateCcw class="h-4 w-4" />
								Start Over
							</Button>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</section>

<style>
	:global(html.immersive-scroll-lock),
	:global(body.immersive-scroll-lock) {
		overflow: hidden !important;
		overscroll-behavior: none;
		scrollbar-width: none;
	}

	:global(html.immersive-scroll-lock::-webkit-scrollbar),
	:global(body.immersive-scroll-lock::-webkit-scrollbar) {
		display: none;
	}

	.header-fade {
		border-bottom: 1px solid rgba(255, 255, 255, 0.12);
		background: rgba(5, 8, 12, 0.44);
		backdrop-filter: blur(16px) saturate(155%) contrast(106%);
		-webkit-backdrop-filter: blur(16px) saturate(155%) contrast(106%);
		box-shadow:
			0 18px 46px rgba(0, 0, 0, 0.26),
			inset 0 -1px rgba(255, 255, 255, 0.12),
			inset 0 1px rgba(255, 255, 255, 0.04);
	}

	.header-fade::before,
	.header-fade::after {
		position: absolute;
		z-index: 0;
		content: '';
		pointer-events: none;
	}

	.header-fade::before {
		inset: 100% 0 auto;
		height: 2rem;
		background: linear-gradient(to bottom, rgba(5, 8, 12, 0.24), transparent);
	}

	.header-fade::after {
		inset: 0;
		background:
			linear-gradient(
				150deg,
				rgba(255, 255, 255, 0.12),
				rgba(255, 255, 255, 0.035) 32%,
				transparent 58%
			),
			linear-gradient(to bottom, rgba(0, 0, 0, 0.16), transparent 72%);
		mix-blend-mode: screen;
		opacity: 0.5;
	}

	.caption-scroll {
		overflow: hidden;
		overscroll-behavior: none;
		scrollbar-width: none;
	}

	.caption-scroll::-webkit-scrollbar {
		display: none;
	}

	.immersive-choices-panel {
		scrollbar-width: none;
		overscroll-behavior: contain;
		background:
			linear-gradient(145deg, rgba(7, 10, 14, 0.88), rgba(7, 10, 14, 0.72)), rgba(0, 0, 0, 0.72);
		backdrop-filter: blur(18px) saturate(135%);
		-webkit-backdrop-filter: blur(18px) saturate(135%);
		box-shadow:
			0 24px 80px rgba(0, 0, 0, 0.45),
			inset 0 1px rgba(255, 255, 255, 0.08);
	}

	.immersive-choices-panel::-webkit-scrollbar {
		display: none;
	}

	.caption-copy {
		font-size: clamp(1.45rem, 3.4vw, 3.05rem);
		line-height: 1.28;
		font-weight: 650;
		letter-spacing: 0;
	}

	.caption-paragraph {
		margin: 0 0 1.35em;
	}

	.caption-paragraph:last-child {
		margin-bottom: 0;
	}

	.caption-word {
		display: inline;
		margin: 0 -0.02em;
		padding: 0 0.06em;
		border: 0;
		border-radius: 0.18em;
		appearance: none;
		background: transparent;
		box-decoration-break: clone;
		-webkit-box-decoration-break: clone;
		cursor: default;
		font: inherit;
		line-height: inherit;
		text-align: inherit;
		transition:
			background-color 0.18s ease,
			color 0.18s ease,
			opacity 0.18s ease,
			text-shadow 0.18s ease;
	}

	.caption-word:disabled {
		pointer-events: none;
		cursor: default;
	}

	.caption-word-seekable {
		cursor: pointer;
	}

	.caption-word-emphasized {
		font-style: italic;
	}

	.caption-word-active {
		background: oklch(from var(--primary) l c h / 0.28);
		color: white;
		opacity: 1;
		text-shadow:
			0 0 22px oklch(from var(--primary) l c h / 0.35),
			0 2px 16px rgba(0, 0, 0, 0.45);
	}

	.caption-word-read {
		background: transparent;
		color: rgb(255 255 255 / 0.38);
		text-shadow: none;
	}

	.caption-word-upcoming {
		background: transparent;
		color: rgb(255 255 255 / 0.68);
		text-shadow: none;
	}

	.caption-word-active.caption-word-emphasized {
		text-shadow:
			0 0 24px oklch(from var(--primary) l c h / 0.4),
			0 2px 16px rgba(0, 0, 0, 0.45);
	}

	:global(.immersive-choices .border-t) {
		border-top-color: rgba(255, 255, 255, 0.12);
	}

	:global(.immersive-choices .text-muted-foreground) {
		color: rgb(255 255 255 / 0.72);
	}

	:global(.immersive-choices .text-foreground) {
		color: white;
	}

	:global(.immersive-choices .story-choice) {
		border-color: rgba(255, 255, 255, 0.14);
		background: rgba(255, 255, 255, 0.08);
		color: white;
	}

	:global(.immersive-choices .story-choice:hover:not(:disabled)) {
		border-color: oklch(from var(--primary) l c h / 0.75);
		background: oklch(from var(--primary) l c h / 0.16);
	}

	@media (prefers-reduced-motion: reduce) {
		.caption-word {
			transition: none;
		}
	}
</style>
