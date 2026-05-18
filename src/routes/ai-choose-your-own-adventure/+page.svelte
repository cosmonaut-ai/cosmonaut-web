<script lang="ts">
	import SEO from '$lib/components/shared/SEO.svelte';
	import ConstellationDivider from '$lib/components/shared/ConstellationDivider.svelte';
	import { Button } from '$lib/components/ui/button';
	import { GitBranch, Rocket, ShieldCheck, BookOpen, Sparkles } from '@lucide/svelte';

	const jsonLd = {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebPage',
				'@id': 'https://cosmonaut-ai.com/ai-choose-your-own-adventure/#webpage',
				url: 'https://cosmonaut-ai.com/ai-choose-your-own-adventure/',
				name: 'AI Choose-Your-Own-Adventure Stories for Families',
				description:
					'Cosmonaut is an AI choose-your-own-adventure platform. Describe any world and Cosmonaut writes a branching, family-friendly interactive story shaped by your choices.',
				about: { '@id': 'https://cosmonaut-ai.com/#webapp' },
				isPartOf: { '@id': 'https://cosmonaut-ai.com/#website' }
			},
			{
				'@type': 'BreadcrumbList',
				itemListElement: [
					{
						'@type': 'ListItem',
						position: 1,
						name: 'Home',
						item: 'https://cosmonaut-ai.com/'
					},
					{
						'@type': 'ListItem',
						position: 2,
						name: 'AI Choose-Your-Own-Adventure',
						item: 'https://cosmonaut-ai.com/ai-choose-your-own-adventure/'
					}
				]
			}
		]
	};
</script>

<SEO
	title="AI Choose-Your-Own-Adventure Stories for Families | Cosmonaut"
	description="Create AI choose-your-own-adventure stories the whole family can read together. Describe any world and Cosmonaut writes a branching, family-friendly interactive story shaped by your choices."
	path="/ai-choose-your-own-adventure"
	ogImageAlt="AI choose-your-own-adventure stories for families"
	{jsonLd}
/>

