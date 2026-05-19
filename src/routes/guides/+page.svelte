<script lang="ts">
	import SEO from '$lib/components/shared/SEO.svelte';
	import { ArrowRight } from '@lucide/svelte';
	import { GUIDES, BLOG_ID, ORG_ID, WEBSITE_ID } from '$lib/seo/guides';

	const guides = [
		{
			href: '/ai-choose-your-own-adventure',
			eyebrow: 'Form',
			title: 'AI choose-your-own-adventure, in a longer lineage',
			dek: 'The format started with a paperback in 1979. Forty-some years later, a generation of readers is meeting it again - this time with a story that remembers them.',
			readTime: '6 min read'
		},
		{
			href: '/ai-bedtime-stories',
			eyebrow: 'Family',
			title: 'A bedtime story that gets to know your kid',
			dek: 'On the easy nights and the difficult ones, what we want is a story that meets a child where they are. Here is what that looks like, and how we built it.',
			readTime: '5 min read'
		},
		{
			href: '/ai-interactive-fiction',
			eyebrow: 'Craft',
			title: 'Interactive fiction for readers',
			dek: 'Most "AI story" tools want to be chatbots. Cosmonaut wants to be a book you can step inside - prose-first, no stats, no grind, written for grown readers.',
			readTime: '7 min read'
		}
	];

	const blogJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Blog',
		'@id': BLOG_ID,
		url: 'https://cosmonaut-ai.com/guides/',
		name: 'Cosmonaut Guides',
		description:
			'Essays on AI choose-your-own-adventure stories, custom AI bedtime stories, and interactive fiction for readers - from the team behind Cosmonaut.',
		inLanguage: 'en',
		isPartOf: { '@id': WEBSITE_ID },
		publisher: { '@id': ORG_ID },
		blogPost: GUIDES.map((g) => ({
			'@type': 'BlogPosting',
			'@id': g.id,
			url: g.url,
			headline: g.headline,
			description: g.description,
			datePublished: g.datePublished,
			dateModified: g.dateModified,
			inLanguage: 'en',
			author: { '@id': ORG_ID },
			publisher: { '@id': ORG_ID },
			mainEntityOfPage: g.url
		}))
	};
</script>

<SEO
	title="Guides | Cosmonaut"
	description="Essays on AI choose-your-own-adventure stories, custom AI bedtime stories, and interactive fiction for readers - from the team behind Cosmonaut."
	path="/guides"
	ogImageAlt="Cosmonaut Guides - essays on AI interactive fiction and family storytelling"
	jsonLd={blogJsonLd}
/>

<div class="h-full overflow-y-auto bg-background">
	<main class="mx-auto max-w-3xl px-6 py-16">
		<header class="mb-16">
			<p class="mb-3 text-xs font-medium tracking-[0.2em] text-primary uppercase">Guides</p>
			<h1 class="font-serif text-4xl leading-tight font-semibold text-foreground sm:text-5xl">
				Notes on the kind of stories Cosmonaut writes.
			</h1>
			<p class="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
				A small collection of essays on AI choose-your-own-adventure, family bedtime reading, and
				interactive fiction. Written by the people building Cosmonaut.
			</p>
		</header>

		<ul class="divide-y divide-border/60 border-y border-border/60">
			{#each guides as guide (guide.href)}
				<li>
					<a
						href={guide.href}
						class="group flex flex-col gap-3 py-8 transition-colors hover:bg-muted/30 sm:flex-row sm:items-baseline sm:justify-between sm:gap-12"
					>
						<div class="flex-1">
							<p class="mb-2 text-[10px] font-medium tracking-[0.2em] text-primary/80 uppercase">
								{guide.eyebrow}
							</p>
							<h2
								class="font-serif text-2xl leading-tight font-medium text-foreground transition-colors group-hover:text-primary sm:text-3xl"
							>
								{guide.title}
							</h2>
							<p class="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
								{guide.dek}
							</p>
						</div>
						<div
							class="flex shrink-0 items-center gap-3 text-xs text-muted-foreground/70 sm:flex-col sm:items-end sm:gap-2"
						>
							<span>{guide.readTime}</span>
							<ArrowRight
								class="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:text-primary"
							/>
						</div>
					</a>
				</li>
			{/each}
		</ul>

		<footer class="mt-16 text-sm text-muted-foreground">
			<p>
				Got an idea for what we should write about next?
				<a
					href="mailto:support@cosmonaut-ai.com"
					class="text-primary underline underline-offset-4 hover:text-primary/80"
				>
					Tell us.
				</a>
			</p>
		</footer>
	</main>
</div>
