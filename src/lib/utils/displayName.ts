/**
 * Derive a display name from available user data with a consistent fallback chain.
 */
export function getDisplayName(
	user: { username?: string | null; email?: string | null } | null | undefined,
	serverDisplayName?: string | null
): string {
	return user?.username || serverDisplayName || user?.email || 'User';
}
