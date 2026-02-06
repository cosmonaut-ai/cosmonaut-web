<script lang="ts">
	import type { World } from '$lib/types/api';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import ShareModal from './ShareModal.svelte';
	import {
		ArrowLeft,
		BookOpen,
		Map,
		Share2,
		MapPin,
		Compass,
		Calendar,
		Globe,
		Lock,
		Sparkles,
		Eye
	} from '@lucide/svelte';

	interface Props {
		world: World;
		onWorldUpdate?: (world: World) => void;
	}

	let { world, onWorldUpdate }: Props = $props();

	let shareModalOpen = $state(false);

	/** Detect prefers-reduced-motion */
	const prefersReducedMotion = browser
		? window.matchMedia('(prefers-reduced-motion: reduce)').matches
		: false;

	// Track visibility for scroll-triggered sections
	let briefingVisible = $state(false);
	let locationsVisible = $state(false);
	let endingsVisible = $state(false);

	const hasLocations = $derived(world.locations !== null && world.locations.length > 0);
	const hasEndings = $derived(
		world.potential_endings !== null && world.potential_endings.length > 0
	);
	const hasSetting = $derived(world.setting !== null && world.setting.trim() !== '');
	const hasDescription = $derived(world.description !== null && world.description.trim() !== '');

	function observeSection(setter: (v: boolean) => void) {
		return function (node: HTMLElement) {
			if (prefersReducedMotion) {
				setter(true);
				return;
			}

			const observer = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						if (entry.isIntersecting) {
							setter(true);
							observer.unobserve(node);
						}
					}
				},
				{ threshold: 0.15 }
			);

			observer.observe(node);

			return () => {
				observer.disconnect();
			};
		};
	}

	function handleEnterStory() {
		if (world.root_node_id) {
			goto(`/worlds/${world.id}/nodes/${world.root_node_id}`);
		}
	}

	function handleViewMap() {
		goto(`/worlds/${world.id}/graph`);
	}


</script>

