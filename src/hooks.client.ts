import type { HandleClientError } from '@sveltejs/kit';
import * as Sentry from '@sentry/sveltekit';
import posthog from 'posthog-js';
import { PUBLIC_POSTHOG_PROJECT_TOKEN, PUBLIC_POSTHOG_HOST } from '$env/static/public';
import { ENV, SENTRY_RELEASE, isLocalEnvironment } from '$lib/config';

// Returns true only when it actually triggered a reload. Callers must gate
// preventDefault() on this: cancelling vite:preloadError makes __vitePreload
// resolve the dynamic import to `undefined` instead of rejecting, so if we
// suppress the error without reloading, SvelteKit's router dereferences the
// undefined route node and throws (e.g. "Cannot read properties of undefined
// (reading 'universal')"). When throttled, let the real chunk-load error
// propagate instead — it symbolicates into something readable.
function reloadIfStale(key: string): boolean {
	const last = sessionStorage.getItem(key);
	const now = Date.now();
	if (!last || now - parseInt(last) > 10_000) {
		sessionStorage.setItem(key, now.toString());
		window.location.reload();
		return true;
	}
	return false;
}

window.addEventListener('vite:preloadError', (event) => {
	if (reloadIfStale('vite:preloadError:reload')) {
		event.preventDefault();
	}
});

window.addEventListener('unhandledrejection', (event) => {
	const msg = event.reason instanceof Error ? event.reason.message : String(event.reason ?? '');
	if (
		msg.includes('is not a valid JavaScript MIME type') ||
		msg.includes('Failed to fetch dynamically imported module') ||
		msg.includes('error loading dynamically imported module')
	) {
		if (reloadIfStale('asset-load-error:reload')) {
			event.preventDefault();
		}
	}
});

if (!isLocalEnvironment) {
	Sentry.init({
		dsn: 'https://a737601da6d420d0745431649af5b18d@o4511032796905472.ingest.us.sentry.io/4511032822792192',
		environment: ENV,
		release: SENTRY_RELEASE || undefined,
		sendDefaultPii: true,
		tracesSampleRate: 0.1,
		replaysSessionSampleRate: 0.1,
		replaysOnErrorSampleRate: 1.0,
		ignoreErrors: [
			/runtime\.sendMessage/,
			/extension\//i,
			/^chrome-extension:\/\//,
			/^moz-extension:\/\//,
			/^safari-web-extension:\/\//
		],
		denyUrls: [
			/extensions\//i,
			/^chrome-extension:\/\//,
			/^moz-extension:\/\//,
			/^safari-web-extension:\/\//
		],
		integrations: [
			Sentry.replayIntegration(),
			Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] })
		]
	});
}

export async function init() {
	if (!isLocalEnvironment && PUBLIC_POSTHOG_PROJECT_TOKEN) {
		posthog.init(PUBLIC_POSTHOG_PROJECT_TOKEN, {
			api_host: PUBLIC_POSTHOG_HOST,
			ui_host: 'https://us.posthog.com',
			defaults: '2026-01-30',
			capture_exceptions: true
		});
		if (SENTRY_RELEASE) {
			posthog.register({ release: SENTRY_RELEASE });
		}
	}
}

const sentryHandleError: HandleClientError = Sentry.handleErrorWithSentry();

export const handleError: HandleClientError = (input) => {
	if (!isLocalEnvironment && posthog.__loaded) {
		try {
			posthog.captureException(input.error);
		} catch {
			// PostHog capture must never break error handling
		}
	}
	return sentryHandleError(input);
};
