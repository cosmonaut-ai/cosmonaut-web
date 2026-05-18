<script lang="ts">
	import SEO from '$lib/components/shared/SEO.svelte';
	import { Button } from '$lib/components/ui/button';
	import { ArrowRight } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import type { Component } from 'svelte';

	// Mock story map: a small kid-friendly mystery used to illustrate branching.
	const mapNodes = [
		{
			id: 'n1',
			title: 'The Letter in the Attic',
			summary: 'A folded envelope, dated 1923.',
			isRoot: true
		},
		{ id: 'n2', title: 'Read it carefully', summary: 'It is from a lighthouse keeper.' },
		{ id: 'n3', title: 'Take it to your grandmother', summary: 'She goes very quiet.' },
		{
			id: 'n4',
			title: 'Find the lighthouse on a map',
			summary: 'It is still standing.',
			isLeaf: true
		},
		{
			id: 'n5',
			title: 'Sit with her until she speaks',
			summary: '"I was waiting for this."',
			isLeaf: true
		},
		{
			id: 'n6',
			title: 'Ask why she went so still',
			summary: 'She does not answer right away.',
			isLeaf: true
		}
	];
	const mapEdges = [
		{ source: 'n1', target: 'n2' },
		{ source: 'n1', target: 'n3' },
		{ source: 'n2', target: 'n4' },
		{ source: 'n3', target: 'n5' },
		{ source: 'n3', target: 'n6' }
	];
	const mapPositions = {
		n1: { x: 200, y: 0 },
		n2: { x: 0, y: 130 },
		n3: { x: 400, y: 130 },
		n4: { x: 0, y: 280 },
		n5: { x: 320, y: 280 },
		n6: { x: 540, y: 280 }
	};

	// SvelteFlow uses browser-only APIs; lazy-load on the client.
	let StoryMapPreview = $state<Component<{
		nodes: typeof mapNodes;
		edges: typeof mapEdges;
		positions: typeof mapPositions;
	}> | null>(null);

	onMount(async () => {
		const mod = await import('$lib/components/shared/StoryMapPreview.svelte');
		StoryMapPreview = mod.default as never;
	});

	const jsonLd = {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'Article',
				'@id': 'https://cosmonaut-ai.com/ai-choose-your-own-adventure/#article',
				headline: 'AI choose-your-own-adventure, in a longer lineage',
				description:
					'A short essay on the choose-your-own-adventure form, from the 1979 paperbacks to the AI-written branching stories Cosmonaut writes today.',
				url: 'https://cosmonaut-ai.com/ai-choose-your-own-adventure/',
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
						name: 'AI Choose-Your-Own-Adventure',
						item: 'https://cosmonaut-ai.com/ai-choose-your-own-adventure/'
					}
				]
			}
		]
	};
</script>

