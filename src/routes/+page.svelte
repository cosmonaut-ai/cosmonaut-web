<script lang="ts">
	import { goto } from '$app/navigation';
	import { useAuth } from '$lib/auth/auth.svelte';
	import Hero from '$lib/components/features/landing/Hero.svelte';
	import DemoStory from '$lib/components/features/landing/DemoStory.svelte';
	import Features from '$lib/components/features/landing/Features.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Rocket } from '@lucide/svelte';
	import { browser } from '$app/environment';
	import SEO from '$lib/components/shared/SEO.svelte';
	import { trackEvent } from '$lib/utils/analytics';

	const auth = useAuth();

	let isScrolled = $state(false);

	const prefersReducedMotion = browser
		? window.matchMedia('(prefers-reduced-motion: reduce)').matches
		: false;

	/** Scroll-triggered visibility for the final CTA section */
	let ctaVisible = $state(false);

	function observeCta(node: HTMLElement) {
		if (prefersReducedMotion) {
			ctaVisible = true;
			return;
		}

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						ctaVisible = true;
						observer.unobserve(node);
					}
				}
			},
			{ threshold: 0.2 }
		);

		observer.observe(node);

		return {
			destroy() {
				observer.disconnect();
			}
		};
	}

	function handleGetStarted(location: string = 'hero') {
		trackEvent('cta_clicked', { location });
		if (auth.isAuthenticated) {
			goto('/dashboard');
		} else {
			goto('/login');
		}
	}

	function handleSignIn() {
		if (auth.isAuthenticated) {
			goto('/dashboard');
		} else {
			goto('/login');
		}
	}

	// Track scroll for navbar
	function handleScroll() {
		isScrolled = window.scrollY > 50;
	}
</script>

<svelte:window onscroll={handleScroll} />

<SEO
	title="Cosmonaut - Custom interactive stories for you & your family"
	description="Create, explore, and share interactive story worlds. Every choice shapes the narrative. Every world is an adventure waiting to unfold."
	path="/"
	jsonLd={{
		'@context': 'https://schema.org',
		'@type': 'WebApplication',
		name: 'Cosmonaut',
		url: 'https://cosmonaut-ai.com',
		description:
			'Create, explore, and share interactive story worlds. Every choice shapes the narrative. Every world is an adventure waiting to unfold.',
		applicationCategory: 'Entertainment',
		operatingSystem: 'Web',
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD'
		},
		creator: {
			'@type': 'Organization',
			name: 'Matson Software LLC',
			url: 'https://cosmonaut-ai.com'
		}
	}}
/>

{#await import('$lib/components/features/landing/Starfield.svelte') then { default: Starfield }}
	<Starfield />
{/await}

<!-- Navigation header -->
<header
	class="fixed top-0 right-0 left-0 z-50 transition-all duration-300 {isScrolled
		? 'border-b border-border/50 bg-background/80 backdrop-blur-md'
		: 'bg-transparent'}"
>
	<div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
		<!-- Logo -->
		<a href="/" class="flex items-center gap-2">
			<div
				class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 transition-colors"
			>
				<img src="/logo.png" alt="Cosmonaut logo" class="h-6 w-6" />
			</div>
			<span class="font-orbitron font-semibold text-foreground">Cosmonaut</span>
			<span
				class="-translate-y-1 rounded-full border border-amber-400/60 px-1.5 py-0.5 text-[10px] leading-none font-semibold tracking-wide text-amber-400"
				>BETA</span
			>
		</a>

		<!-- Nav actions -->
		<div class="flex items-center gap-3">
			{#if auth.isAuthenticated}
				<Button variant="ghost" size="sm" onclick={() => goto('/dashboard')}>Dashboard</Button>
			{:else}
				<Button size="sm" onclick={() => handleGetStarted('nav')}>
					<Rocket class="h-4 w-4" />
					Get Started
				</Button>
			{/if}
		</div>
	</div>
</header>

<!-- Main content -->
<main>
	<!-- Hero section -->
	<Hero onGetStarted={() => handleGetStarted('hero')} onSignIn={handleSignIn} isLoading={false} />

	<!-- Demo story section -->
	<DemoStory />

	<!-- Features section -->
	<Features />

	<!-- Final CTA section -->
	<section
		class="cta-section relative py-24 {ctaVisible ? 'cta-visible' : 'cta-hidden'}"
		use:observeCta
	>
		<div class="mx-auto max-w-4xl px-6 text-center">
			<h2 class="mb-4 text-3xl font-bold text-foreground sm:text-4xl">Ready to Create?</h2>
			<p class="mx-auto mb-8 max-w-2xl text-muted-foreground">
				Your universe is one prompt away. Describe a world, step inside, and let the story unfold.
			</p>
			<Button size="lg" class="gap-2 px-8" onclick={() => handleGetStarted('bottom_cta')}>
				<Rocket class="h-5 w-5" />
				Start Your Journey
			</Button>
		</div>
	</section>
</main>

<style>
	.cta-section {
		transition:
			opacity 0.7s ease-out,
			transform 0.7s ease-out;
	}
	.cta-hidden {
		opacity: 0;
		transform: translateY(24px);
	}
	.cta-visible {
		opacity: 1;
		transform: translateY(0);
	}

	@media (prefers-reduced-motion: reduce) {
		.cta-section {
			transition: none;
		}
		.cta-hidden {
			opacity: 1;
			transform: none;
		}
	}
</style>
