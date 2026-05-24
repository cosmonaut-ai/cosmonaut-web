<script lang="ts">
	import { goto } from '$app/navigation';
	import { useAuth } from '$lib/auth/auth.svelte';
	import Hero from '$lib/components/features/landing/Hero.svelte';
	import DemoStory from '$lib/components/features/landing/DemoStory.svelte';
	import Features from '$lib/components/features/landing/Features.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Rocket, Smartphone } from '@lucide/svelte';
	import SEO from '$lib/components/shared/SEO.svelte';
	import { trackEvent } from '$lib/utils/analytics';

	const auth = useAuth();

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
</script>

<SEO
	title="Cosmonaut - AI Choose-Your-Own-Adventure Stories for Families"
	description="Create AI choose-your-own-adventure stories and custom bedtime tales the whole family can read together. Describe any world; Cosmonaut writes a branching, family-friendly story shaped by your choices."
	path="/"
	ogImageAlt="Cosmonaut - AI choose-your-own-adventure stories for families"
	jsonLd={{
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		'@id': 'https://cosmonaut-ai.com/#software',
		name: 'Cosmonaut',
		alternateName: 'Cosmonaut AI',
		url: 'https://cosmonaut-ai.com/',
		description:
			'AI-powered choose-your-own-adventure platform for families. Create branching interactive stories from a single prompt - built for parents and kids to read together, with optional audio narration on the Cosmonaut tier.',
		applicationCategory: 'GameApplication',
		applicationSubCategory: 'Interactive Fiction',
		operatingSystem: 'Web',
		inLanguage: 'en',
		image: 'https://cosmonaut-ai.com/og-image.png',
		audience: {
			'@type': 'PeopleAudience',
			suggestedMinAge: 6,
			audienceType: 'Families with children, parents, readers of interactive fiction'
		},
		featureList: [
			'AI-generated choose-your-own-adventure stories',
			'Custom AI bedtime stories for families to read together',
			'Audio narration available on the Cosmonaut tier',
			'Family-friendly content filters and vocabulary controls',
			'Branching storylines with a visual story map',
			'Parental controls for age-appropriate content'
		],
		offers: {
			'@type': 'AggregateOffer',
			priceCurrency: 'USD',
			lowPrice: '0',
			highPrice: '25',
			offerCount: 3
		},
		isPartOf: { '@id': 'https://cosmonaut-ai.com/#website' },
		publisher: { '@id': 'https://cosmonaut-ai.com/#organization' }
	}}
/>

{#await import('$lib/components/features/landing/Starfield.svelte') then { default: Starfield }}
	<Starfield />
{/await}

<main>
	<!-- Hero section -->
	<Hero onGetStarted={() => handleGetStarted('hero')} onSignIn={handleSignIn} isLoading={false} />

	<!-- Demo story section -->
	<DemoStory />

	<!-- Features section -->
	<Features />

	<!-- Android app section -->
	<section class="relative bg-[#101923] pt-16 pb-20 text-[#f7f1e3] sm:pt-20 sm:pb-24">
		<div class="mx-auto max-w-5xl px-6">
			<div
				class="grid items-center gap-10 rounded-lg border border-[#314354] bg-[#172534] p-8 shadow-[0_24px_70px_rgba(0,0,0,0.24)] sm:p-10 lg:grid-cols-[1fr_auto] lg:gap-16"
			>
				<div>
					<p class="mb-3 text-sm font-semibold tracking-[0.18em] text-[#f3d98b] uppercase">
						Take it with you
					</p>
					<h2 class="mb-4 text-3xl leading-tight font-semibold text-[#fff8e8] sm:text-4xl">
						We're on Android!
					</h2>
					<p class="max-w-xl text-lg leading-relaxed text-[#b6c4cd]">
						The same branching stories, audio narration, and story map — in your pocket. Read on the
						couch, in the car, or wherever bedtime happens to be tonight.
					</p>
					<a
						href="https://play.google.com/store/apps/details?id=com.cosmonaut.app"
						target="_blank"
						rel="noopener noreferrer"
						class="mt-6 inline-flex items-center gap-2 rounded-lg border border-[#314354] bg-[#101923] px-5 py-3 text-sm font-semibold text-[#f7f1e3] transition-colors hover:border-[#f3d98b] hover:bg-[#142130]"
					>
						<Smartphone class="h-5 w-5 text-[#f3d98b]" />
						Get it on Google Play
					</a>
				</div>
				<div class="hidden lg:block">
					<div
						class="flex h-36 w-36 items-center justify-center rounded-2xl border border-[#314354] bg-[#101923]"
					>
						<img src="/logo.png" alt="Cosmonaut app icon" class="h-16 w-16" />
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Final CTA section -->
	<section class="relative pt-24 pb-28 text-[#f7f1e3] sm:pt-32 sm:pb-36">
		<!-- Gradient from section background to transparent -->
		<div
			class="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-[#101923] to-transparent"
		></div>
		<div class="mx-auto max-w-3xl px-6 text-center">
			<p class="mb-5 text-sm font-semibold tracking-[0.18em] text-[#f3d98b] uppercase">Your turn</p>
			<h2
				class="mb-6 font-orbitron text-3xl leading-tight font-bold tracking-wide text-[#fff8e8] sm:text-4xl lg:text-5xl"
			>
				One odd detail. One whole story.
			</h2>
			<p class="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-[#b6c4cd]">
				A missing moon name. A dragon who needs to apologize. A garden on Mars. Give Cosmonaut a
				spark and read what grows from it.
			</p>
			<Button
				size="lg"
				class="gap-2 px-10 py-6 text-base"
				onclick={() => handleGetStarted('bottom_cta')}
			>
				<Rocket class="h-5 w-5" />
				Create Your Story
			</Button>
		</div>
	</section>
</main>
