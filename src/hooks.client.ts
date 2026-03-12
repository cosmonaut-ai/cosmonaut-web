import * as Sentry from '@sentry/sveltekit';
import { isLocalEnvironment, isDevEnvironment } from '$lib/config';

if (!isLocalEnvironment && !isDevEnvironment) {
	Sentry.init({
		dsn: 'https://a737601da6d420d0745431649af5b18d@o4511032796905472.ingest.us.sentry.io/4511032822792192',
		sendDefaultPii: true,
		tracesSampleRate: 0.1,
		replaysSessionSampleRate: 0.1,
		replaysOnErrorSampleRate: 1.0,
		integrations: [Sentry.replayIntegration()]
	});
}

export const handleError = Sentry.handleErrorWithSentry();
