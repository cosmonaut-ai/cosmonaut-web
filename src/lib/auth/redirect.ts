import { getItem, setItem, removeItem } from '$lib/utils/storage';

const REDIRECT_STORAGE_KEY = 'cosmonaut-auth-redirect';

/**
 * Returns true when `path` is a safe same-origin relative path.
 * Rejects absolute URLs, protocol-relative URLs, and javascript: URIs.
 */
function isSafeRedirect(path: string): boolean {
	if (!path.startsWith('/')) return false;
	if (path.startsWith('//')) return false;
	if (/^\/\\/.test(path)) return false;
	try {
		const url = new URL(path, 'http://localhost');
		if (url.protocol === 'javascript:') return false;
	} catch {
		return false;
	}
	return true;
}

/**
 * Persist a redirect URL so it survives page-leaving flows (e.g. Google OAuth).
 * Only stores safe same-origin paths.
 */
export function saveRedirectUrl(path: string): void {
	if (isSafeRedirect(path)) {
		setItem(REDIRECT_STORAGE_KEY, path);
	}
}

/**
 * Retrieve and clear the stored redirect URL.
 * Falls back to `/dashboard` when nothing is stored or the stored value is unsafe.
 */
export function consumeRedirectUrl(preferredPath?: string | null): string {
	const raw = preferredPath || getItem(REDIRECT_STORAGE_KEY);
	removeItem(REDIRECT_STORAGE_KEY);
	if (raw && isSafeRedirect(raw)) return raw;
	return '/dashboard';
}
