<script lang="ts">
	import { BookOpen, GitBranch, Map, Moon, PencilLine, Users } from '@lucide/svelte';
	import { intersectionReveal } from '$lib/utils/intersectionReveal';

	const promptScraps = [
		{
			label: 'Tuesday, 8:17 PM',
			prompt: 'A mystery about the sock that vanished from the dryer',
			note: 'Good for one more chapter before lights out.'
		},
		{
			label: 'Saturday couch fort',
			prompt: 'Grandma has a vegetable garden on Mars',
			note: 'Let the brave tomato captain make one terrible joke.'
		},
		{
			label: 'Rainy train ride',
			prompt: 'A polite dragon learns how to apologize',
			note: 'No fighting. Big feelings allowed.'
		}
	];

	const storyPrinciples = [
		{
			icon: BookOpen,
			title: 'Chapters, not chat bubbles',
			description:
				'Cosmonaut writes in scenes with atmosphere, pauses, and endings you can actually read aloud.'
		},
		{
			icon: GitBranch,
			title: 'Choices worth debating',
			description:
				'Branches are framed like little family arguments: brave, cautious, funny, curious, or kind.'
		},
		{
			icon: Map,
			title: 'A map you can come back to',
			description:
				"The story keeps its shape, so yesterday's odd choice can become tomorrow's favorite path."
		}
	];

	let visible = $state([false, false, false, false]);
</script>

<section class="relative overflow-hidden py-24">
	<!-- Top gradient from DemoStory -->
	<div
		class="pointer-events-none absolute inset-x-0 top-0 h-100 bg-linear-to-b from-background via-background/50 to-transparent"
	></div>

	<div class="relative mx-auto max-w-6xl px-6">
		<div
			class="landing-band grid gap-10 border-y border-border/60 px-4 py-14 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16"
		>
			<div
				class="feature-card {visible[0] ? 'feature-visible' : 'feature-hidden'}"
				use:intersectionReveal={{ onReveal: () => (visible[0] = true), threshold: 0.2 }}
			>
				<p class="mb-3 text-sm font-medium tracking-widest text-primary uppercase">
					Not another prompt machine
				</p>
				<h2 class="mb-5 max-w-xl text-3xl font-bold text-foreground sm:text-4xl">
					Made for the part of the day when everyone is a little tired.
				</h2>
				<p class="max-w-2xl leading-relaxed text-muted-foreground">
					The best stories do not start with a polished brief. They start with a kid saying, "make
					it about the laundry basket," or a parent remembering the book everyone loved last month.
					Cosmonaut is built around those small, specific sparks.
				</p>
			</div>

			<div
				class="prompt-stack feature-card {visible[1] ? 'feature-visible' : 'feature-hidden'}"
				use:intersectionReveal={{ onReveal: () => (visible[1] = true), threshold: 0.15 }}
			>
				{#each promptScraps as scrap, i (scrap.label)}
					<article class="prompt-scrap" style="--tilt: {(i - 1) * 1.5}deg">
						<p class="mb-3 text-xs font-medium tracking-widest text-primary/80 uppercase">
							{scrap.label}
						</p>
						<p class="mb-4 text-lg font-semibold text-foreground">"{scrap.prompt}"</p>
						<p class="text-sm leading-relaxed text-muted-foreground">{scrap.note}</p>
					</article>
				{/each}
			</div>
		</div>

		<div class="grid gap-6 py-16 md:grid-cols-3">
			{#each storyPrinciples as principle, i (principle.title)}
				{@const Icon = principle.icon}
				<article
					class="feature-card principle-tile {visible[2] ? 'feature-visible' : 'feature-hidden'}"
					style="--delay: {i * 80}ms"
					use:intersectionReveal={{ onReveal: () => (visible[2] = true), threshold: 0.15 }}
				>
					<div
						class="mb-5 flex h-11 w-11 items-center justify-center rounded-lg border border-primary/25 bg-primary/10"
					>
						<Icon class="h-5 w-5 text-primary" />
					</div>
					<h3 class="mb-3 text-lg font-semibold text-foreground">{principle.title}</h3>
					<p class="leading-relaxed text-muted-foreground">{principle.description}</p>
				</article>
			{/each}
		</div>

		<div
			class="feature-card family-note grid gap-8 border-t border-border/60 p-6 sm:p-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center {visible[3]
				? 'feature-visible'
				: 'feature-hidden'}"
			use:intersectionReveal={{ onReveal: () => (visible[3] = true), threshold: 0.2 }}
		>
			<div>
				<p class="mb-3 text-sm font-medium tracking-widest text-primary uppercase">House rules</p>
				<h2 class="mb-5 text-3xl font-bold text-foreground sm:text-4xl">
					Quiet by design, weird on purpose.
				</h2>
				<p class="leading-relaxed text-muted-foreground">
					No streaks, loot boxes, or endless feed. Cosmonaut is meant to make a room lean in for a
					few minutes, then let everyone close the laptop and keep talking about the story.
				</p>
			</div>

			<div class="grid gap-4 sm:grid-cols-3">
				<div class="house-rule">
					<Moon class="mb-4 h-5 w-5 text-primary" />
					<p class="font-medium text-foreground">Bedtime pace</p>
					<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
						Short chapters that can stop cleanly.
					</p>
				</div>
				<div class="house-rule">
					<Users class="mb-4 h-5 w-5 text-primary" />
					<p class="font-medium text-foreground">Shared reading</p>
					<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
						Choices are made together, not autoplayed.
					</p>
				</div>
				<div class="house-rule">
					<PencilLine class="mb-4 h-5 w-5 text-primary" />
					<p class="font-medium text-foreground">Room for odd ideas</p>
					<p class="mt-2 text-sm leading-relaxed text-muted-foreground">
						The best prompt might be four messy words.
					</p>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.landing-band {
		background:
			linear-gradient(90deg, oklch(from var(--primary) l c h / 0.07), transparent 46%),
			linear-gradient(
				180deg,
				oklch(from var(--card) l c h / 0.52),
				oklch(from var(--card) l c h / 0.36)
			);
	}

	.prompt-stack {
		display: grid;
		gap: 1rem;
	}

	.prompt-scrap {
		transform: rotate(var(--tilt));
		border: 1px solid oklch(from var(--border) l c h / 0.8);
		border-radius: 0.5rem;
		background:
			linear-gradient(135deg, oklch(from var(--card) l c h / 0.92), var(--background)), var(--card);
		padding: 1.25rem;
		box-shadow: 0 16px 40px oklch(0 0 0 / 0.18);
	}

	.principle-tile {
		min-height: 100%;
		border: 1px solid oklch(from var(--border) l c h / 0.8);
		border-radius: 0.5rem;
		background: oklch(from var(--card) l c h / 0.58);
		padding: 1.5rem;
		transition-delay: var(--delay);
	}

	.family-note {
		background: linear-gradient(
			180deg,
			oklch(from var(--card) l c h / 0.42),
			oklch(from var(--primary) l c h / 0.06)
		);
	}

	.house-rule {
		min-height: 100%;
		border-left: 1px solid oklch(from var(--primary) l c h / 0.35);
		padding-left: 1rem;
	}

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

	@media (max-width: 640px) {
		.prompt-scrap {
			transform: none;
		}
	}

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
