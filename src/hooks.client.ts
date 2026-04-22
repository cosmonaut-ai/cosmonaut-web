import * as Sentry from '@sentry/sveltekit';
import posthog from 'posthog-js';
import { PUBLIC_POSTHOG_PROJECT_TOKEN, PUBLIC_POSTHOG_HOST } from '$env/static/public';
import { ENV, SENTRY_RELEASE, isLocalEnvironment } from '$lib/config';

function reloadIfStale(key: string) {
	const last = sessionStorage.getItem(key);
	const now = Date.now();
	if (!last || now - parseInt(last) > 10_000) {
		sessionStorage.setItem(key, now.toString());
		window.location.reload();
	}
}

window.addEventListener('vite:preloadError', (event) => {
	event.preventDefault();
	reloadIfStale('vite:preloadError:reload');
});

window.addEventListener('unhandledrejection', (event) => {
	const msg = event.reason instanceof Error ? event.reason.message : String(event.reason ?? '');
	if (
		msg.includes('is not a valid JavaScript MIME type') ||
		msg.includes('Failed to fetch dynamically imported module') ||
		msg.includes('error loading dynamically imported module')
	) {
		event.preventDefault();
		reloadIfStale('asset-load-error:reload');
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
		integrations: [
			Sentry.replayIntegration(),
			Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] })
		]
	});
}

export async function init() {
	posthog.init(PUBLIC_POSTHOG_PROJECT_TOKEN, {
		api_host: PUBLIC_POSTHOG_HOST,
		ui_host: 'https://us.posthog.com',
		defaults: '2026-01-30',
		capture_exceptions: true
	});
}

export const handleError = Sentry.handleErrorWithSentry();
