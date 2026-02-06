<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { TransitionConfig } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { browser } from '$app/environment';

	interface Props {
		key: string;
		direction: 'forward' | 'back';
		children: Snippet;
	}

	let { key, direction, children }: Props = $props();

	/** Detect prefers-reduced-motion */
	const prefersReducedMotion = browser
		? window.matchMedia('(prefers-reduced-motion: reduce)').matches
		: false;

	// Custom slide transition with depth (translate + opacity + scale)
	// Falls back to a zero-duration no-op when reduced motion is preferred
	function slideX(
		node: Element,
		{
			direction: dir,
			duration = 300,
			delay = 0,
			easing = cubicOut
		}: {
			direction: 'in' | 'out';
			duration?: number;
			delay?: number;
			easing?: (t: number) => number;
		}
	): TransitionConfig {
		// When reduced motion is preferred, use instant transition
		if (prefersReducedMotion) {
			return { delay: 0, duration: 0 };
		}

		return {
			delay,
			duration,
			easing,
			css: (t) => {
				const isForward = direction === 'forward';
				const isIntro = dir === 'in';

				let translatePercent: number;
				if (isForward) {
					translatePercent = isIntro ? (1 - t) * 100 : (1 - t) * -100;
				} else {
					translatePercent = isIntro ? (1 - t) * -100 : (1 - t) * 100;
				}

				// Depth: fade and subtle scale on the outgoing element
				const opacity = isIntro ? 0.4 + t * 0.6 : 0.4 + t * 0.6;
				const scale = isIntro ? 0.97 + t * 0.03 : 0.97 + t * 0.03;

				return `transform: translateX(${translatePercent}%) scale(${scale}); opacity: ${opacity};`;
			}
		};
	}
</script>

<!--
	Container uses overflow-hidden to prevent horizontal scrollbar during animations.
	The outgoing element is positioned absolutely so it overlays the incoming element.
-->
<div class="slide-container">
	{#key key}
		<div
			class="slide-content"
			in:slideX={{ direction: 'in', duration: 350, delay: 100, easing: cubicOut }}
			out:slideX={{ direction: 'out', duration: 250, easing: cubicOut }}
			onintroend={(e) => {
				// After intro transition completes, move focus to the new content
				// for keyboard/screen reader users. Using tabindex -1 so it's
				// focusable but not in the tab order.
				const el = e.currentTarget;
				if (el instanceof HTMLElement) {
					el.focus({ preventScroll: true });
				}
			}}
			tabindex="-1"
			role="region"
			aria-label="Story content"
		>
			{@render children()}
		</div>
	{/key}
</div>

<style>
	.slide-container {
		position: relative;
		overflow: hidden;
	}

	.slide-content {
		will-change: transform, opacity;
	}

	/* When multiple children exist (during transition), position the FIRST (outgoing) element absolutely */
	/* The second (incoming) element stays in flow to maintain proper height */
	.slide-content:first-child:not(:only-child) {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		z-index: 1; /* Outgoing on top initially */
	}

	/* Incoming element (last-child during transition) stays in document flow */
	.slide-content:last-child {
		position: relative;
		z-index: 0;
	}

	/* Only child - normal flow */
	.slide-content:only-child {
		position: relative;
	}
</style>
