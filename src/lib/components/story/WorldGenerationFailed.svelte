<script lang="ts">
	import { goto } from '$app/navigation';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Sparkles, ArrowLeft, RotateCcw } from '@lucide/svelte';
</script>

<div class="gen-failed-root">
	<!-- Warm radial gradient background -->
	<div class="gen-failed-bg" aria-hidden="true"></div>

	<header class="relative z-10 border-b border-border bg-card/50">
		<div class="mx-auto flex max-w-3xl items-center gap-4 px-6 py-4">
			<Button variant="ghost" size="sm" onclick={() => goto('/dashboard')} class="gap-2">
				<ArrowLeft class="h-4 w-4" />
				Back
			</Button>
		</div>
	</header>

	<main class="relative z-10 mx-auto max-w-3xl px-6 py-12">
		<Card class="border-destructive/30">
			<CardContent class="py-12">
				<div class="flex flex-col items-center">
					<div
						class="gen-failed-icon mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-destructive/30 bg-destructive/10"
					>
						<Sparkles class="h-10 w-10 text-destructive" />
					</div>

					<h2 class="mb-2 text-2xl font-bold text-foreground">Something Went Wrong</h2>
					<p class="mb-2 max-w-md text-center text-muted-foreground">
						We hit a snag while forging your world. These things happen — the cosmos can be
						unpredictable.
					</p>
					<p class="mb-8 text-center text-sm text-muted-foreground/70">
						Your prompt is safe. Give it another shot and we'll try again.
					</p>

					<div class="flex items-center gap-3">
						<Button variant="outline" onclick={() => goto('/dashboard')} class="gap-2">
							<ArrowLeft class="h-4 w-4" />
							Dashboard
						</Button>
						<Button onclick={() => goto('/worlds/new')} class="gap-2">
							<RotateCcw class="h-4 w-4" />
							Try Again
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	</main>
</div>

<style>
	.gen-failed-root {
		height: 100%;
		overflow-y: auto;
		background: var(--background);
		position: relative;
	}

	/* Warm gradient glow behind the content */
	.gen-failed-bg {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: radial-gradient(
			ellipse 60% 40% at 50% 30%,
			oklch(0.5 0.15 15 / 0.06) 0%,
			transparent 70%
		);
	}

	/* Shake on mount */
	.gen-failed-icon {
		animation: icon-shake 0.5s ease-out 0.2s both;
	}

	@keyframes icon-shake {
		0% {
			transform: translateX(0);
		}
		15% {
			transform: translateX(-6px) rotate(-2deg);
		}
		30% {
			transform: translateX(5px) rotate(1.5deg);
		}
		45% {
			transform: translateX(-4px) rotate(-1deg);
		}
		60% {
			transform: translateX(3px) rotate(0.5deg);
		}
		75% {
			transform: translateX(-1px);
		}
		100% {
			transform: translateX(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.gen-failed-icon {
			animation: none;
		}
	}
</style>
