import { initializeAuth } from '$lib/auth/auth.svelte';

export const ssr = false;
export const trailingSlash = 'always';

// Initialize auth before any page loads
export const load = async () => {
	await initializeAuth();
	return {};
};
