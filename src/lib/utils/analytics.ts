import { browser } from '$app/environment';
import posthog from 'posthog-js';

declare global {
	interface Window {
		gtag: (...args: [string, ...unknown[]]) => void;
	}
}

const MEASUREMENT_ID = import.meta.env.PUBLIC_GA_MEASUREMENT_ID || 'G-JMQKVCPEDF';

export function trackEvent(name: string, params?: Record<string, string | number | boolean>) {
	if (!browser) return;
	if (typeof window.gtag === 'function') window.gtag('event', name, params);
	posthog.capture(name, params);
}

export function trackPageView(path: string, title?: string) {
	if (!browser || typeof window.gtag !== 'function') return;
	window.gtag('config', MEASUREMENT_ID, {
		page_path: path,
		page_title: title
	});
}

export function identifyUser(distinctId: string, properties?: Record<string, string | undefined>) {
	if (!browser) return;
	posthog.identify(distinctId, properties);
}

export function resetUser() {
	if (!browser) return;
	posthog.reset();
}
