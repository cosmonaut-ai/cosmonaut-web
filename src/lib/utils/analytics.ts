import { browser } from '$app/environment';
import posthog from 'posthog-js';

declare global {
	interface Window {
		gtag: (...args: [string, ...unknown[]]) => void;
	}
}

const MEASUREMENT_ID = import.meta.env.PUBLIC_GA_MEASUREMENT_ID || 'G-JMQKVCPEDF';

function isPostHogReady(): boolean {
	return typeof posthog !== 'undefined' && posthog.__loaded === true;
}

export function trackEvent(name: string, params?: Record<string, string | number | boolean>) {
	if (!browser) return;
	if (typeof window.gtag === 'function') window.gtag('event', name, params);
	if (isPostHogReady()) posthog.capture(name, params);
}

export function trackPageView(path: string, title?: string) {
	if (!browser) return;
	if (typeof window.gtag === 'function') {
		window.gtag('config', MEASUREMENT_ID, {
			page_path: path,
			page_title: title
		});
	}
	if (isPostHogReady()) {
		posthog.capture('$pageview', {
			$current_url: window.location.origin + path,
			$title: title
		});
	}
}

export function identifyUser(distinctId: string, properties?: Record<string, string | undefined>) {
	if (!browser) return;
	if (isPostHogReady()) posthog.identify(distinctId, properties);
}

export function resetUser() {
	if (!browser) return;
	if (isPostHogReady()) posthog.reset();
}

export function getPostHogDistinctId(): string | undefined {
	if (!browser || !isPostHogReady()) return undefined;
	return posthog.get_distinct_id();
}

export function getPostHogSessionId(): string | undefined {
	if (!browser || !isPostHogReady()) return undefined;
	return posthog.get_session_id();
}
