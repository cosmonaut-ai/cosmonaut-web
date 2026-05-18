<script lang="ts">
	import SEO from '$lib/components/shared/SEO.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowRight } from '@lucide/svelte';

	const jsonLd = {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'Article',
				'@id': 'https://cosmonaut-ai.com/ai-bedtime-stories/#article',
				headline: 'A bedtime story that gets to know your kid',
				description:
					'A short essay on custom AI bedtime stories, what one looks like in practice, and how Cosmonaut writes them.',
				url: 'https://cosmonaut-ai.com/ai-bedtime-stories/',
				inLanguage: 'en',
				isPartOf: { '@id': 'https://cosmonaut-ai.com/#website' },
				author: { '@id': 'https://cosmonaut-ai.com/#organization' },
				publisher: { '@id': 'https://cosmonaut-ai.com/#organization' }
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
						name: 'AI Bedtime Stories',
						item: 'https://cosmonaut-ai.com/ai-bedtime-stories/'
					}
				]
			}
		]
	};
</script>

<SEO
	title="A bedtime story that gets to know your kid | Cosmonaut Guides"
	description="A short essay on custom AI bedtime stories - what one looks like in practice, how Cosmonaut writes them, and why we build for families to read together."
	path="/ai-bedtime-stories"
	ogImageAlt="AI bedtime stories from Cosmonaut - for parents and kids to read together"
	{jsonLd}
/>

