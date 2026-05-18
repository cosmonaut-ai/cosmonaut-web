<script lang="ts">
	import SEO from '$lib/components/shared/SEO.svelte';
	import ConstellationDivider from '$lib/components/shared/ConstellationDivider.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Moon, Rocket, Volume2, ShieldCheck } from '@lucide/svelte';

	const jsonLd = {
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'WebPage',
				'@id': 'https://cosmonaut-ai.com/ai-bedtime-stories/#webpage',
				url: 'https://cosmonaut-ai.com/ai-bedtime-stories/',
				name: 'AI Bedtime Stories — Custom Narrated Stories for Kids',
				description:
					'Generate custom AI bedtime stories tailored to your child, with optional audio narration. Family-friendly, branching, and built to be read together.',
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
						name: 'AI Bedtime Stories',
						item: 'https://cosmonaut-ai.com/ai-bedtime-stories/'
					}
				]
			}
		]
	};
</script>

<SEO
	title="AI Bedtime Stories — Custom Narrated Stories for Kids | Cosmonaut"
	description="Generate custom AI bedtime stories tailored to your child, with optional audio narration. Family-friendly, branching, and built to be read together."
	path="/ai-bedtime-stories"
	ogImageAlt="AI bedtime stories for kids — custom narrated stories from Cosmonaut"
	{jsonLd}
/>

<div class="h-full overflow-y-auto bg-background">
	<main class="mx-auto max-w-3xl px-6 py-12">
		<header class="mb-8 text-center">
			<div
				class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10"
			>
				<Moon class="h-8 w-8 text-primary" />
			</div>
			<h1 class="text-4xl font-bold text-foreground sm:text-5xl">
				AI Bedtime Stories, Made for Your Kid
			</h1>
			<p class="mt-4 text-lg text-muted-foreground">
				Custom AI bedtime stories with optional narration — calm, age-appropriate, and different
				every night.
			</p>
			<div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
				<Button size="lg" class="gap-2" href="/login">
					<Rocket class="h-5 w-5" />
					Write tonight's story
				</Button>
				<Button variant="ghost" size="lg" href="/faq">Read the FAQ</Button>
			</div>
		</header>

		<ConstellationDivider />

		<article class="mx-auto prose mt-8 max-w-none text-muted-foreground prose-invert">
			<section class="mb-10">
				<h2 class="mb-3 text-2xl font-semibold text-foreground">
					Custom bedtime stories, on the fly
				</h2>
				<p class="leading-relaxed">
					Some nights your child wants a story about a brave young fox. Some nights it has to
					involve dragons and a missing crown. Cosmonaut writes a custom AI bedtime story to match —
					tailored to the topic, the reading level, and the mood. Tell it what your kid loves, and
					the story arrives in seconds.
				</p>
				<p class="mt-4 leading-relaxed">
					Each story is original, written as proper prose, and shaped by the choices you and your
					child make together. No two bedtimes are the same.
				</p>
			</section>

			<section class="mb-10">
				<h2 class="mb-3 text-2xl font-semibold text-foreground">Listen, don't just read</h2>
				<div class="flex items-start gap-4 rounded-xl border border-border/50 bg-card/50 p-6">
					<Volume2 class="mt-1 h-6 w-6 shrink-0 text-primary" />
					<div>
						<p class="leading-relaxed">
							On paid tiers, Cosmonaut narrates every chapter with warm, natural voices. Start the
							story together, turn off the light, and let narration take over while your child
							drifts off. It is the audiobook experience — but for stories that are written
							specifically for your kid, tonight.
						</p>
					</div>
				</div>
			</section>

			<section class="mb-10">
				<h2 class="mb-3 text-2xl font-semibold text-foreground">Bedtime story prompts to try</h2>
				<ul class="space-y-3">
					<li class="rounded-lg border border-border/50 bg-card/50 p-4 text-foreground">
						"A bedtime story about a small dragon who is afraid of the dark and meets a firefly."
					</li>
					<li class="rounded-lg border border-border/50 bg-card/50 p-4 text-foreground">
						"A calm undersea adventure for a kindergartener who loves whales."
					</li>
					<li class="rounded-lg border border-border/50 bg-card/50 p-4 text-foreground">
						"A bedtime story like Winnie-the-Pooh, but with a curious raccoon as the hero."
					</li>
					<li class="rounded-lg border border-border/50 bg-card/50 p-4 text-foreground">
						"A gentle space story where an astronaut tucks the planets in for the night."
					</li>
				</ul>
			</section>

			<section class="mb-10">
				<h2 class="mb-3 text-2xl font-semibold text-foreground">
					Tuned for the right reading level
				</h2>
				<p class="leading-relaxed">
					Cosmonaut lets you set a vocabulary level so the prose matches your child. Simpler,
					sing-song sentences for early readers. Richer, more descriptive prose for older kids who
					want to be challenged. The same story idea can be told two completely different ways.
				</p>
			</section>

			<aside
				class="my-12 flex flex-col items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-8 text-center"
			>
				<ShieldCheck class="h-8 w-8 text-primary" />
				<h2 class="text-xl font-semibold text-foreground">Family-safe by default</h2>
				<p class="max-w-xl text-sm text-muted-foreground">
					Cosmonaut never produces scary, adult, or roleplay content for bedtime stories. Parents
					control vocabulary level and content sensitivity. It is the kind of platform you can hand
					to your child without checking over their shoulder.
				</p>
			</aside>

			<section class="text-center">
				<h2 class="mb-3 text-2xl font-semibold text-foreground">Try it tonight</h2>
				<p class="mx-auto mb-6 max-w-xl leading-relaxed text-muted-foreground">
					The free tier is enough for a bedtime story or two. Upgrade later if you want audio
					narration or more stories per month.
				</p>
				<Button size="lg" class="gap-2" href="/login">
					<Rocket class="h-5 w-5" />
					Start a bedtime story
				</Button>
			</section>
		</article>
	</main>
</div>
