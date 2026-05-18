<script lang="ts">
	import SEO from '$lib/components/shared/SEO.svelte';
	import ConstellationDivider from '$lib/components/shared/ConstellationDivider.svelte';
	import { Button } from '$lib/components/ui/button';
	import { HelpCircle, Rocket } from '@lucide/svelte';

	// Single source of truth for both the rendered FAQ list and the FAQPage JSON-LD,
	// so the structured data Google/Claude/Gemini see always matches the visible page.
	const faqs: { question: string; answer: string }[] = [
		{
			question: 'What is an AI choose-your-own-adventure?',
			answer:
				'An AI choose-your-own-adventure is an interactive story written on demand by an AI, where the reader is presented with choices at key moments and the story branches based on what they pick. Cosmonaut takes a one-line idea from you - a setting, character, or favorite book - and writes a fully fleshed-out branching story you can step inside, with every decision shaping what happens next.'
		},
		{
			question: 'Can Cosmonaut write a custom AI bedtime story for my kid?',
			answer:
				'Yes. Describe what your child loves (dinosaurs, knights, friendly dragons, a particular book character) and Cosmonaut will write a calm, age-appropriate bedtime story with branching choices. You can set the vocabulary level and enable content filters. On the Cosmonaut tier, you can also add voice narration so the story can be listened to like an audiobook.'
		},
		{
			question: 'Is Cosmonaut family-friendly and safe for kids?',
			answer:
				'Yes. Cosmonaut is explicitly built as a family-friendly platform. There are no roleplay, adult, or NSFW modes. Parents can set vocabulary levels, enable content filters, and review stories before sharing. There are no points, streaks, or autoplay - the platform is intentionally designed to be put down, not scrolled. Cosmonaut is meant to be used by parents and kids together, not as solo screen time.'
		},
		{
			question: 'What ages is Cosmonaut for?',
			answer:
				'Cosmonaut is designed for families with kids roughly ages 6 and up, and works equally well for teens and adults reading their own stories. Children under 13 should always use Cosmonaut together with a parent or guardian - the platform is built for shared family reading time, not solo use by younger children. Vocabulary controls let you tune the reading level: simpler prose for early readers, richer literary prose for adults.'
		},
		{
			question: 'Can the AI stories be read aloud or narrated?',
			answer:
				'Yes. Audio narration is a Cosmonaut-tier feature: on the Cosmonaut plan, every chapter can be narrated aloud with high-quality voices, so stories can be listened to like an audiobook. This makes it ideal for bedtime - a parent can read the opening together with their child, then let narration carry the story while they sit alongside.'
		},
		{
			question: 'How is Cosmonaut different from other AI story tools?',
			answer:
				'Cosmonaut is a literary, prose-first interactive fiction platform - not a roleplay chatbot and not a gamified RPG. There are no stats, levels, inventory, or combat mechanics. Stories are written as proper chapters with consistent tone and tracked branching, so paths stay coherent. It is built for families to read together, with parental controls front and center.'
		},
		{
			question: 'Can I base a story on a book, movie, or character my family loves?',
			answer:
				'Yes. A great way to start is with a familiar inspiration - "a story like Narnia but set in the desert", "a mystery in the world of Sherlock Holmes for ages 8", or "a bedtime story about my favorite picture-book hero". Cosmonaut takes that seed and writes an original branching adventure inspired by the tone and setting you described.'
		},
		{
			question: 'Do I need to write the story myself?',
			answer:
				'No. You only provide the initial idea - sometimes just a sentence. Cosmonaut writes the full prose, presents you with choices, and writes whatever comes next based on what you pick. You can also write a custom action at any choice point if none of the presented options is what you wanted to do.'
		},
		{
			question: 'How does pricing work?',
			answer:
				'Cosmonaut has a free tier so you can try it before paying. The Explorer tier expands monthly story creation limits, and the top Cosmonaut tier adds audio narration on top of an even larger monthly story allowance. All paid plans are billed monthly through Stripe; you can change or cancel anytime. See the pricing page for current tiers.'
		},
		{
			question: 'Does Cosmonaut work on mobile?',
			answer:
				'Yes. Cosmonaut works in any modern browser on phone, tablet, or desktop, and there is also a native Android app for a more polished mobile experience. (No iOS app yet.) You can open a story on a phone at bedtime and pick it up on a laptop the next day - your stories sync across devices.'
		}
	];

	const faqJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqs.map((f) => ({
			'@type': 'Question',
			name: f.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: f.answer
			}
		}))
	};
</script>

<SEO
	title="FAQ - AI Choose-Your-Own-Adventure & Bedtime Stories | Cosmonaut"
	description="Answers to common questions about Cosmonaut: AI choose-your-own-adventure stories, custom AI bedtime stories, narration, family-friendly content, ages, pricing, and how it compares to other AI story tools."
	path="/faq"
	jsonLd={faqJsonLd}
/>

<div class="h-full overflow-y-auto bg-background">
	<main class="mx-auto max-w-3xl px-6 py-12">
		<header class="mb-8 text-center">
			<div
				class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10"
			>
				<HelpCircle class="h-8 w-8 text-primary" />
			</div>
			<h1 class="text-4xl font-bold text-foreground">Frequently Asked Questions</h1>
			<p class="mt-4 text-lg text-muted-foreground">
				Everything you might want to know about AI choose-your-own-adventure stories, AI bedtime
				stories, and using Cosmonaut with your family.
			</p>
		</header>

		<ConstellationDivider />

		<section class="mt-8 space-y-8" aria-label="Frequently asked questions">
			{#each faqs as faq, i (i)}
				<article class="rounded-lg border border-border/50 bg-card/50 p-6">
					<h2 class="mb-3 text-xl font-semibold text-foreground">
						{faq.question}
					</h2>
					<p class="leading-relaxed text-muted-foreground">{faq.answer}</p>
				</article>
			{/each}
		</section>

		<ConstellationDivider class="mt-12" />

		<section class="mt-8 text-center">
			<h2 class="mb-3 text-2xl font-semibold text-foreground">Ready to start a story?</h2>
			<p class="mx-auto mb-6 max-w-xl text-muted-foreground">
				Describe a world, step inside, and see where your choices take you.
			</p>
			<Button size="lg" class="gap-2" href="/login">
				<Rocket class="h-5 w-5" />
				Begin Your Journey
			</Button>
			<p class="mt-6 text-sm text-muted-foreground">
				Still have a question? Email
				<a
					href="mailto:support@cosmonaut-ai.com"
					class="text-primary underline underline-offset-4 hover:text-primary/80"
				>
					support@cosmonaut-ai.com
				</a>
				- we read every message.
			</p>
		</section>
	</main>
</div>
