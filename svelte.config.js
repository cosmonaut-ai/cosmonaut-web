import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		dev: process.env.NODE_ENV !== 'production'
	},
	kit: {
		adapter: adapter({
			// Emit the SPA fallback as 200.html so it doesn't overwrite the
			// prerendered homepage (which lands at build/index.html). CloudFront
			// must route 403/404 → /200.html for client-side SPA routes to keep
			// working. See .github/workflows/deploy.yml for the upload step.
			fallback: '200.html'
		}),
		version: {
			pollInterval: 15_000
		},
		paths: {
			relative: false
		}
	}
};

export default config;
