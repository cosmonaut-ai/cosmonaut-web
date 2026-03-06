<script lang="ts">
	import { browser } from '$app/environment';
	import SEO from '$lib/components/SEO.svelte';
	import ConstellationDivider from '$lib/components/ConstellationDivider.svelte';
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
					shape unique story worlds. Every decision you make drives the narrative forward, creating
					a reading experience that's different every time.
				</p>
				<p>
					Whether you're building a fantasy kingdom, navigating a sci-fi frontier, or crafting a
					mystery adventure, Cosmonaut gives you the tools to bring your imagination to life — then
					lets you step inside and explore it.
				</p>
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
					You describe a world — its setting, characters, and tone — and Cosmonaut's AI brings it to
					life with richly written prose, generated illustrations, and branching storylines. As you
					read, you make choices that shape what happens next. The story remembers your decisions,
					building a coherent narrative that evolves with you.
				</p>
				<p>
					Behind the scenes, Cosmonaut uses advanced AI models to generate text, images, and audio
					narration. A persistent memory system tracks the facts, relationships, and events within
					your story to maintain continuity across every chapter.
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
				<h2 class="text-2xl font-semibold text-foreground">Built for Everyone</h2>
			</div>
			<div class="space-y-4 pl-[52px] text-muted-foreground">
				<p>
					Cosmonaut is designed for storytellers of all ages. Parents can create worlds tailored to
					their children's interests and read together, making choices as a team. It's a new kind of
					bedtime story — one where your child gets to decide what happens next.
				</p>
				<p>
					Content safety filters help ensure that generated stories stay appropriate, and the
					platform is built so that parents remain in control of the experience.
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
				<h2 class="mb-2 text-xl font-semibold text-foreground">Get in Touch</h2>
				<p class="mb-4 text-muted-foreground">
					Have questions, feedback, or just want to say hello? We'd love to hear from you.
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
