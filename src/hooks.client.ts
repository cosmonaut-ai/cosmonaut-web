import * as Sentry from '@sentry/sveltekit';
import { ENV, SENTRY_RELEASE, isLocalEnvironment } from '$lib/config';

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

export const handleError = Sentry.handleErrorWithSentry();
