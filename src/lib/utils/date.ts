/**
 * Formats a date string for display (e.g. "January 15, 2025").
 * Returns 'N/A' when the date is null or empty.
 */
export function formatDate(dateStr: string | null): string {
	if (!dateStr) return 'N/A';
	return new Date(dateStr).toLocaleDateString('en-US', {
		month: 'long',
		day: 'numeric',
		year: 'numeric'
	});
}

/**
 * Formats a reset date with relative messaging (e.g. "Resets tomorrow.", "Resets in 3 days.", "Resets Jan 15").
 * Returns empty string when the date is null or empty.
 */
export function formatResetDate(dateStr: string | null): string {
	if (!dateStr) return '';
	const date = new Date(dateStr);
	const now = new Date();
	const diffMs = date.getTime() - now.getTime();
	const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

	if (diffDays <= 0) return 'Resets soon.';
	if (diffDays === 1) return 'Resets tomorrow.';
	if (diffDays <= 7) return `Resets in ${diffDays} days.`;

	return `Resets ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`;
}
