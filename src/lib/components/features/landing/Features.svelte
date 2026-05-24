<script lang="ts">
	import { BookOpen, GitBranch, Map } from '@lucide/svelte';

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
			title: 'Chapter-shaped',
			description:
				'Scenes have texture, momentum, and stopping points, so they work as actual read-aloud material.'
		},
		{
			icon: GitBranch,
			title: 'Choice-led',
			description:
				'Every branch asks for a real preference: brave, cautious, funny, curious, or kind.'
		},
		{
			icon: Map,
			title: 'Built to revisit',
			description:
				'The story map keeps paths legible, so one strange decision can become a favorite route later.'
		}
	];
</script>

<section
	class="landing-editorial relative overflow-hidden pt-24 pb-16 text-[#f7f1e3] sm:pt-32 sm:pb-20"
>
	<div class="mx-auto max-w-6xl px-6">
		<div class="grid gap-10 pb-16 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
			<div>
				<p class="mb-4 text-sm font-semibold tracking-[0.18em] text-[#f3d98b] uppercase">
					Not another prompt machine
				</p>
				<h2 class="max-w-xl text-4xl leading-tight font-semibold sm:text-5xl">
					Made for the moment someone says, "wait, what if..."
				</h2>
			</div>
			<p class="max-w-2xl text-lg leading-8 text-[#b6c4cd] lg:pt-10">
				Cosmonaut should feel closer to opening a strange, well-made book than operating an AI tool.
				The prompt is only the matchstick. The product is the shape that lets a family, a solo
				reader, or a group of friends keep caring about what happens next.
			</p>
		</div>

		<div class="grid gap-8 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
			<div class="editorial-panel p-6 sm:p-8">
				<p class="mb-4 text-sm font-semibold tracking-[0.18em] text-[#f3d98b] uppercase">
					From the table
				</p>
				<div class="space-y-5">
					{#each promptScraps as scrap, i (scrap.label)}
						<article class="prompt-scrap" style="--tilt: {(i - 1) * 0.45}deg">
							<p class="mb-3 text-xs font-semibold tracking-[0.16em] text-[#9f8451] uppercase">
								{scrap.label}
							</p>
							<p class="mb-3 text-lg font-semibold text-[#fff8e8]">"{scrap.prompt}"</p>
							<p class="text-sm leading-relaxed text-[#b6c4cd]">{scrap.note}</p>
						</article>
					{/each}
				</div>
			</div>

			<div class="grid content-start gap-5">
				{#each storyPrinciples as principle (principle.title)}
					{@const Icon = principle.icon}
					<article class="principle-row">
						<div
							class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#4b6072] bg-[#20303f]"
						>
							<Icon class="h-5 w-5 text-[#f3d98b]" />
						</div>
						<div>
							<h3 class="mb-2 text-xl font-semibold text-[#fff8e8]">{principle.title}</h3>
							<p class="leading-7 text-[#b6c4cd]">{principle.description}</p>
						</div>
					</article>
				{/each}
			</div>
		</div>
	</div>
</section>

<style>
	.landing-editorial {
		background: var(--background);
	}

	.editorial-panel {
		border: 1px solid #314354;
		border-radius: 0.5rem;
		background: #172534;
		box-shadow: 0 24px 70px rgba(0, 0, 0, 0.24);
	}

	.prompt-scrap {
		transform: rotate(var(--tilt));
		border: 1px solid #314354;
		border-radius: 0.5rem;
		background: #101923;
		padding: 1.25rem;
		box-shadow: 0 14px 34px rgba(0, 0, 0, 0.16);
	}

	.principle-row {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 1.25rem;
		align-items: start;
		border: 1px solid #314354;
		border-radius: 0.5rem;
		background: #172534;
		padding: 1.5rem;
	}

	@media (max-width: 640px) {
		.prompt-scrap {
			transform: none;
		}

		.principle-row {
			grid-template-columns: 1fr;
		}
	}
</style>