<div class="h-full overflow-y-auto bg-background">
	<article class="mx-auto max-w-2xl px-6 py-16">
		<!-- Eyebrow + crumb -->
		<nav
			class="mb-10 flex items-center gap-2 text-xs text-muted-foreground/80"
			aria-label="Breadcrumb"
		>
			<a href="/guides" class="transition-colors hover:text-foreground">Guides</a>
			<span aria-hidden="true">/</span>
			<span class="text-foreground/70">Family</span>
		</nav>

		<header class="mb-12">
			<h1
				class="font-serif text-4xl leading-[1.15] font-semibold text-foreground sm:text-[2.75rem]"
			>
				A bedtime story that gets to know your kid.
			</h1>
			<p class="mt-5 text-base text-muted-foreground/80">
				On custom AI bedtime stories, and what one actually looks like in practice.
			</p>
		</header>

		<div
			class="prose prose-lg max-w-none font-serif text-foreground/90 prose-invert prose-headings:font-serif prose-headings:text-foreground prose-p:leading-[1.7] prose-p:text-foreground/85 prose-strong:text-foreground"
		>
			<p>
				It is 7:42 on a Tuesday. The kid has had a long day - a tooth came out at lunch, there was a
				problem at recess, the bath was negotiated rather than given. On the way upstairs she picks
				a topic out of the air: a fox who can't find their den.
			</p>
			<p>
				You open Cosmonaut on your phone. You type four words. By the time the lamp is on and the
				covers are turned down, the story is waiting.
			</p>

			<p class="text-foreground/70">Here is what one of those stories sounds like.</p>
		</div>

		<!-- Story excerpt -->
		<figure class="my-14">
			<div
				class="relative rounded-lg border-l-2 border-primary/40 bg-card/40 px-6 py-8 sm:px-10 sm:py-10"
			>
				<p class="mb-1 text-[10px] font-medium tracking-[0.2em] text-primary/70 uppercase">
					From the story
				</p>
				<p class="mb-6 font-serif text-xl text-foreground/85 italic">
					The Fox Who Couldn't Find Their Den
				</p>
				<div
					class="space-y-4 font-serif text-base leading-[1.75] text-foreground/85 sm:text-[17px]"
				>
					<p>
						The snow had been falling since just after lunch, and by the time the small fox realized
						she could no longer see the shape of the cedar tree she usually turned at, the world had
						become a single soft, white room with no walls.
					</p>
					<p>
						She sat down. The snow was the cold kind that did not melt under her, only got colder.
					</p>
					<p>
						"I'll just wait," she said out loud, mostly so she would have a voice nearby. The wind
						did not answer. A wren did, somewhere overhead, but the wren did not know where her den
						was either.
					</p>
					<p>
						After a while, the fox stood up. She decided she would walk - not because she knew which
						way to walk, but because sitting down had not been useful, and sometimes you have to try
						the next thing.
					</p>
					<p>
						She walked until she came to a place where the snow had been disturbed. Tracks - but not
						her own. They were larger than hers. They were shaped a little like hers. They led in
						two different directions.
					</p>
				</div>

				<div class="mt-8 border-t border-border/50 pt-6">
					<p
						class="mb-3 text-[10px] font-medium tracking-[0.2em] text-muted-foreground/70 uppercase"
					>
						What does the fox do?
					</p>
					<ul class="space-y-2 font-serif text-[15px] text-foreground/80">
						<li class="flex gap-3">
							<span class="text-primary/60">›</span>
							<span>Follow the larger tracks deeper into the woods.</span>
						</li>
						<li class="flex gap-3">
							<span class="text-primary/60">›</span>
							<span>Call out, in case someone is nearby.</span>
						</li>
						<li class="flex gap-3">
							<span class="text-primary/60">›</span>
							<span>Turn around and look for her own tracks under the new snow.</span>
						</li>
					</ul>
				</div>
			</div>
			<figcaption class="mt-3 text-xs text-muted-foreground/60">
				A representative excerpt. Each story Cosmonaut writes is unique to the prompt and the
				reader's choices.
			</figcaption>
		</figure>

		<div
			class="prose prose-lg max-w-none font-serif text-foreground/90 prose-invert prose-headings:font-serif prose-headings:text-foreground prose-p:leading-[1.7] prose-p:text-foreground/85 prose-strong:text-foreground"
		>
			<p>Three things are quietly happening on that page.</p>
			<p>
				The first is that the story knows your child. You typed four words, but Cosmonaut also knows
				the reading level you set, the kinds of stories your family tends toward, and the content
				filters you've turned on. A six-year-old gets the prose you just read. A nine-year-old gets
				a richer version with longer sentences and more weather in it. The hook is the same; the
				cloth is different.
			</p>
			<p>
				The second is that the choices matter. They are not three flavors of the same outcome.
				Following the larger tracks goes somewhere; calling out goes somewhere else; turning back
				goes somewhere else again. Cosmonaut remembers what your child picked, so a choice made on
				page three is still true on page seven. That is the difference between a branching story and
				a chat transcript.
			</p>
			<p>
				The third is harder to put in a feature list. Bedtime stories work when they have a shape -
				when there is a problem and a search and an ending. We tune Cosmonaut for that shape, so the
				story your kid hears tonight is the kind of story you would have wanted someone to tell you.
			</p>

			<h2 class="mt-12 mb-4 text-xl font-semibold">A few practical notes</h2>
			<p>
				The free tier is enough to try a bedtime story or two; the Explorer tier opens up more
				stories per month; the top Cosmonaut tier adds audio narration, with warm, natural voices
				that can carry a chapter while you sit alongside your child. Vocabulary level and content
				filters are settings, not paid features - they're available from the moment you sign up.
			</p>

			<h2 class="mt-10 mb-4 text-xl font-semibold">A note on how we mean this to be used</h2>
			<p>
				Cosmonaut is built to be used together. It is a thing parents and kids do side by side at
				bedtime, not a thing a child uses alone with a screen. Children under 13 should always read
				on Cosmonaut with a parent or guardian. We don't autoplay the next chapter, we don't push
				notifications, and there's no feed to scroll past your kid's choice. The story waits. That
				is on purpose.
			</p>
		</div>

		<!-- Soft CTA -->
		<footer class="mt-16 flex flex-col items-start gap-4 border-t border-border/60 pt-10">
			<Button href="/login" class="gap-2">
				Start a bedtime story
				<ArrowRight class="h-4 w-4" />
			</Button>
			<p class="text-sm text-muted-foreground">
				Or
				<a href="/guides" class="text-primary underline underline-offset-4 hover:text-primary/80">
					read another guide
				</a>.
			</p>
		</footer>
	</article>
</div>
