<script lang="ts">
	import { goto } from '$app/navigation';
	import { useAuth } from '$lib/auth/auth.svelte';
	import Starfield from '$lib/components/landing/Starfield.svelte';
	import Hero from '$lib/components/landing/Hero.svelte';
	import DemoStory from '$lib/components/landing/DemoStory.svelte';
	import Features from '$lib/components/landing/Features.svelte';
	import Footer from '$lib/components/landing/Footer.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Rocket, LogIn } from '@lucide/svelte';

	const auth = useAuth();

	let isScrolled = $state(false);

	async function handleGetStarted() {
		try {
			if (auth.isAuthenticated) {
				goto('/dashboard');
			} else {
				await auth.login();
			}
		} catch (error) {
			console.error('Failed to get started:', error);
		}
	}

	async function handleSignIn() {
		try {
			await auth.login();
		} catch (error) {
			console.error('Failed to sign in:', error);
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
				>
					<LogIn class="mr-2 h-4 w-4" />
					Sign In
				</Button>
				<Button size="sm" onclick={handleGetStarted}>Get Started</Button>
			{/if}
		</div>
	</div>
</header>

<!-- Main content -->
<main>
	<!-- Hero section -->
	<Hero onGetStarted={handleGetStarted} onSignIn={handleSignIn} />

	<!-- Demo story section -->
	<DemoStory />

	<!-- Features section -->
	<Features />

	<!-- Final CTA section -->
	<section class="relative py-24">
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
			>
				<Rocket class="h-5 w-5" />
				Start Your Journey
			</Button>
		</div>
	</section>
</main>

<!-- Footer -->
<Footer />
