<script lang="ts">
	import { Sparkles, GitBranch, Eye } from '@lucide/svelte';
	import { intersectionReveal } from '$lib/utils/intersectionReveal';

	// Track visibility for each feature card
	let visible = $state([false, false, false]);
</script>

<section class="relative py-24">
	<!-- Top gradient from DemoStory -->
	<div
		class="pointer-events-none absolute inset-x-0 top-0 h-100 bg-gradient-to-b from-background via-background/50 to-transparent"
	></div>

	<div class="relative mx-auto max-w-5xl px-6">
		<!-- Section intro -->
		<div class="mb-20 text-center">
			<p class="mb-3 text-sm font-medium tracking-widest text-primary uppercase">How it works</p>
			<h2 class="text-3xl font-bold text-foreground sm:text-4xl">
				Three steps to infinite stories
			</h2>
		</div>

		<!-- Three focused features -->
		<div class="grid gap-12 md:grid-cols-3">
			<!-- Feature 1: Describe -->
			<div
				class="feature-card text-center {visible[0] ? 'feature-visible' : 'feature-hidden'}"
				use:intersectionReveal={{ onReveal: () => (visible[0] = true), threshold: 0.2 }}
			>
				<div
					class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 transition-all duration-300 hover:scale-110 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
				>
					<Sparkles class="h-8 w-8 text-primary" />
				</div>
				<h3 class="mb-3 text-xl font-semibold text-foreground">Describe your world</h3>
				<p class="leading-relaxed text-muted-foreground">
					"A noir mystery in 1940s Chicago" or "A space station hiding dark secrets"-you set the
					stage, the AI fills in the details.
				</p>
			</div>

			<!-- Feature 2: Branch -->
			<div
				class="feature-card text-center {visible[1] ? 'feature-visible' : 'feature-hidden'}"
				use:intersectionReveal={{ onReveal: () => (visible[1] = true), threshold: 0.2 }}
			>
				<div
					class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 transition-all duration-300 hover:scale-110 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
				>
					<GitBranch class="h-8 w-8 text-primary" />
				</div>
				<h3 class="mb-3 text-xl font-semibold text-foreground">Every choice branches</h3>
				<p class="leading-relaxed text-muted-foreground">
					Decisions create new paths. Write custom actions, explore unexpected directions. Your
					story grows with every click.
				</p>
			</div>

			<!-- Feature 3: See -->
			<div
				class="feature-card text-center {visible[2] ? 'feature-visible' : 'feature-hidden'}"
				use:intersectionReveal={{ onReveal: () => (visible[2] = true), threshold: 0.2 }}
			>
				<div
					class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 transition-all duration-300 hover:scale-110 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
				>
					<Eye class="h-8 w-8 text-primary" />
				</div>
				<h3 class="mb-3 text-xl font-semibold text-foreground">See the whole picture</h3>
				<p class="leading-relaxed text-muted-foreground">
					A visual map shows every path through your story. Jump between branches, discover
					what-ifs, find the endings you missed.
				</p>
			</div>
		</div>

		<!-- Bottom note -->
		<div class="mt-20 text-center">
			<p class="text-sm text-muted-foreground/70">
				Multiplayer adventures coming soon-explore stories together with friends.
			</p>
		</div>
	</div>
</section>

<style>
	.feature-card {
		transition:
			opacity 0.6s ease-out,
			transform 0.6s ease-out;
	}

	.feature-hidden {
		opacity: 0;
		transform: translateY(24px);
	}

	.feature-visible {
		opacity: 1;
		transform: translateY(0);
	}

	/* Respect reduced motion at the CSS level as well */
	@media (prefers-reduced-motion: reduce) {
		.feature-card {
			transition: none;
		}

		.feature-hidden {
			opacity: 1;
			transform: none;
		}
	}
</style>
