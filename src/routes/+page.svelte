<script lang="ts">
	import { goto } from '$app/navigation';
	import { useAuth } from '$lib/auth/auth.svelte';
	import { isLocalEnvironment } from '$lib/config';
	import Starfield from '$lib/components/landing/Starfield.svelte';
	import Hero from '$lib/components/landing/Hero.svelte';
	import DemoStory from '$lib/components/landing/DemoStory.svelte';
	import Features from '$lib/components/landing/Features.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Rocket, LogIn } from '@lucide/svelte';
	import { browser } from '$app/environment';

	const auth = useAuth();

	let isScrolled = $state(false);
	let isSigningIn = $state(false);

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

	async function handleGetStarted() {
		if (isSigningIn) return;

		try {
			if (auth.isAuthenticated) {
				goto('/dashboard');
			} else {
				isSigningIn = true;
				await auth.login();
				// In local environment, redirect after login (OAuth redirects via callback)
				if (isLocalEnvironment && auth.isAuthenticated) {
					goto('/dashboard');
				}
			}
		} catch (error) {
			console.error('Failed to get started:', error);
		} finally {
			// Only reset if we're still on this page (local env)
			if (isLocalEnvironment) {
				isSigningIn = false;
			}
		}
	}

	async function handleSignIn() {
		if (isSigningIn) return;

		// If already authenticated, navigate to dashboard instead of re-triggering OAuth
		if (auth.isAuthenticated) {
			goto('/dashboard');
			return;
		}

		try {
			isSigningIn = true;
			await auth.login();
			// In local environment, redirect after login (OAuth redirects via callback)
			if (isLocalEnvironment && auth.isAuthenticated) {
				goto('/dashboard');
			}
		} catch (error) {
			console.error('Failed to sign in:', error);
		} finally {
			// Only reset if we're still on this page (local env)
			if (isLocalEnvironment) {
				isSigningIn = false;
			}
		}
	}

	// Track scroll for navbar
	function handleScroll() {
		isScrolled = window.scrollY > 50;
	}
</script>

<svelte:window onscroll={handleScroll} />

<svelte:head>
	<title>Cosmonaut - Explore Infinite Story Worlds</title>
	<meta
		name="description"
		content="Create, explore, and share interactive story worlds. Every choice shapes the narrative. Every world is an adventure waiting to unfold."
	/>
</svelte:head>

<!-- Animated starfield background -->
<Starfield />

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
				class="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 transition-colors hover:border-primary/50"
			>
				<Rocket class="h-4 w-4 text-primary" />
			</div>
			<span class="font-semibold text-foreground">Cosmonaut</span>
		</a>

		<!-- Nav actions -->
		<div class="flex items-center gap-3">
			{#if auth.isAuthenticated}
				<Button variant="ghost" size="sm" onclick={() => goto('/dashboard')}>Dashboard</Button>
			{:else}
				<Button
					variant="ghost"
					size="sm"
					class="text-muted-foreground hover:text-foreground"
					onclick={handleSignIn}
					disabled={isSigningIn}
				>
					{#if isSigningIn}
						<Spinner />
						Signing in...
					{:else}
						<LogIn class="h-4 w-4" />
						Sign In
					{/if}
				</Button>
				<Button size="sm" onclick={handleGetStarted} disabled={isSigningIn}>
					{#if isSigningIn}
						<Spinner />
					{:else}
						<Rocket class="h-4 w-4" />
					{/if}
					Get Started
				</Button>
			{/if}
		</div>
	</div>
</header>

<!-- Main content -->
<main>
	<!-- Hero section -->
	<Hero onGetStarted={handleGetStarted} onSignIn={handleSignIn} isLoading={isSigningIn} />

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
				Join thousands of storytellers crafting unique adventures. Your world is waiting to be
				discovered.
			</p>
			<Button
				size="lg"
				class="gap-2 px-8 shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
				onclick={handleGetStarted}
				disabled={isSigningIn}
			>
				{#if isSigningIn}
					<Spinner class="h-5 w-5" />
				{:else}
					<Rocket class="h-5 w-5" />
				{/if}
				Start Your Journey
			</Button>
		</div>
	</section>
</main>

<!-- Footer -->
<Footer />

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
