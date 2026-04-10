import { prefersReducedMotion } from '$lib/utils/media';

interface IntersectionRevealOptions {
	onReveal: () => void;
	threshold?: number;
	once?: boolean;
}

/**
 * Svelte use:action that fires `onReveal` when the element scrolls into view.
 * Immediately reveals if the user prefers reduced motion.
 */
export function intersectionReveal(
	node: HTMLElement,
	options: IntersectionRevealOptions
) {
	const { onReveal, threshold = 0.15, once = true } = options;

	if (prefersReducedMotion) {
		onReveal();
		return;
	}

	const observer = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					onReveal();
					if (once) observer.unobserve(node);
				}
			}
		},
		{ threshold }
	);

	observer.observe(node);

	return {
		destroy() {
			observer.disconnect();
		}
	};
}