<div class="h-full overflow-y-auto bg-background">
	<main class="mx-auto max-w-3xl px-6 py-12">
		<header class="mb-8 text-center">
			<div
				class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10"
			>
				<GitBranch class="h-8 w-8 text-primary" />
			</div>
			<h1 class="text-4xl font-bold text-foreground sm:text-5xl">
				AI Choose-Your-Own-Adventure Stories
			</h1>
			<p class="mt-4 text-lg text-muted-foreground">
				Family-friendly interactive fiction, written by AI, shaped by your choices.
			</p>
			<div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
				<Button size="lg" class="gap-2" href="/login">
					<Rocket class="h-5 w-5" />
					Start your first story
				</Button>
				<Button variant="ghost" size="lg" href="/faq">Read the FAQ</Button>
			</div>
		</header>

		<ConstellationDivider />

		<article class="mx-auto prose mt-8 max-w-none text-muted-foreground prose-invert">
			<section class="mb-10">
				<h2 class="mb-3 text-2xl font-semibold text-foreground">
					What is an AI choose-your-own-adventure?
				</h2>
				<p class="leading-relaxed">
					An AI choose-your-own-adventure is an interactive story written on demand by an AI, where
					the reader makes choices at key moments and the story branches based on what they pick.
					Unlike a static book, every path is generated as you read — and unlike a roleplay chatbot,
					the story is structured into proper chapters with a consistent tone, a tracked plot, and a
					visible map of every choice you have made.
				</p>
				<p class="mt-4 leading-relaxed">
					Cosmonaut takes a one-line idea from you — a setting, a character, a mood, or even a book
					or film you love — and turns it into a fully written branching story you can step inside.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="mb-3 text-2xl font-semibold text-foreground">
					Built for families, not for roleplay
				</h2>
				<p class="leading-relaxed">
					A lot of "AI story" tools are really roleplay chatbots aimed at adults, or gamified RPGs
					with stats and combat. Cosmonaut is neither. It is a literary, prose-first interactive
					fiction platform built for parents and kids to read together, with vocabulary level
					controls and content filters parents can trust.
				</p>
				<ul class="mt-4 list-disc space-y-2 pl-5">
					<li>No NSFW, roleplay, or adult content modes — ever.</li>
					<li>Parental controls for vocabulary level and content sensitivity.</li>
					<li>No points, streaks, autoplay, or infinite feed. Read a chapter, put it down.</li>
					<li>Original stories with literary tone — not chat transcripts.</li>
				</ul>
			</section>

			<section class="mb-10">
				<h2 class="mb-3 text-2xl font-semibold text-foreground">How it works</h2>
				<ol class="list-decimal space-y-3 pl-5 leading-relaxed">
					<li>
						<strong class="text-foreground">Describe your world.</strong> A genre, a setting, a character,
						or a book or movie that inspires you. One sentence is enough.
					</li>
					<li>
						<strong class="text-foreground">Cosmonaut writes the opening chapter.</strong>
						Fully written prose, in a consistent voice, ending at a decision point.
					</li>
					<li>
						<strong class="text-foreground">You choose what happens next.</strong> Pick a presented option,
						or write a custom action of your own.
					</li>
					<li>
						<strong class="text-foreground">The story branches and remembers.</strong> Every path is tracked
						on a visual story map; you can revisit earlier moments and explore the "what-ifs" you missed.
					</li>
					<li>
						<strong class="text-foreground">Optional narration.</strong> Paid tiers add voice narration
						so the story can be listened to like an audiobook.
					</li>
				</ol>
			</section>

			<section class="mb-10">
				<h2 class="mb-3 text-2xl font-semibold text-foreground">Story ideas to get you started</h2>
				<div class="grid gap-3 sm:grid-cols-2">
					<div class="rounded-lg border border-border/50 bg-card/50 p-4">
						<BookOpen class="mb-2 h-5 w-5 text-primary" />
						<p class="text-sm text-foreground">
							A mystery in a Victorian observatory, where the stars themselves are missing.
						</p>
					</div>
					<div class="rounded-lg border border-border/50 bg-card/50 p-4">
						<Sparkles class="mb-2 h-5 w-5 text-primary" />
						<p class="text-sm text-foreground">
							A bedtime adventure with a brave young fox who has to find their way home.
						</p>
					</div>
					<div class="rounded-lg border border-border/50 bg-card/50 p-4">
						<BookOpen class="mb-2 h-5 w-5 text-primary" />
						<p class="text-sm text-foreground">
							A story like Narnia, but set in a desert kingdom with an oasis-shaped portal.
						</p>
					</div>
					<div class="rounded-lg border border-border/50 bg-card/50 p-4">
						<Sparkles class="mb-2 h-5 w-5 text-primary" />
						<p class="text-sm text-foreground">
							A friendly dragon learning to bake. Each choice leads to a new recipe — or a small
							disaster.
						</p>
					</div>
				</div>
			</section>

			<section class="mb-10">
				<h2 class="mb-3 text-2xl font-semibold text-foreground">
					Family choose-your-own-adventure as a shared activity
				</h2>
				<p class="leading-relaxed">
					Cosmonaut works best when it is something you do together. Set up a story based on a book
					your kid loves, then read through it side by side — debating choices, taking turns, seeing
					what happens. It is closer to a board game night than putting on a show. With audio
					narration, it also makes a fantastic bedtime story format for younger kids.
				</p>
			</section>

			<aside
				class="my-12 flex flex-col items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-8 text-center"
			>
				<ShieldCheck class="h-8 w-8 text-primary" />
				<h2 class="text-xl font-semibold text-foreground">A note on safety</h2>
				<p class="max-w-xl text-sm text-muted-foreground">
					Cosmonaut is family-friendly by design. There is no adult mode, no roleplay mode, and no
					way to opt into NSFW content. Parents control vocabulary level and content filters.
				</p>
			</aside>

			<section class="text-center">
				<h2 class="mb-3 text-2xl font-semibold text-foreground">Try it free</h2>
				<p class="mx-auto mb-6 max-w-xl leading-relaxed text-muted-foreground">
					You can start your first AI choose-your-own-adventure story right now, on the free tier.
					No credit card required.
				</p>
				<Button size="lg" class="gap-2" href="/login">
					<Rocket class="h-5 w-5" />
					Begin Your Journey
				</Button>
			</section>
		</article>
	</main>
</div>
