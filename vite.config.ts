import tailwindcss from '@tailwindcss/vite';
import { sentrySvelteKit } from '@sentry/sveltekit';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const isCI = !!process.env.CI;

export default defineConfig({
	plugins: [
		tailwindcss(),
		sentrySvelteKit({
			autoUploadSourceMaps: isCI,
			sourceMapsUploadOptions: isCI
				? {
						org: process.env.SENTRY_ORG,
						project: process.env.SENTRY_PROJECT,
						authToken: process.env.SENTRY_AUTH_TOKEN,
						release: { name: process.env.PUBLIC_SENTRY_RELEASE }
						// Maps are kept on disk after Sentry upload so the PostHog CLI can
						// inject chunk IDs and upload them in CI; the deploy workflow
						// deletes all *.map files before syncing to S3.
					}
				: undefined
		}),
		sveltekit()
	],
	build: {
		// 'hidden': emit .map files without sourceMappingURL comments in the bundles.
		// Explicit so the Sentry plugin doesn't manage (and delete) maps itself.
		// CI-only so local builds (and the manual cleanup:* S3 syncs) never touch maps.
		sourcemap: isCI ? 'hidden' : false
	},
	envPrefix: ['VITE_', 'PUBLIC_'],
	resolve: {
		dedupe: ['svelte']
	}
});
