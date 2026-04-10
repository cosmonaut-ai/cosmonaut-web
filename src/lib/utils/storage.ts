import { browser } from '$app/environment';

/**
 * Safe localStorage wrappers that handle environments where storage is
 * unavailable (SSR, private browsing restrictions, storage quota errors).
 */

export function getItem(key: string): string | null {
	if (!browser) return null;
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

export function setItem(key: string, value: string): void {
	if (!browser) return;
	try {
		localStorage.setItem(key, value);
	} catch {
		// quota exceeded or storage unavailable
	}
}

export function removeItem(key: string): void {
	if (!browser) return;
	try {
		localStorage.removeItem(key);
	} catch {
		// storage unavailable
	}
}
