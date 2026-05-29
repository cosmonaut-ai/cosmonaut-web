import type { SubscriptionTier } from '$lib/types/subscription';

export const ADMIN_TIERS: SubscriptionTier[] = ['FREE', 'EXPLORER', 'COSMONAUT'];

export function formatDate(value: string | null | undefined): string {
	if (!value) return 'N/A';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}

export function formatDateTime(value: string | null | undefined): string {
	if (!value) return 'N/A';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return value;
	return date.toLocaleString('en-US', {
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit'
	});
}

export function formatNumber(value: number | null | undefined): string {
	if (value == null) return 'N/A';
	return new Intl.NumberFormat('en-US').format(value);
}

export function formatBoolean(value: boolean | null | undefined): string {
	if (value == null) return 'N/A';
	return value ? 'Yes' : 'No';
}

export function formatFileSize(value: string | number | null | undefined): string {
	if (value == null || value === '') return 'N/A';
	const bytes = typeof value === 'number' ? value : Number(value);
	if (!Number.isFinite(bytes)) return String(value);
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDuration(value: string | number | null | undefined): string {
	if (value == null || value === '') return 'N/A';
	const seconds = typeof value === 'number' ? value : Number(value);
	if (!Number.isFinite(seconds)) return String(value);
	const rounded = Math.round(seconds);
	const minutes = Math.floor(rounded / 60);
	const remainder = rounded % 60;
	return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export function formatScore(value: string | number | null | undefined): string {
	if (value == null || value === '') return 'N/A';
	const score = typeof value === 'number' ? value : Number(value);
	if (!Number.isFinite(score)) return String(value);
	return score.toFixed(1);
}

export function shortId(value: string | null | undefined): string {
	if (!value) return 'N/A';
	return value.length > 12 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value;
}

export function normalizeTier(value: string | null | undefined): SubscriptionTier {
	return ADMIN_TIERS.includes(value as SubscriptionTier) ? (value as SubscriptionTier) : 'FREE';
}

export function tierClass(tier: string | null | undefined): string {
	if (tier === 'COSMONAUT') return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
	if (tier === 'EXPLORER') return 'border-primary/30 bg-primary/10 text-primary';
	return 'border-border bg-muted text-muted-foreground';
}

export function statusClass(enabled: boolean | null | undefined): string {
	if (enabled === false) return 'border-destructive/30 bg-destructive/10 text-destructive';
	return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
}

export function visibilityClass(visibility: string | null | undefined): string {
	if (visibility === 'public') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
	if (visibility === 'unlisted') return 'border-sky-500/30 bg-sky-500/10 text-sky-300';
	return 'border-border bg-muted text-muted-foreground';
}

export function soundtrackStatusClass(status: string | null | undefined): string {
	if (status === 'active') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
	if (status === 'draft') return 'border-sky-500/30 bg-sky-500/10 text-sky-300';
	if (status === 'rejected') return 'border-destructive/30 bg-destructive/10 text-destructive';
	if (status === 'disabled') return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
	return 'border-border bg-muted text-muted-foreground';
}

export function contentRatingClass(rating: string | null | undefined): string {
	if (rating === 'child') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
	if (rating === 'teen') return 'border-sky-500/30 bg-sky-500/10 text-sky-300';
	if (rating === 'adult') return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
	return 'border-border bg-muted text-muted-foreground';
}
