export type StatusBadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

/**
 * Returns the Badge variant for a world generation status.
 */
export function getStatusBadgeVariant(status: string): StatusBadgeVariant {
	switch (status) {
		case 'completed':
			return 'default';
		case 'failed':
			return 'destructive';
		default:
			return 'secondary';
	}
}

/**
 * Returns human-readable text for a world generation status.
 */
export function getStatusText(status: string): string {
	switch (status) {
		case 'completed':
			return 'Ready';
		case 'generating_lore':
			return 'Generating Lore';
		case 'generating_narrator_profile':
			return 'Creating Narrator';
		case 'generating_start_node':
			return 'Generating Story';
		case 'initialized':
			return 'Initializing';
		case 'failed':
			return 'Failed';
		default:
			return status;
	}
}
