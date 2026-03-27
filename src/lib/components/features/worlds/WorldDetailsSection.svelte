<script lang="ts">
	import type { World } from '$lib/types/api';
	import { browser } from '$app/environment';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import ConstellationDivider from '$lib/components/shared/ConstellationDivider.svelte';
	import { MapPin, Compass, Copy, Check, MessageSquareText } from '@lucide/svelte';
	import { trackEvent } from '$lib/utils/analytics';

	interface Props {
		world: World;
	}

	let { world }: Props = $props();

	let promptCopied = $state(false);

	const prefersReducedMotion = browser
		? window.matchMedia('(prefers-reduced-motion: reduce)').matches
		: false;

	let promptVisible = $state(false);
	let briefingVisible = $state(false);
	let locationsVisible = $state(false);
	let endingsVisible = $state(false);

	const hasPrompt = $derived(world.world_prompt !== null && world.world_prompt.trim() !== '');
	const hasLocations = $derived(world.locations !== null && world.locations.length > 0);
	const hasEndings = $derived(
		world.potential_endings !== null && world.potential_endings.length > 0
	);
	const hasSetting = $derived(world.setting !== null && world.setting.trim() !== '');

	function observeSection(setter: (v: boolean) => void) {
		return function (node: HTMLElement) {
			if (prefersReducedMotion) {
				setter(true);
				return;
			}

			const observer = new IntersectionObserver(
				(entries) => {
					for (const entry of entries) {
						if (entry.isIntersecting) {
							setter(true);
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

	async function copyPrompt() {
		if (!world.world_prompt) return;
		try {
			await navigator.clipboard.writeText(world.world_prompt);
			trackEvent('world_prompt_copied');
			promptCopied = true;
			setTimeout(() => (promptCopied = false), 2000);
		} catch {
			/* Clipboard API may not be available */
		}
	}
</script>

{#if hasPrompt}
	<ConstellationDivider />

	<section
		class="section-animate mx-auto max-w-4xl px-6 py-8 {promptVisible
			? 'section-visible'
			: 'section-hidden'}"
		{@attach observeSection((v) => {
			promptVisible = v;
		})}
	>
		<div class="mb-8 text-center">
			<p class="mb-3 text-xs font-medium tracking-[0.3em] text-primary/60 uppercase">
				✦ Creation Prompt ✦
			</p>
		</div>

		<Card class="mb-6">
			<CardContent class="p-6">
				<div class="flex items-start gap-4">
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10"
					>
						<MessageSquareText class="h-5 w-5 text-primary" />
					</div>
					<div class="min-w-0 flex-1">
						<div class="mb-1 flex items-center justify-between">
							<p class="text-xs font-medium tracking-wider text-muted-foreground uppercase">
								Prompt
							</p>
							<Button
								variant="ghost"
								size="sm"
								class="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
								onclick={copyPrompt}
							>
								{#if promptCopied}
									<Check class="h-3.5 w-3.5 text-primary" />
									Copied
								{:else}
									<Copy class="h-3.5 w-3.5" />
									Copy
								{/if}
							</Button>
						</div>
						<p class="text-sm leading-relaxed whitespace-pre-wrap text-card-foreground/80 italic">
							"{world.world_prompt}"
						</p>
					</div>
				</div>
			</CardContent>
		</Card>
	</section>
{/if}

{#if hasSetting}
	<ConstellationDivider />

	<section
		class="section-animate mx-auto max-w-4xl px-6 py-8 {briefingVisible
			? 'section-visible'
			: 'section-hidden'}"
		{@attach observeSection((v) => {
			briefingVisible = v;
		})}
	>
		<div class="mb-8 text-center">
			<p class="mb-3 text-xs font-medium tracking-[0.3em] text-primary/60 uppercase">
				✦ World Briefing ✦
			</p>
		</div>

		<Card class="mb-6">
			<CardContent class="flex items-start gap-4 p-6">
				<div
					class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10"
				>
					<MapPin class="h-5 w-5 text-primary" />
				</div>
				<div>
					<p class="mb-1 text-xs font-medium tracking-wider text-muted-foreground uppercase">
						Setting
					</p>
					<p class="text-sm leading-relaxed text-card-foreground/80">{world.setting}</p>
				</div>
			</CardContent>
		</Card>
	</section>
{/if}

{#if hasLocations}
	<ConstellationDivider />

	<section
		class="section-animate mx-auto max-w-4xl px-6 py-8 {locationsVisible
			? 'section-visible'
			: 'section-hidden'}"
		{@attach observeSection((v) => {
			locationsVisible = v;
		})}
	>
		<div class="mb-8 text-center">
			<p class="mb-3 text-xs font-medium tracking-[0.3em] text-primary/60 uppercase">
				✦ Locations ✦
			</p>
			<h2 class="text-2xl font-bold text-foreground">Star Chart</h2>
		</div>

		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			{#each world.locations ?? [] as location, i (location.name ?? i)}
				<Card class="location-card group overflow-hidden" style="--entrance-delay: {i * 60}ms">
					<CardContent class="p-5">
						<div class="mb-4 flex items-center gap-3">
							<div
								class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-lg group-hover:shadow-primary/10"
							>
								<Compass class="h-5 w-5 text-primary" />
							</div>
							<h3 class="truncate font-semibold text-foreground">
								{location.name || 'Unknown Location'}
							</h3>
						</div>

						{#if location.description}
							<p class="mb-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
								{location.description}
							</p>
						{/if}

						{#if location.connections && location.connections.length > 0}
							<div class="flex flex-wrap gap-1.5">
								{#each location.connections as connection, ci (ci)}
									<Badge variant="outline" class="text-xs">
										{connection}
									</Badge>
								{/each}
							</div>
						{/if}
					</CardContent>
				</Card>
			{/each}
		</div>
	</section>
{/if}

{#if hasEndings}
	<ConstellationDivider />

	<section
		class="section-animate mx-auto max-w-4xl px-6 py-8 {endingsVisible
			? 'section-visible'
			: 'section-hidden'}"
		{@attach observeSection((v) => {
			endingsVisible = v;
		})}
	>
		<div class="mb-8 text-center">
			<p class="mb-3 text-xs font-medium tracking-[0.3em] text-primary/60 uppercase">
				✦ Possible Endings ✦
			</p>
			<h2 class="text-2xl font-bold text-foreground">Possible Destinations</h2>
			<p class="mt-2 text-sm text-muted-foreground">Hover to reveal - but beware of spoilers</p>
		</div>

		<div class="mx-auto max-w-2xl space-y-3">
			{#each world.potential_endings ?? [] as ending, i (i)}
				<div
					class="ending-card group rounded-lg border border-border bg-card p-4 transition-all duration-300 hover:border-primary/30"
					style="--entrance-delay: {i * 80}ms"
				>
					<p
						class="ending-text text-sm text-muted-foreground transition-all duration-500 group-hover:text-foreground"
					>
						{ending}
					</p>
				</div>
			{/each}
		</div>
	</section>
{/if}

<style>
	.section-animate {
		transition:
			opacity 0.6s ease-out,
			transform 0.6s ease-out;
	}

	.section-hidden {
		opacity: 0;
		transform: translateY(24px);
	}

	.section-visible {
		opacity: 1;
		transform: translateY(0);
	}

	:global(.location-card) {
		animation: card-enter 0.5s ease-out both;
		animation-delay: var(--entrance-delay, 0ms);
		transition:
			transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			border-color 0.3s ease;
	}

	:global(.location-card:hover) {
		transform: translateY(-3px);
		border-color: var(--primary);
		box-shadow:
			0 8px 24px oklch(from var(--primary) l c h / 0.1),
			0 2px 8px oklch(0 0 0 / 0.15);
	}

	@keyframes card-enter {
		from {
			opacity: 0;
			transform: translateY(16px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.ending-card {
		animation: card-enter 0.5s ease-out both;
		animation-delay: var(--entrance-delay, 0ms);
	}

	.ending-text {
		filter: blur(5px);
		user-select: none;
		transition: filter 0.5s ease;
	}

	.ending-card:hover .ending-text,
	.ending-card:focus-within .ending-text {
		filter: blur(0);
		user-select: auto;
	}

	@media (prefers-reduced-motion: reduce) {
		.section-animate {
			transition: none;
		}
		.section-hidden {
			opacity: 1;
			transform: none;
		}
		:global(.location-card) {
			animation: none;
			opacity: 1;
		}
		:global(.location-card:hover) {
			transform: none;
		}
		.ending-card {
			animation: none;
			opacity: 1;
		}
	}
</style>