<div class="world-home">
	<!-- ═══════════════════════════════════════════════════════════════════
	     1. HERO SECTION — "The Observation Deck"
	     ═══════════════════════════════════════════════════════════════════ -->
	<section class="hero-section relative flex min-h-[60vh] items-end overflow-hidden">
		<!-- Background image or fallback gradient -->
		{#if world.world_image_url}
			<img
				src={world.world_image_url}
				alt={world.world_image_alt_text || world.title || 'World image'}
				class="hero-img absolute inset-0 h-full w-full object-cover object-center"
			/>
		{:else}
			<div class="hero-bg-fallback absolute inset-0"></div>
		{/if}

		<!-- CRT scanline overlay -->
		<div class="hero-scanlines pointer-events-none absolute inset-0" aria-hidden="true"></div>

		<!-- Vignette overlay -->
		<div class="hero-vignette pointer-events-none absolute inset-0" aria-hidden="true"></div>

		<!-- Bottom gradient fade -->
		<div
			class="pointer-events-none absolute inset-0"
			style="background: linear-gradient(to bottom, transparent 30%, var(--background) 100%);"
			aria-hidden="true"
		></div>

		<!-- Nebula glow behind content -->
		<div class="hero-nebula pointer-events-none absolute inset-0" aria-hidden="true"></div>

		<!-- Back to dashboard -->
		<div class="absolute top-4 left-4 z-20">
			<Button
				variant="ghost"
				size="sm"
				class="gap-2 bg-background/30 backdrop-blur-sm hover:bg-background/50"
				onclick={() => goto('/dashboard')}
			>
				<ArrowLeft class="h-4 w-4" />
				Dashboard
			</Button>
		</div>

		<!-- Hero content -->
		<div class="relative z-10 mx-auto w-full max-w-4xl px-6 pt-24 pb-8">
			<!-- Star label -->
			<div class="hero-enter hero-enter-1 mb-4 flex items-center gap-3 text-primary/60">
				<span class="hero-twinkle hero-twinkle-1 text-lg">✦</span>
				<span class="text-xs tracking-[0.3em] text-muted-foreground uppercase">World</span>
				<span class="hero-twinkle hero-twinkle-2 text-lg">✦</span>
			</div>

			<!-- Title -->
			<h1
				class="hero-title hero-enter hero-enter-2 mb-4 text-4xl font-bold text-foreground sm:text-5xl md:text-6xl"
			>
				{world.title || 'Untitled World'}
			</h1>

			<!-- Description -->
			{#if hasDescription}
				<p class="hero-enter hero-enter-3 mb-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
					{world.description}
				</p>
			{/if}

			<!-- Badges row -->
			<div class="hero-enter {hasDescription ? 'hero-enter-4' : 'hero-enter-3'} flex flex-wrap items-center gap-3">
				{#if world.genre}
					<Badge variant="secondary" class="gap-1.5 border-primary/20 bg-primary/10 text-primary">
						<Sparkles class="h-3 w-3" />
						{world.genre}
					</Badge>
				{/if}
				<Badge variant="outline" class="gap-1.5 border-border/50 bg-background/30 backdrop-blur-sm">
					{#if world.visibility === 'public'}
						<Globe class="h-3 w-3" />
						Public
					{:else}
						<Lock class="h-3 w-3" />
						Private
					{/if}
				</Badge>
			</div>
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════════
	     2. QUICK ACTIONS — "Mission Controls"
	     ═══════════════════════════════════════════════════════════════════ -->
	<section class="hero-enter hero-enter-5 mx-auto max-w-4xl px-6 py-8">
		<div class="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
			{#if world.root_node_id}
				<Button
					size="lg"
					class="group gap-2 px-8 shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
					onclick={handleEnterStory}
				>
					<BookOpen class="h-5 w-5 transition-transform group-hover:scale-110" />
					Enter the Story
				</Button>
			{/if}

			<Button variant="outline" size="lg" class="gap-2 px-6" onclick={handleViewMap}>
				<Map class="h-5 w-5" />
				View Story Map
			</Button>

			<Button
				variant="ghost"
				size="lg"
				class="gap-2 text-muted-foreground hover:text-foreground"
				onclick={() => (shareModalOpen = true)}
			>
				<Share2 class="h-5 w-5" />
				Share World
			</Button>
		</div>

		<!-- Metadata line -->
		<div
			class="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground/70"
		>
			<span class="flex items-center gap-1.5">
				<Calendar class="h-3.5 w-3.5" />
				Created {new Date(world.created_at).toLocaleDateString(undefined, {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				})}
			</span>
			{#if world.score}
				<span class="flex items-center gap-1.5">
					<Sparkles class="h-3.5 w-3.5" />
					Score: {world.score}
				</span>
			{/if}
			{#if hasEndings}
				<span class="flex items-center gap-1.5">
					<Eye class="h-3.5 w-3.5" />
					{world.potential_endings?.length} possible ending{world.potential_endings &&
					world.potential_endings.length !== 1
						? 's'
						: ''}
				</span>
			{/if}
		</div>
	</section>

	<!-- ═══════════════════════════════════════════════════════════════════
	     3. CONSTELLATION DIVIDER + SETTING
	     ═══════════════════════════════════════════════════════════════════ -->
	{#if hasSetting}
		<div class="flex items-center justify-center gap-3 py-4" aria-hidden="true">
			<span class="hero-twinkle hero-twinkle-1 text-sm text-primary/40">✦</span>
			<div class="h-px w-12 bg-primary/20"></div>
			<div class="h-1.5 w-1.5 rounded-full bg-primary/30"></div>
			<div class="h-px w-24 bg-primary/20"></div>
			<div class="h-1.5 w-1.5 rounded-full bg-primary/30"></div>
			<div class="h-px w-12 bg-primary/20"></div>
			<span class="hero-twinkle hero-twinkle-2 text-sm text-primary/40">✦</span>
		</div>

		<section
			class="section-animate mx-auto max-w-4xl px-6 py-8 {briefingVisible
				? 'section-visible'
				: 'section-hidden'}"
			{@attach observeSection((v) => {
				briefingVisible = v;
			})}
		>
			<div class="mb-8 text-center">
				<p class="mb-3 text-xs font-medium tracking-[0.3em] text-primary/60 uppercase">
					✦ World Briefing ✦
				</p>
			</div>

			<Card class="mb-6 border-border/50 bg-card/50">
				<CardContent class="flex items-start gap-4 p-6">
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10"
					>
						<MapPin class="h-5 w-5 text-primary" />
					</div>
					<div>
						<p class="mb-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
							Setting
						</p>
						<p class="text-sm leading-relaxed text-card-foreground/80">{world.setting}</p>
					</div>
				</CardContent>
			</Card>
		</section>
	{/if}

	<!-- ═══════════════════════════════════════════════════════════════════
	     6. LOCATIONS — "Star Chart"
	     ═══════════════════════════════════════════════════════════════════ -->
	{#if hasLocations}
		<!-- Constellation divider -->
		<div class="flex items-center justify-center gap-3 py-4" aria-hidden="true">
			<span class="text-sm text-primary/40">✦</span>
			<div class="h-px w-12 bg-primary/20"></div>
			<div class="h-1.5 w-1.5 rounded-full bg-primary/30"></div>
			<div class="h-px w-24 bg-primary/20"></div>
			<div class="h-1.5 w-1.5 rounded-full bg-primary/30"></div>
			<div class="h-px w-12 bg-primary/20"></div>
			<span class="text-sm text-primary/40">✦</span>
		</div>

		<section
			class="section-animate mx-auto max-w-4xl px-6 py-8 {locationsVisible
				? 'section-visible'
				: 'section-hidden'}"
			{@attach observeSection((v) => {
				locationsVisible = v;
			})}
		>
			<!-- Section header -->
			<div class="mb-8 text-center">
				<p class="mb-3 text-xs font-medium tracking-[0.3em] text-primary/60 uppercase">
					✦ Locations ✦
				</p>
				<h2 class="text-2xl font-bold text-foreground">Star Chart</h2>
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				{#each world.locations ?? [] as location, i (location.name ?? i)}
					<Card class="location-card group overflow-hidden" style="--entrance-delay: {i * 60}ms">
						<CardContent class="p-5">
							<div class="mb-4 flex items-center gap-3">
								<div
									class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-lg group-hover:shadow-primary/10"
								>
									<Compass class="h-5 w-5 text-primary" />
								</div>
								<h3 class="truncate font-semibold text-foreground">
									{location.name || 'Unknown Location'}
								</h3>
							</div>

							{#if location.description}
								<p class="mb-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
									{location.description}
								</p>
							{/if}

							{#if location.connections && location.connections.length > 0}
								<div class="flex flex-wrap gap-1.5">
									{#each location.connections as connection, ci (ci)}
										<Badge variant="outline" class="text-xs">
											{connection}
										</Badge>
									{/each}
								</div>
							{/if}
						</CardContent>
					</Card>
				{/each}
			</div>
		</section>
	{/if}

	<!-- ═══════════════════════════════════════════════════════════════════
	     7. POTENTIAL ENDINGS — "Possible Destinations"
	     ═══════════════════════════════════════════════════════════════════ -->
	{#if hasEndings}
		<!-- Constellation divider -->
		<div class="flex items-center justify-center gap-3 py-4" aria-hidden="true">
			<span class="text-sm text-primary/40">✦</span>
			<div class="h-px w-12 bg-primary/20"></div>
			<div class="h-1.5 w-1.5 rounded-full bg-primary/30"></div>
			<div class="h-px w-24 bg-primary/20"></div>
			<div class="h-1.5 w-1.5 rounded-full bg-primary/30"></div>
			<div class="h-px w-12 bg-primary/20"></div>
			<span class="text-sm text-primary/40">✦</span>
		</div>

		<section
			class="section-animate mx-auto max-w-4xl px-6 py-8 {endingsVisible
				? 'section-visible'
				: 'section-hidden'}"
			{@attach observeSection((v) => {
				endingsVisible = v;
			})}
		>
			<!-- Section header -->
			<div class="mb-8 text-center">
				<p class="mb-3 text-xs font-medium tracking-[0.3em] text-primary/60 uppercase">
					✦ Possible Endings ✦
				</p>
				<h2 class="text-2xl font-bold text-foreground">Possible Destinations</h2>
				<p class="mt-2 text-sm text-muted-foreground">Hover to reveal — but beware of spoilers</p>
			</div>

			<div class="mx-auto max-w-2xl space-y-3">
				{#each world.potential_endings ?? [] as ending, i (i)}
					<div
						class="ending-card group rounded-lg border border-border/50 bg-card/50 p-4 transition-all duration-300 hover:border-primary/30 hover:bg-card"
						style="--entrance-delay: {i * 80}ms"
					>
						<p
							class="ending-text text-sm text-muted-foreground transition-all duration-500 group-hover:text-foreground"
						>
							{ending}
						</p>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- ═══════════════════════════════════════════════════════════════════
	     8. FOOTER METADATA
	     ═══════════════════════════════════════════════════════════════════ -->
	<footer class="mx-auto max-w-4xl px-6 pt-8 pb-12">
		<div class="border-t border-border/30 pt-6">
			<div
				class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground/60"
			>
				<span>Created {new Date(world.created_at).toLocaleDateString()}</span>
				<span>Updated {new Date(world.updated_at).toLocaleDateString()}</span>
				{#if world.genre}
					<span>{world.genre}</span>
				{/if}
				{#if world.story_max_nodes}
					<span>Max {world.story_max_nodes} nodes</span>
				{/if}
				{#if world.node_text_length}
					<span>~{world.node_text_length} words per node</span>
				{/if}
			</div>
		</div>
	</footer>
</div>

<!-- Share Modal -->
<ShareModal
	{world}
	open={shareModalOpen}
	onOpenChange={(open) => (shareModalOpen = open)}
	{onWorldUpdate}
/>

<style>
	/* ══════════════════════════════════════════════════════════════════
	   HERO — Background & Overlays
	   ══════════════════════════════════════════════════════════════════ */

	.hero-img {
		object-fit: cover;
		object-position: center;
	}

	/* Animated gradient fallback when no image */
	.hero-bg-fallback {
		background: linear-gradient(
			135deg,
			oklch(from var(--primary) l c h / 0.15) 0%,
			oklch(from var(--accent) l c h / 0.08) 30%,
			oklch(from var(--secondary) l c h / 0.12) 60%,
			oklch(from var(--primary) l c h / 0.1) 100%
		);
		background-size: 300% 300%;
		animation: gradient-drift 12s ease-in-out infinite;
	}

	@keyframes gradient-drift {
		0%,
		100% {
			background-position: 0% 50%;
		}
		33% {
			background-position: 100% 0%;
		}
		66% {
			background-position: 50% 100%;
		}
	}

	/* CRT scanline overlay */
	.hero-scanlines {
		background: repeating-linear-gradient(
			0deg,
			transparent,
			transparent 2px,
			rgba(0, 0, 0, 0.03) 2px,
			rgba(0, 0, 0, 0.03) 4px
		);
		z-index: 1;
	}

	/* Vignette effect */
	.hero-vignette {
		background: radial-gradient(ellipse at center, transparent 40%, var(--background) 100%);
		z-index: 2;
	}

	/* Nebula glow behind content area */
	.hero-nebula {
		background: radial-gradient(
			ellipse at 50% 90%,
			oklch(from var(--primary) l c h / 0.08) 0%,
			transparent 60%
		);
		z-index: 3;
	}

	/* ══════════════════════════════════════════════════════════════════
	   HERO — Title glow
	   ══════════════════════════════════════════════════════════════════ */

	.hero-title {
		text-shadow:
			0 0 40px oklch(from var(--primary) l c h / 0.4),
			0 0 80px oklch(from var(--primary) l c h / 0.2);
	}

	/* ══════════════════════════════════════════════════════════════════
	   HERO — Staggered entrance animations
	   ══════════════════════════════════════════════════════════════════ */

	.hero-enter {
		animation: hero-fade-up 0.8s ease-out both;
	}
	.hero-enter-1 {
		animation-delay: 0.1s;
	}
	.hero-enter-2 {
		animation-delay: 0.25s;
	}
	.hero-enter-3 {
		animation-delay: 0.45s;
	}
	.hero-enter-4 {
		animation-delay: 0.6s;
	}
	.hero-enter-5 {
		animation-delay: 0.75s;
	}

	@keyframes hero-fade-up {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ══════════════════════════════════════════════════════════════════
	   HERO — Star twinkle (reuses landing page pattern)
	   ══════════════════════════════════════════════════════════════════ */

	.hero-twinkle {
		display: inline-block;
		animation: twinkle 3s ease-in-out infinite;
	}
	.hero-twinkle-1 {
		animation-delay: 0s;
	}
	.hero-twinkle-2 {
		animation-delay: 1.5s;
	}

	@keyframes twinkle {
		0%,
		100% {
			opacity: 0.4;
			transform: scale(1) rotate(0deg);
		}
		50% {
			opacity: 1;
			transform: scale(1.25) rotate(15deg);
		}
	}

	/* ══════════════════════════════════════════════════════════════════
	   SECTIONS — Scroll-triggered fade-up
	   ══════════════════════════════════════════════════════════════════ */

	.section-animate {
		transition:
			opacity 0.6s ease-out,
			transform 0.6s ease-out;
	}

	.section-hidden {
		opacity: 0;
		transform: translateY(24px);
	}

	.section-visible {
		opacity: 1;
		transform: translateY(0);
	}

	/* ══════════════════════════════════════════════════════════════════
	   LOCATION CARDS — Entrance & hover
	   ══════════════════════════════════════════════════════════════════ */

	:global(.location-card) {
		animation: card-enter 0.5s ease-out both;
		animation-delay: var(--entrance-delay, 0ms);
		transition:
			transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			border-color 0.3s ease;
	}

	:global(.location-card:hover) {
		transform: translateY(-3px);
		border-color: var(--primary);
		box-shadow:
			0 8px 24px oklch(from var(--primary) l c h / 0.1),
			0 2px 8px oklch(0 0 0 / 0.15);
	}

	@keyframes card-enter {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ══════════════════════════════════════════════════════════════════
	   ENDINGS — Spoiler blur & entrance
	   ══════════════════════════════════════════════════════════════════ */

	.ending-card {
		animation: card-enter 0.5s ease-out both;
		animation-delay: var(--entrance-delay, 0ms);
	}

	.ending-text {
		filter: blur(5px);
		user-select: none;
	}

	.ending-card:hover .ending-text,
	.ending-card:focus-within .ending-text {
		filter: blur(0);
		user-select: auto;
	}

	/* ══════════════════════════════════════════════════════════════════
	   REDUCED MOTION
	   ══════════════════════════════════════════════════════════════════ */

	@media (prefers-reduced-motion: reduce) {
		.hero-enter {
			animation: none;
			opacity: 1;
		}
		.hero-twinkle {
			animation: none;
			opacity: 0.6;
		}
		.hero-bg-fallback {
			animation: none;
		}
		.section-animate {
			transition: none;
		}
		.section-hidden {
			opacity: 1;
			transform: none;
		}
		:global(.location-card) {
			animation: none;
			opacity: 1;
		}
		:global(.location-card:hover) {
			transform: none;
		}
		.ending-card {
			animation: none;
			opacity: 1;
		}
	}
</style>
