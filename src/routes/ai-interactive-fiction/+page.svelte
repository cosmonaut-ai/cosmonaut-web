<script lang="ts">
	import SEO from '$lib/components/shared/SEO.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowRight } from '@lucide/svelte';
	import { getGuide, BLOG_ID, ORG_ID } from '$lib/seo/guides';

	const guide = getGuide('ai-interactive-fiction');

	const jsonLd = {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'BlogPosting',
				'@id': guide.id,
				headline: guide.headline,
				description: guide.description,
				url: guide.url,
				datePublished: guide.datePublished,
				dateModified: guide.dateModified,
				inLanguage: 'en',
				image: 'https://cosmonaut-ai.com/og-image.png',
				isPartOf: { '@id': BLOG_ID },
				mainEntityOfPage: guide.url,
				author: { '@id': ORG_ID },
				publisher: { '@id': ORG_ID }
			},
			{
				'@type': 'BreadcrumbList',
				itemListElement: [
					{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://cosmonaut-ai.com/' },
					{
						'@type': 'ListItem',
						position: 2,
						name: 'Guides',
						item: 'https://cosmonaut-ai.com/guides/'
					},
					{
						'@type': 'ListItem',
						position: 3,
						name: 'AI Interactive Fiction',
						item: guide.url
					}
				]
			}
		]
	};
</script>

<SEO
	title="Interactive fiction for readers | Cosmonaut Guides"
	description="An essay on AI interactive fiction as a literary form - why Cosmonaut is prose-first rather than chat-first, and what makes a branching story worth reading."
	path="/ai-interactive-fiction"
	ogImageAlt="AI interactive fiction - literary branching stories from Cosmonaut"
	{jsonLd}
/>

<div class="h-full overflow-y-auto bg-background">
	<article class="mx-auto max-w-2xl px-6 py-16">
		<nav
			class="mb-10 flex items-center gap-2 text-xs text-muted-foreground/80"
			aria-label="Breadcrumb"
		>
			<a href="/guides" class="transition-colors hover:text-foreground">Guides</a>
			<span aria-hidden="true">/</span>
			<span class="text-foreground/70">Craft</span>
		</nav>

		<header class="mb-12">
			<h1
				class="font-serif text-4xl leading-[1.15] font-semibold text-foreground sm:text-[2.75rem]"
			>
				Interactive fiction for readers.
			</h1>
			<p class="mt-5 text-base text-muted-foreground/80">
				Most "AI story" tools want to be chatbots. We want Cosmonaut to be a book you can step
				inside.
			</p>
		</header>

		<div
			class="prose prose-lg max-w-none font-serif text-foreground/90 prose-invert prose-headings:font-serif prose-headings:text-foreground prose-p:leading-[1.7] prose-p:text-foreground/85 prose-strong:text-foreground"
		>
			<p>
				Interactive fiction is older than computers. Calvino's <em
					>If on a winter's night a traveler</em
				> reads like a hypertext novel written in 1979. Borges spent a career writing stories about the
				kind of stories he could not quite write. Long before either of them, oral storytellers were stopping
				at firesides to ask the listening children what the hero ought to do next, and revising in real
				time.
			</p>
			<p>
				The form has a name in literary studies - ergodic literature, after the Greek for "work" and
				"path." The defining feature is that the reader does non-trivial work to traverse the text.
				Not in the way every reader works - eyes moving, mind constructing - but in a way the book
				itself acknowledges. The book hands the reader something to do, and the reading changes
				because of it.
			</p>

			<h2 class="mt-10 mb-4 text-xl font-semibold">Where the AI ones usually go wrong</h2>
			<p>
				When you ask a language model to generate a story, by default you get something that reads
				like a transcript. The model writes a paragraph. You type a reply. The model writes another
				paragraph. The result is a conversation about a story, not a story. There's no narrator with
				a voice. There's no shape. There's no chapter that ends well, because the model is not
				really writing chapters - it's responding.
			</p>
			<p>
				The other failure mode is gamification. You wind up with stats and inventory and HP bars and
				combat rolls. The story becomes a thin layer of flavor over a mechanic. This is fine for
				what it is, and there are people who love it, but it is a different thing than reading a
				book.
			</p>

			<h2 class="mt-10 mb-4 text-xl font-semibold">What Cosmonaut tries to be instead</h2>
			<p>
				Cosmonaut is prose-first. Each branch of the story is a fully written chapter, in a
				consistent voice, paced toward a decision point the way a chapter is paced toward a hook.
				Between choices, you are reading. Not chatting. Not selecting actions from a menu. Just
				reading the kind of prose you would read in a paperback you actually liked.
			</p>
			<p>
				There are no stats. No grind. No autoplay. The map of the story is visible whenever you want
				it. You can write a custom action when the presented choices don't match what you meant to
				do, and the story will continue from there in the same voice. That is the baseline;
				everything else is restraint.
			</p>

			<h2 class="mt-10 mb-4 text-xl font-semibold">What it is good for</h2>
			<p>A short list, from people we have watched use it:</p>
			<ul class="my-6 space-y-2 pl-5 text-foreground/85">
				<li>
					Cozy mysteries. A small village, a strange disappearance, a curious narrator with the
					patience to wait for you.
				</li>
				<li>
					Historical fiction. A 1920s Paris adventure that knows what year it is and what year it
					isn't.
				</li>
				<li>Soft science fiction. A generation ship with a quiet secret in its archive.</li>
				<li>Literary fantasy. An empire built on the bones of a sleeping god.</li>
				<li>Coming-of-age. A teen apprentice mapmaker on a first commission.</li>
			</ul>
			<p>
				Cosmonaut is family-friendly by default, but it is not <em>only</em> for kids. Adults are welcome
				to use it for their own reading, at their own pace, in their own genres. The vocabulary controls
				work in both directions.
			</p>
		</div>

		<!-- Soft CTA -->
		<footer class="mt-16 flex flex-col items-start gap-4 border-t border-border/60 pt-10">
			<Button href="/login" class="gap-2">
				Begin reading
				<ArrowRight class="h-4 w-4" />
			</Button>
			<p class="text-sm text-muted-foreground">
				Or
				<a
					href="/ai-choose-your-own-adventure"
					class="text-primary underline underline-offset-4 hover:text-primary/80"
				>
					read about the choose-your-own-adventure form
				</a>.
			</p>
		</footer>
	</article>
</div>
