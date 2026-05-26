export function queryValue(url: URL, key: string): string {
	return url.searchParams.get(key)?.trim() ?? '';
}

export function routeWithQuery(
	url: URL,
	updates: Record<string, string | null | undefined>
): string {
	const next = new URL(url);

	for (const [key, value] of Object.entries(updates)) {
		const cleaned = value?.trim();
		if (cleaned) {
			next.searchParams.set(key, cleaned);
		} else {
			next.searchParams.delete(key);
		}
	}

	return `${next.pathname}${next.search}`;
}
