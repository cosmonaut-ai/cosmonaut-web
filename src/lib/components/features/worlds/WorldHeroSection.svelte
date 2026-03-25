<script lang="ts">
	import type { World } from '$lib/types/api';
	import { goto } from '$app/navigation';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft, Sparkles, Globe, Lock, Clock, ShieldCheck } from '@lucide/svelte';

	function getWorldLengthLabel(length: string | null): string | null {
		switch (length) {
			case 'short':
				return 'Short Story';
			case 'medium':
				return 'Medium Story';
			case 'long':
				return 'Long Story';
			default:
				return null;
		}
	}

	interface Props {
		world: World;
	}

	let { world }: Props = $props();

	const hasDescription = $derived(world.description !== null && world.description.trim() !== '');
</script>

<section class="hero-section relative flex min-h-[60vh] items-end overflow-hidden">
	{#if world.world_image_url}
		<img
			src={world.world_image_url}
			alt={world.world_image_alt_text || world.title || 'World image'}
			loading="lazy"
			class="hero-img absolute inset-0 h-full w-full object-cover object-center"
		/>
	{:else}
		<div class="hero-bg-fallback absolute inset-0">
			{#if world.image_generation_status === 'pending'}
				<div class="hero-shimmer absolute inset-0"></div>
			{/if}
			<div class="absolute inset-0 flex items-center justify-center">
				<img
					src="/logo.png"
					alt=""
					class="h-16 w-16 opacity-10 {world.image_generation_status === 'pending'
						? 'animate-pulse'
						: ''}"
				/>
			</div>
		</div>
	{/if}

	<div class="hero-scanlines pointer-events-none absolute inset-0" aria-hidden="true"></div>
	<div class="hero-vignette pointer-events-none absolute inset-0" aria-hidden="true"></div>
	<div
		class="pointer-events-none absolute inset-0"
		style="background: linear-gradient(to bottom, transparent 30%, var(--background) 100%);"
		aria-hidden="true"
	></div>
	<div class="hero-nebula pointer-events-none absolute inset-0" aria-hidden="true"></div>

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

	<div class="relative z-10 mx-auto w-full max-w-4xl px-6 pt-24 pb-8">
		<div class="hero-enter hero-enter-1 mb-4 flex items-center gap-3 text-primary/60">
			<span class="hero-twinkle hero-twinkle-1 text-lg">✦</span>
			<span class="text-xs tracking-[0.3em] text-muted-foreground uppercase">World</span>
			<span class="hero-twinkle hero-twinkle-2 text-lg">✦</span>
		</div>

		<h1
			class="hero-title hero-enter hero-enter-2 mb-4 text-4xl font-bold text-foreground sm:text-5xl md:text-6xl"
		>
			{world.title || 'Untitled World'}
		</h1>

		{#if hasDescription}
			<p
				class="hero-enter hero-enter-3 mb-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg"
			>
				{world.description}
			</p>
		{/if}

		<div
			class="hero-enter {hasDescription
				? 'hero-enter-4'
				: 'hero-enter-3'} flex flex-wrap items-center gap-3"
		>
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
			{#if getWorldLengthLabel(world.world_length)}
				<Badge variant="outline" class="gap-1.5 border-border/50 bg-background/30 backdrop-blur-sm">
					<Clock class="h-3 w-3" />
					{getWorldLengthLabel(world.world_length)}
				</Badge>
			{/if}
			{#if world.family_friendly}
				<Badge variant="secondary" class="gap-1.5 border-primary/20 bg-primary/10 text-primary">
					<ShieldCheck class="h-3 w-3" />
					Family Friendly
				</Badge>
			{/if}
		</div>
	</div>
</section>

<style>
	.hero-img {
		object-fit: cover;
		object-position: center;
	}

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

	.hero-shimmer {
		background: linear-gradient(
			90deg,
			transparent 0%,
			oklch(from var(--primary) l c h / 0.06) 50%,
			transparent 100%
		);
		background-size: 200% 100%;
		animation: hero-shimmer-move 2s ease-in-out infinite;
	}

	@keyframes hero-shimmer-move {
		0% {
			background-position: -200% 0;
		}
		100% {
			background-position: 200% 0;
		}
	}

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

	.hero-vignette {
		background: radial-gradient(ellipse at center, transparent 40%, var(--background) 100%);
		z-index: 2;
	}

	.hero-nebula {
		background: radial-gradient(
			ellipse at 50% 90%,
			oklch(from var(--primary) l c h / 0.08) 0%,
			transparent 60%
		);
		z-index: 3;
	}

	.hero-title {
		text-shadow:
			0 0 40px oklch(from var(--primary) l c h / 0.4),
			0 0 80px oklch(from var(--primary) l c h / 0.2);
	}

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
		.hero-shimmer {
			animation: none;
		}
	}
</style>
