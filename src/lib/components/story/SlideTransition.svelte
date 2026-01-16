<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { TransitionConfig } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	interface Props {
		key: string;
		direction: 'forward' | 'back';
		children: Snippet;
	}

	let { key, direction, children }: Props = $props();

	// Custom slide transition that only translates X (no opacity change)
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
		// Use 100% width translation to slide fully off-screen
		// We use percentage so it works regardless of container width
		return {
			delay,
			duration,
			easing,
			css: (t) => {
				// t goes from 0 to 1 for intro, 1 to 0 for outro
				// For forward navigation:
				//   - intro: slide from right (positive X) to center
				//   - outro: slide from center to left (negative X)
				// For back navigation:
				//   - intro: slide from left (negative X) to center
				//   - outro: slide from center to right (positive X)
				const isForward = direction === 'forward';
				const isIntro = dir === 'in';

				let translatePercent: number;
				if (isForward) {
					// Forward: in from right, out to left
					translatePercent = isIntro ? (1 - t) * 100 : (1 - t) * -100;
				} else {
					// Back: in from left, out to right
					translatePercent = isIntro ? (1 - t) * -100 : (1 - t) * 100;
				}

				return `transform: translateX(${translatePercent}%);`;
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
		/* Default: normal document flow to maintain container height */
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
