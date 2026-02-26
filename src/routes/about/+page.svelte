<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { Rocket, BookOpen, Sparkles, Users } from '@lucide/svelte';
</script>

<SEO
	title="About Cosmonaut - Interactive Storytelling Platform"
	description="Cosmonaut AI is an interactive storytelling platform where every choice shapes the narrative. Built for families, powered by AI."
	path="/about"
/>

<div class="h-full overflow-y-auto bg-background">
	<main class="mx-auto max-w-3xl px-6 py-12">
		<!-- Hero -->
		<div class="mb-16 text-center">
			<div
				class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10"
			>
				<Rocket class="h-8 w-8 text-primary" />
			</div>
			<h1 class="text-4xl font-bold text-foreground">About Cosmonaut</h1>
			<p class="mt-4 text-lg text-muted-foreground">
				Interactive storytelling where every choice shapes the world.
			</p>
		</div>

		<!-- What is Cosmonaut -->
		<section class="mb-12">
			<div class="mb-4 flex items-center gap-3">
				<BookOpen class="h-5 w-5 text-primary" />
				<h2 class="text-2xl font-semibold text-foreground">What is Cosmonaut?</h2>
			</div>
			<div class="space-y-4 text-muted-foreground">
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

		<!-- How it works -->
		<section class="mb-12">
			<div class="mb-4 flex items-center gap-3">
				<Sparkles class="h-5 w-5 text-primary" />
				<h2 class="text-2xl font-semibold text-foreground">How It Works</h2>
			</div>
			<div class="space-y-4 text-muted-foreground">
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

		<!-- Built for families -->
		<section class="mb-12">
			<div class="mb-4 flex items-center gap-3">
				<Users class="h-5 w-5 text-primary" />
				<h2 class="text-2xl font-semibold text-foreground">Built for Families</h2>
			</div>
			<div class="space-y-4 text-muted-foreground">
				<p>
					Cosmonaut is designed with families in mind. Parents can create story worlds tailored to
					their children's interests and read together, making choices as a team. It's a new kind of
					bedtime story — one where your child gets to decide what happens next.
				</p>
				<p>
					Content safety filters help ensure that generated stories stay appropriate, and the
					platform is built so that parents remain in control of the experience.
				</p>
			</div>
		</section>

		<!-- Contact -->
		<section class="rounded-lg border border-border/50 bg-muted/30 p-8 text-center">
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
		</section>
	</main>
</div>