<SEO
	title="AI choose-your-own-adventure, in a longer lineage | Cosmonaut Guides"
	description="A short essay on the choose-your-own-adventure form, from the 1979 paperbacks to the AI-written branching stories Cosmonaut writes for families today."
	path="/ai-choose-your-own-adventure"
	ogImageAlt="AI choose-your-own-adventure - branching interactive stories from Cosmonaut"
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
			<span class="text-foreground/70">Form</span>
		</nav>

		<header class="mb-12">
			<h1
				class="font-serif text-4xl leading-[1.15] font-semibold text-foreground sm:text-[2.75rem]"
			>
				AI choose-your-own-adventure, in a longer lineage.
			</h1>
			<p class="mt-5 text-base text-muted-foreground/80">
				The format started with a paperback in 1979. Forty-some years later, a generation of readers
				is meeting it again - this time with a story that remembers them.
			</p>
		</header>

		<div
			class="prose prose-lg max-w-none font-serif text-foreground/90 prose-invert prose-headings:font-serif prose-headings:text-foreground prose-p:leading-[1.7] prose-p:text-foreground/85 prose-strong:text-foreground"
		>
			<p>
				In 1976, a New Jersey lawyer named Edward Packard wrote down a story for his daughters in
				which they could choose what happened next. He had been telling them stories like that out
				loud for years - at a certain point in the plot he would stop, and ask, and they would
				decide. He just hadn't thought of it as a book.
			</p>
			<p>
				A few years later, Bantam picked the idea up and started a series of orange-spined
				paperbacks called Choose Your Own Adventure. <em>The Cave of Time</em>.
				<em>Journey Under the Sea</em>. <em>By Balloon to the Sahara</em>. A whole generation read
				them with both thumbs jammed into the book at once - one holding the page you were about to
				choose, the other holding the page you might choose instead, in case the first one ended in
				being eaten.
			</p>
			<p>
				What worked about them, then and now, is the small adult feeling of being addressed. The
				story stops, looks at the reader, and says: I'd like to know what you think. It is the
				opposite of being told a story <em>at</em>. It is being told a story <em>with</em>.
			</p>

			<h2 class="mt-10 mb-4 text-xl font-semibold">What's different about an AI one</h2>
			<p>
				The Bantam paperbacks were brilliant inside a constraint: a finite tree of pages, printed
				once. Every branch had to exist before you opened the book. The author worked out the
				skeleton in advance and rationed pages to each path - which is why some endings felt thin,
				and why your second read-through hit the same paragraphs as your first.
			</p>
			<p>
				An AI choose-your-own-adventure doesn't have that constraint. Cosmonaut writes each branch
				when you ask for it, in the same voice, with the same characters, in the same world. The
				path you pick becomes a chapter that didn't exist five seconds ago and won't exist for
				anyone else. The tree is as deep as you want to go.
			</p>
			<p>
				And, critically, it remembers. A choice you made on the second page is still true on the
				ninth. The shopkeeper who saw you palm an apple in chapter three recognizes you in chapter
				six. That continuity is the thing that turns a branching exercise into a real story.
			</p>
		</div>

		<!-- Story map preview -->
		<figure class="my-14">
			<p class="mb-3 text-[10px] font-medium tracking-[0.2em] text-primary/70 uppercase">
				What a small story looks like
			</p>
			{#if StoryMapPreview}
				<StoryMapPreview nodes={mapNodes} edges={mapEdges} positions={mapPositions} />
			{:else}
				<div
					class="flex h-[420px] w-full items-center justify-center rounded-lg border border-border/60 bg-card/30 text-sm text-muted-foreground"
					aria-hidden="true"
				>
					Loading story map…
				</div>
			{/if}
			<figcaption class="mt-3 text-xs text-muted-foreground/60">
				A real story map from a six-node mystery for ages 8 and up. Every story you start with
				Cosmonaut grows into a map like this one - and you can see it whole at any time.
			</figcaption>
		</figure>

		<div
			class="prose prose-lg max-w-none font-serif text-foreground/90 prose-invert prose-headings:font-serif prose-headings:text-foreground prose-p:leading-[1.7] prose-p:text-foreground/85 prose-strong:text-foreground"
		>
			<h2 class="mt-2 mb-4 text-xl font-semibold">For families</h2>
			<p>
				The best way to use Cosmonaut, in our biased opinion, is the way Edward Packard used the
				form in the first place: out loud, with a kid. Set up a story together. Read the chapter
				aloud. Argue about the choice. See where you end up. On the Cosmonaut tier, audio narration
				will read the chapter for you, so you can listen along instead of holding a phone.
			</p>
			<p>
				Cosmonaut is meant to be a shared activity, not solo screen time for a young reader.
				Children under 13 should always use it with a parent or guardian. There is no NSFW mode, no
				adult roleplay, no infinite feed - the story waits politely for the next person to look at
				it.
			</p>
		</div>

		<!-- Soft CTA -->
		<footer class="mt-16 flex flex-col items-start gap-4 border-t border-border/60 pt-10">
			<Button href="/login" class="gap-2">
				Start your first story
				<ArrowRight class="h-4 w-4" />
			</Button>
			<p class="text-sm text-muted-foreground">
				Or
				<a
					href="/ai-bedtime-stories"
					class="text-primary underline underline-offset-4 hover:text-primary/80"
				>
					read about bedtime stories
				</a>.
			</p>
		</footer>
	</article>
</div>
