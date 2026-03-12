import tailwindcss from '@tailwindcss/vite';
import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sentrySvelteKit({
			autoUploadSourceMaps: false
		}),
		sveltekit()
	],
	envPrefix: ['VITE_', 'PUBLIC_'],
	resolve: {
		dedupe: ['svelte']
	}
});
