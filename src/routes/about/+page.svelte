<script lang="ts">
	import SEO from '$lib/components/shared/SEO.svelte';
	import ConstellationDivider from '$lib/components/shared/ConstellationDivider.svelte';
</script>

<SEO
	title="About Cosmonaut - Interactive Storytelling Platform"
	description="Cosmonaut AI is an interactive storytelling platform where every choice shapes the narrative. Built for families, powered by AI."
	path="/about"
	jsonLd={{
		'@context': 'https://schema.org',
		'@type': 'AboutPage',
		'@id': 'https://cosmonaut-ai.com/about/#aboutpage',
		url: 'https://cosmonaut-ai.com/about/',
		name: 'About Cosmonaut',
		description:
			'About Cosmonaut: an AI interactive storytelling platform where every choice shapes the narrative, built for families by Matson Software LLC.',
		inLanguage: 'en',
		isPartOf: { '@id': 'https://cosmonaut-ai.com/#website' },
		mainEntity: { '@id': 'https://cosmonaut-ai.com/#organization' }
	}}
/>

<div class="h-full overflow-y-auto bg-background">
	<article class="mx-auto max-w-2xl px-6 py-16">
		<header class="mb-12">
			<p class="mb-3 text-xs font-medium tracking-[0.2em] text-primary uppercase">About</p>
			<h1
				class="font-serif text-4xl leading-[1.15] font-semibold text-foreground sm:text-[2.75rem]"
			>
				Interactive storytelling where every choice shapes the story.
			</h1>
		</header>

		<div
			class="prose prose-lg max-w-none font-serif text-foreground/90 prose-invert prose-headings:font-serif prose-headings:text-foreground prose-p:leading-[1.7] prose-p:text-foreground/85 prose-strong:text-foreground"
		>
			<h2 class="mb-4 text-2xl font-semibold">What is Cosmonaut?</h2>
			<p>
				Cosmonaut AI is an interactive storytelling platform that lets you create, explore, and
				shape unique stories. You simply describe a world, characters, or setting, or even base it
				off of a movie or book, and Cosmonaut's AI will generate an interactive story for you.
			</p>
			<p>
				There are a couple of similar concepts out there, so we'll save you some time and cut to
				some of the things we really care about:
			</p>
			<ul class="my-6 list-disc space-y-3 pl-6">
				<li>
					<strong>Branching storylines and narrative consistency.</strong> We want to allow users to explore
					multiple paths in a story, but also ensure that the story is consistent and coherent across
					all paths.
				</li>
				<li>
					<strong>Minimize distraction and gamification.</strong> Technology is great, but there are a
					wealth of studies that demonstrate the negative impact that excess exposure can have on both
					children and adults. We want to create a platform that harkens back to the days of reading choose-your-own-adventure
					books with the family and deepens relationships, not just provides entertainment.
				</li>
				<li>
					<strong>Parental control.</strong> We want parents to feel confident about the content their
					children are consuming. It's a terrible experience to be halfway through a story and have to
					stop and explain to your child that the story is not appropriate for them or that it's too scary.
					We've added in customizable vocabulary levels and content filters to ensure that the story is
					appropriate for the user's age and sensitivity.
				</li>
			</ul>

			<ConstellationDivider class="my-12" />

			<h2 class="mb-4 text-2xl font-semibold">How it works</h2>
			<p>
				Start with a prompt - a setting, a character, a mood, or even a book or movie you love.
				Cosmonaut turns that seed into a richly written story, then hands control back to you. At
				key moments, you choose what happens next. The story branches and remembers your decisions,
				so the story stays coherent no matter which path you take.
			</p>
			<p>
				We're deliberate about pacing. There's no autoplay, no feed to scroll, no points to collect.
				You read a chapter, make a choice, and put it down. Come back when you're ready - the story
				waits.
			</p>

			<ConstellationDivider class="my-12" />

			<h2 class="mb-4 text-2xl font-semibold">Built for families</h2>
			<p>
				Cosmonaut works best as something you do together. Set up a story based on a book your kid
				loves, or a genre they've been curious about, then read through it side by side - debating
				choices, taking turns, seeing what happens. It's closer to a board game night than putting
				on a show.
			</p>
			<p>
				That said, it works just as well solo. Adults use it too - for their own stories, their own
				genres, their own pace. The parental controls are there when you need them, and out of the
				way when you don't.
			</p>
		</div>

		<footer class="mt-16 border-t border-border/60 pt-10">
			<h2 class="mb-2 font-serif text-xl font-semibold text-foreground">Say hello</h2>
			<p class="mb-4 leading-relaxed text-muted-foreground">
				We're a small team and we genuinely read every message. Questions, feedback, story ideas,
				complaints - all welcome.
			</p>
			<a
				href="mailto:support@cosmonaut-ai.com"
				class="text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
			>
				support@cosmonaut-ai.com
			</a>
			<p class="mt-6 text-sm text-muted-foreground">
				Cosmonaut is built by
				<strong class="text-foreground">Matson Software LLC</strong>.
			</p>
		</footer>
	</article>
</div>
