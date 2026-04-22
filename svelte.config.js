import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		dev: process.env.NODE_ENV !== 'production'
	},
	kit: {
		adapter: adapter({
			fallback: 'index.html'
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
