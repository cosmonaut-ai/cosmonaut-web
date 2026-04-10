import { getItem, setItem, removeItem } from '$lib/utils/storage';

const REDIRECT_STORAGE_KEY = 'cosmonaut-auth-redirect';

/**
 * Persist a redirect URL so it survives page-leaving flows (e.g. Google OAuth).
 */
export function saveRedirectUrl(path: string): void {
	setItem(REDIRECT_STORAGE_KEY, path);
}

/**
 * Retrieve and clear the stored redirect URL.
 * Falls back to `/dashboard` when nothing is stored.
 */
export function consumeRedirectUrl(preferredPath?: string | null): string {
	const destination = preferredPath || getItem(REDIRECT_STORAGE_KEY);
	removeItem(REDIRECT_STORAGE_KEY);
	return destination || '/dashboard';
}
