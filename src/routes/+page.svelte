<script lang="ts">
	import { goto } from '$app/navigation';
	import { useAuth } from '$lib/auth/auth.svelte';
	import Hero from '$lib/components/features/landing/Hero.svelte';
	import DemoStory from '$lib/components/features/landing/DemoStory.svelte';
	import Features from '$lib/components/features/landing/Features.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Rocket } from '@lucide/svelte';
	import { intersectionReveal } from '$lib/utils/intersectionReveal';
	import SEO from '$lib/components/shared/SEO.svelte';
	import { trackEvent } from '$lib/utils/analytics';

	const auth = useAuth();

	/** Scroll-triggered visibility for the final CTA section */
	let ctaVisible = $state(false);

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
		'@graph': [
			{
				'@type': 'WebApplication',
				'@id': 'https://cosmonaut-ai.com/#webapp',
				name: 'Cosmonaut',
				alternateName: 'Cosmonaut AI',
				url: 'https://cosmonaut-ai.com',
				description:
					'AI-powered choose-your-own-adventure platform for families. Create branching interactive stories from a single prompt - built for parents and kids to read together, with optional audio narration on the Cosmonaut tier.',
				applicationCategory: 'EntertainmentApplication',
				applicationSubCategory: 'Interactive Fiction',
				operatingSystem: 'Web',
				inLanguage: 'en',
				audience: {
					'@type': 'Audience',
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
					'@type': 'Offer',
					price: '0',
					priceCurrency: 'USD'
				},
				creator: {
					'@id': 'https://cosmonaut-ai.com/#organization'
				}
			},
			{
				'@type': 'Organization',
				'@id': 'https://cosmonaut-ai.com/#organization',
				name: 'Matson Software LLC',
				legalName: 'Matson Software LLC',
				url: 'https://cosmonaut-ai.com',
				logo: 'https://cosmonaut-ai.com/logo.png',
				email: 'support@cosmonaut-ai.com',
				brand: {
					'@type': 'Brand',
					name: 'Cosmonaut',
					description:
						'Family-friendly AI choose-your-own-adventure and bedtime story platform for parents and kids to read together.'
				}
			},
			{
				'@type': 'WebSite',
				'@id': 'https://cosmonaut-ai.com/#website',
				url: 'https://cosmonaut-ai.com',
				name: 'Cosmonaut',
				publisher: { '@id': 'https://cosmonaut-ai.com/#organization' },
				inLanguage: 'en'
			}
		]
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

	<!-- Final CTA section -->
	<section
		class="cta-section relative py-24 {ctaVisible ? 'cta-visible' : 'cta-hidden'}"
		use:intersectionReveal={{ onReveal: () => (ctaVisible = true), threshold: 0.2 }}
	>
		<div class="mx-auto max-w-4xl px-6 text-center">
			<h2 class="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
				What story are you building?
			</h2>
			<p class="mx-auto mb-8 max-w-2xl text-muted-foreground">
				One prompt is all it takes. Describe your story, step inside, and see where your choices
				take you.
			</p>
			<Button size="lg" class="gap-2 px-8" onclick={() => handleGetStarted('bottom_cta')}>
				<Rocket class="h-5 w-5" />
				Create Your Story
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
