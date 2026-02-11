import { browser } from '$app/environment';
import { initializeAuth } from '$lib/auth/auth.svelte';

export const ssr = false;
export const trailingSlash = 'always';

// Initialize auth before any page loads (browser-only for SSR/prerender safety)
export const load = async () => {
	if (browser) {
		await initializeAuth();
	}
	return {};
};
