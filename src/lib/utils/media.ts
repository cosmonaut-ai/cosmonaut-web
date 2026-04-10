import { browser } from '$app/environment';

/**
 * Whether the user has requested reduced motion via their OS/browser settings.
 * Evaluated once at module load time; does not react to runtime changes.
 */
export const prefersReducedMotion = browser
	? window.matchMedia('(prefers-reduced-motion: reduce)').matches
	: false;
