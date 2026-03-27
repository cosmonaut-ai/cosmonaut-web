<script lang="ts">
	import { browser } from '$app/environment';
	import SEO from '$lib/components/shared/SEO.svelte';
	import ConstellationDivider from '$lib/components/shared/ConstellationDivider.svelte';
	import { BookOpen, Sparkles, Users } from '@lucide/svelte';

	const prefersReducedMotion = browser
		? window.matchMedia('(prefers-reduced-motion: reduce)').matches
		: false;

	let visibleSections = $state([false, false, false, false]);

	function observeSection(index: number) {
		return function (node: HTMLElement) {
			if (prefersReducedMotion) {
				visibleSections[index] = true;
				return;
			}

			const observer = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						if (entry.isIntersecting) {
							visibleSections[index] = true;
							observer.unobserve(node);
						}
					}
				},
				{ threshold: 0.15 }
			);

			observer.observe(node);

			return () => {
				observer.disconnect();
			};
		};
	}
</script>

<SEO
	title="About Cosmonaut - Interactive Storytelling Platform"
	description="Cosmonaut AI is an interactive storytelling platform where every choice shapes the narrative. Built for families, powered by AI."
	path="/about"
/>

<div class="h-full overflow-y-auto bg-background">
	<main class="mx-auto max-w-3xl px-6 py-12">
		<!-- Hero -->
		<div class="mb-8 text-center">
			<div
				class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10"
			>
				<BookOpen class="h-8 w-8 text-primary" />
			</div>
			<h1 class="text-4xl font-bold text-foreground">About Cosmonaut</h1>
			<p class="mt-4 text-lg text-muted-foreground">
				Interactive storytelling where every choice shapes the world.
			</p>
		</div>

		<ConstellationDivider />

		<!-- What is Cosmonaut -->
		<section
			class="about-section mb-12 {visibleSections[0] ? 'about-visible' : 'about-hidden'}"
			{@attach observeSection(0)}
		>
			<div class="mb-4 flex items-center gap-3">
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10"
				>
					<BookOpen class="h-5 w-5 text-primary" />
				</div>
				<h2 class="text-2xl font-semibold text-foreground">What is Cosmonaut?</h2>
			</div>
			<div class="space-y-4 pl-[52px] text-muted-foreground">
				<p>
					Cosmonaut AI is an interactive storytelling platform that lets you create, explore, and
					shape unique story worlds. You simply describe a world, characters, or setting, or even
					base it off of a movie or book, and Cosmonaut's AI will generate an interactive story for
					you.
				</p>
				<p>
					There are a couple of similar concepts out there, so we'll save you some time and cut to
					some of the things we really care about:
				</p>
				<ul class="list-disc pl-5">
					<li>
						<strong>Branching storylines & narrative consistency:</strong> we want to allow users to explore
						multiple paths in a story, but also ensure that the story is consistent and coherent across
						all paths.
					</li>
					<li>
						<strong>Minimize distraction / gamification:</strong> Technology is great, but there are a
						wealth of studies that demonstrate the negative impact that excess exposure can have on both
						children and adults. We want to create a platform that harkens back to the days of reading
						choose-your-own-adventure books with the family and deepens relationships, not just provides
						entertainment.
					</li>
					<li>
						<strong>Parental control:</strong> We want parents to feel confident about the content their
						children are consuming. It's a terrible experience to be halfway through a story and have
						to stop and explain to your child that the story is not appropriate for them or that it's
						too scary. We've added in customizable vocabulary levels and content filters to ensure that
						the story is appropriate for the user's age and sensitivity.
					</li>
				</ul>
			</div>
		</section>

		<ConstellationDivider />

		<!-- How it works -->
		<section
			class="about-section mb-12 {visibleSections[1] ? 'about-visible' : 'about-hidden'}"
			{@attach observeSection(1)}
		>
			<div class="mb-4 flex items-center gap-3">
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10"
				>
					<Sparkles class="h-5 w-5 text-primary" />
				</div>
				<h2 class="text-2xl font-semibold text-foreground">How It Works</h2>
			</div>
			<div class="space-y-4 pl-[52px] text-muted-foreground">
				<p>
					Start with a prompt - a setting, a character, a mood, or even a book or movie you love.
					Cosmonaut turns that seed into a richly written story, then hands control back to you. At
					key moments, you choose what happens next. The story branches and remembers your
					decisions, so the world stays coherent no matter which path you take.
				</p>
				<p>
					We're deliberate about pacing. There's no autoplay, no feed to scroll, no points to
					collect. You read a chapter, make a choice, and put it down. Come back when you're ready -
					the story waits.
				</p>
			</div>
		</section>

		<ConstellationDivider />

		<!-- Built for families -->
		<section
			class="about-section mb-12 {visibleSections[2] ? 'about-visible' : 'about-hidden'}"
			{@attach observeSection(2)}
		>
			<div class="mb-4 flex items-center gap-3">
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10"
				>
					<Users class="h-5 w-5 text-primary" />
				</div>
				<h2 class="text-2xl font-semibold text-foreground">Built for Families</h2>
			</div>
			<div class="space-y-4 pl-[52px] text-muted-foreground">
				<p>
					Cosmonaut works best as something you do together. Set up a world based on a book your kid
					loves, or a genre they've been curious about, then read through it side by side - debating
					choices, taking turns, seeing what happens. It's closer to a board game night than putting
					on a show.
				</p>
				<p>
					That said, it works just as well solo. Adults use it too - for their own stories, their
					own genres, their own pace. The parental controls are there when you need them, and out of
					the way when you don't.
				</p>
			</div>
		</section>

		<ConstellationDivider />

		<!-- Contact -->
		<section
			class="about-section {visibleSections[3] ? 'about-visible' : 'about-hidden'}"
			{@attach observeSection(3)}
		>
			<div class="rounded-lg border border-border/50 bg-card/50 p-8 text-center">
				<h2 class="mb-2 text-xl font-semibold text-foreground">Say Hello</h2>
				<p class="mb-4 text-muted-foreground">
					We're a small team and we genuinely read every message. Questions, feedback, story ideas,
					complaints - all welcome.
				</p>
				<a
					href="mailto:support@cosmonaut-ai.com"
					class="text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
				>
					support@cosmonaut-ai.com
				</a>
				<p class="mt-4 text-sm text-muted-foreground">
					Cosmonaut is built by <strong class="text-foreground">Matson Software LLC</strong>.
				</p>
			</div>
		</section>
	</main>
</div>

<style>
	.about-section {
		transition:
			opacity 0.6s ease-out,
			transform 0.6s ease-out;
	}

	.about-hidden {
		opacity: 0;
		transform: translateY(24px);
	}

	.about-visible {
		opacity: 1;
		transform: translateY(0);
	}

	@media (prefers-reduced-motion: reduce) {
		.about-section {
			transition: none;
		}

		.about-hidden {
			opacity: 1;
			transform: none;
		}
	}
</style>
