<script lang="ts">
	import SEO from '$lib/components/shared/SEO.svelte';
	import ConstellationDivider from '$lib/components/shared/ConstellationDivider.svelte';
	import { Button } from '$lib/components/ui/button';
	import { BookOpen, Rocket, GitBranch, Eye } from '@lucide/svelte';

	const jsonLd = {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebPage',
				'@id': 'https://cosmonaut-ai.com/ai-interactive-fiction/#webpage',
				url: 'https://cosmonaut-ai.com/ai-interactive-fiction/',
				name: 'AI Interactive Fiction — Literary Branching Stories',
				description:
					'Cosmonaut is a literary, prose-first AI interactive fiction platform. Branching stories with consistent tone and a visible map of every choice you have made.',
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
						name: 'AI Interactive Fiction',
						item: 'https://cosmonaut-ai.com/ai-interactive-fiction/'
					}
				]
			}
		]
	};
</script>

<SEO
	title="AI Interactive Fiction — Literary Branching Stories | Cosmonaut"
	description="Cosmonaut is a literary, prose-first AI interactive fiction platform. Branching stories with consistent tone, custom actions, and a visible map of every choice you've made."
	path="/ai-interactive-fiction"
	ogImageAlt="AI interactive fiction — literary branching stories from Cosmonaut"
	{jsonLd}
/>

<div class="h-full overflow-y-auto bg-background">
	<main class="mx-auto max-w-3xl px-6 py-12">
		<header class="mb-8 text-center">
			<div
				class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10"
			>
				<BookOpen class="h-8 w-8 text-primary" />
			</div>
			<h1 class="text-4xl font-bold text-foreground sm:text-5xl">
				AI Interactive Fiction, Written Like a Novel
			</h1>
			<p class="mt-4 text-lg text-muted-foreground">
				Prose-first branching stories with a consistent voice — a literary alternative to chatbot
				roleplay and gamified RPGs.
			</p>
			<div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
				<Button size="lg" class="gap-2" href="/login">
					<Rocket class="h-5 w-5" />
					Start writing your story
				</Button>
				<Button variant="ghost" size="lg" href="/faq">Read the FAQ</Button>
			</div>
		</header>

		<ConstellationDivider />

		<article class="mx-auto prose mt-8 max-w-none text-muted-foreground prose-invert">
			<section class="mb-10">
				<h2 class="mb-3 text-2xl font-semibold text-foreground">
					Interactive fiction, written as fiction
				</h2>
				<p class="leading-relaxed">
					Most AI story tools are really chatbots in disguise. You type, the model replies, and what
					you end up with reads like a transcript. Cosmonaut is different: it writes proper chapters
					of prose, with a consistent narrative voice, paced toward meaningful decision points. The
					choices you make branch the story — but between choices, you are reading written fiction,
					not a conversation.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="mb-3 text-2xl font-semibold text-foreground">What makes Cosmonaut different</h2>
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="rounded-lg border border-border/50 bg-card/50 p-5">
						<GitBranch class="mb-2 h-5 w-5 text-primary" />
						<h3 class="mb-1 font-semibold text-foreground">Branching with memory</h3>
						<p class="text-sm">
							The story remembers the path you took, so later chapters stay coherent with earlier
							decisions.
						</p>
					</div>
					<div class="rounded-lg border border-border/50 bg-card/50 p-5">
						<Eye class="mb-2 h-5 w-5 text-primary" />
						<h3 class="mb-1 font-semibold text-foreground">Visual story map</h3>
						<p class="text-sm">
							See every path you have explored, jump back to earlier moments, and discover the
							endings you missed.
						</p>
					</div>
					<div class="rounded-lg border border-border/50 bg-card/50 p-5">
						<BookOpen class="mb-2 h-5 w-5 text-primary" />
						<h3 class="mb-1 font-semibold text-foreground">Custom actions</h3>
						<p class="text-sm">
							If the presented choices are not what you wanted, write your own action. The story
							responds in kind.
						</p>
					</div>
					<div class="rounded-lg border border-border/50 bg-card/50 p-5">
						<Rocket class="mb-2 h-5 w-5 text-primary" />
						<h3 class="mb-1 font-semibold text-foreground">No grind, no gamification</h3>
						<p class="text-sm">
							No stats, levels, inventory, or experience points. Just a story you can put down and
							pick up later.
						</p>
					</div>
				</div>
			</section>

			<section class="mb-10">
				<h2 class="mb-3 text-2xl font-semibold text-foreground">Who Cosmonaut is for</h2>
				<p class="leading-relaxed">
					Cosmonaut is built for readers who want a literary experience — people who grew up on
					choose-your-own-adventure paperbacks, who like Tolkien more than Twitch, and who want
					their AI to write something they would actually want to read. It is family-friendly by
					default, so adults can use it for their own stories and parents can use it with their kids
					without worrying about content.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="mb-3 text-2xl font-semibold text-foreground">Genres that work well</h2>
				<ul class="list-disc space-y-2 pl-5 leading-relaxed">
					<li>Cozy mystery — a small village, a strange disappearance, a curious narrator.</li>
					<li>Historical fiction — a 1920s Paris adventure, a Victorian observatory mystery.</li>
					<li>Soft science fiction — a generation ship with a quiet secret in its archive.</li>
					<li>Literary fantasy — an empire built on the bones of a sleeping god.</li>
					<li>Coming-of-age — a teen apprentice mapmaker on a first commission.</li>
				</ul>
			</section>

			<section class="text-center">
				<h2 class="mb-3 text-2xl font-semibold text-foreground">Read your way into a story</h2>
				<p class="mx-auto mb-6 max-w-xl leading-relaxed text-muted-foreground">
					The free tier is enough to explore. Upgrade for more stories per month and audio
					narration.
				</p>
				<Button size="lg" class="gap-2" href="/login">
					<Rocket class="h-5 w-5" />
					Begin Your Journey
				</Button>
			</section>
		</article>
	</main>
</div>
