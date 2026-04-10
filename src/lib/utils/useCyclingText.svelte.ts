import { onMount } from 'svelte';
import { prefersReducedMotion } from '$lib/utils/media';

/**
 * Cycles through a list of text strings with a fade transition.
 * Skips the animation entirely when the user prefers reduced motion.
 */
export function useCyclingText(texts: () => string[], intervalMs = 3200, fadeMs = 400) {
	let index = $state(0);
	let visible = $state(true);

	onMount(() => {
		if (prefersReducedMotion) return;

		const interval = setInterval(() => {
			visible = false;
			setTimeout(() => {
				const list = texts();
				index = (index + 1) % list.length;
				visible = true;
			}, fadeMs);
		}, intervalMs);

		return () => clearInterval(interval);
	});

	return {
		get text() {
			const list = texts();
			return list[index % list.length] ?? '';
		},
		get visible() {
			return visible;
		},
		resetIndex() {
			index = 0;
			visible = true;
		}
	};
}
