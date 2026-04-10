import { browser } from '$app/environment';

declare global {
	interface Window {
		gtag: (...args: [string, ...unknown[]]) => void;
	}
}

const MEASUREMENT_ID = import.meta.env.PUBLIC_GA_MEASUREMENT_ID || 'G-JMQKVCPEDF';

export function trackEvent(name: string, params?: Record<string, string | number | boolean>) {
	if (!browser || typeof window.gtag !== 'function') return;
	window.gtag('event', name, params);
}

export function trackPageView(path: string, title?: string) {
	if (!browser || typeof window.gtag !== 'function') return;
	window.gtag('config', MEASUREMENT_ID, {
		page_path: path,
		page_title: title
	});
}
