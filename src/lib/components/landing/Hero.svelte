<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Rocket, LogIn } from '@lucide/svelte';

	interface Props {
		onGetStarted?: () => void | Promise<void>;
		onSignIn?: () => void | Promise<void>;
		isLoading?: boolean;
	}

	let { onGetStarted, onSignIn, isLoading = false }: Props = $props();
</script>

<section class="relative flex min-h-screen flex-col items-center justify-center px-6 py-24">
	<!-- Gradient overlay for depth -->
	<div
		class="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background"
	></div>

	<div class="relative z-10 mx-auto max-w-4xl text-center">
		<!-- Decorative stars -->
		<div
			class="hero-enter hero-enter-1 mb-8 flex items-center justify-center gap-3 text-primary/60"
		>
			<span class="hero-twinkle hero-twinkle-1 text-2xl">✦</span>
			<span class="text-sm tracking-[0.3em] text-muted-foreground uppercase">
				Explore Infinite Worlds
			</span>
			<span class="hero-twinkle hero-twinkle-2 text-2xl">✦</span>
		</div>

		<!-- Main title with glow effect -->
		<h1
			class="hero-title hero-enter hero-enter-2 mb-6 text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl"
		>
			<span class="text-foreground">Welcome to</span>
			<br />
			<span class="text-primary">Cosmonaut</span>
		</h1>

		<!-- Subtitle -->
		<p
			class="hero-enter hero-enter-3 mx-auto mb-12 max-w-2xl text-lg text-muted-foreground sm:text-xl"
		>
			Create, explore, and share interactive story worlds. Every choice shapes the narrative. Every
			world is an adventure waiting to unfold.
		</p>

		<!-- CTA Buttons -->
		<div
			class="hero-enter hero-enter-4 flex flex-col items-center justify-center gap-4 sm:flex-row"
		>
			<Button
				size="lg"
				class="group gap-2 px-8 shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
				onclick={onGetStarted}
				disabled={isLoading}
			>
				{#if isLoading}
					<Spinner class="h-5 w-5" />
				{:else}
					<Rocket
						class="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
					/>
				{/if}
				Begin Your Journey
			</Button>
			<Button
				variant="ghost"
				size="lg"
				class="gap-2 text-muted-foreground hover:text-foreground"
				onclick={onSignIn}
				disabled={isLoading}
			>
				{#if isLoading}
					<Spinner class="h-5 w-5" />
					Signing in...
				{:else}
					<LogIn class="h-5 w-5" />
					Sign In
				{/if}
			</Button>
		</div>

		<!-- Scroll indicator -->
		<div class="hero-enter hero-enter-5 mt-24 motion-safe:animate-bounce">
			<div class="mx-auto h-14 w-8 rounded-full border-2 border-muted-foreground/30 p-1">
				<div class="mx-auto h-3 w-1.5 rounded-full bg-primary/60"></div>
			</div>
			<p class="mt-3 text-xs tracking-wider text-muted-foreground/60 uppercase">
				Scroll to explore
			</p>
		</div>
	</div>
</section>

<style>
	.hero-title {
		text-shadow: 0 0 80px oklch(from var(--primary) l c h / 0.15);
	}

	.hero-title span:last-child {
		text-shadow:
			0 0 40px oklch(from var(--primary) l c h / 0.4),
			0 0 80px oklch(from var(--primary) l c h / 0.2);
	}

	/* ── Staggered entrance animations ── */
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
		animation-delay: 0.65s;
	}
	.hero-enter-5 {
		animation-delay: 1s;
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

	/* ── Star twinkle ── */
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

	/* ── Reduced motion ── */
	@media (prefers-reduced-motion: reduce) {
		.hero-enter {
			animation: none;
			opacity: 1;
		}
		.hero-twinkle {
			animation: none;
			opacity: 0.6;
		}
	}
</style>
