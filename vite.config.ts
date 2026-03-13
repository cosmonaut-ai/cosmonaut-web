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
						release: { name: process.env.PUBLIC_SENTRY_RELEASE },
						sourcemaps: { filesToDeleteAfterUpload: ['./build/**/*.map'] }
					}
				: undefined
		}),
		sveltekit()
	],
	envPrefix: ['VITE_', 'PUBLIC_'],
	resolve: {
		dedupe: ['svelte']
	}
});
