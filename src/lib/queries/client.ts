import { QueryClient } from '@tanstack/svelte-query';

/** How long fetched data is considered fresh before a background refetch is triggered */
const STALE_TIME_MS = 60_000; // 1 minute

/** How long inactive/unused cache entries are kept in memory */
const GC_TIME_MS = 300_000; // 5 minutes

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: STALE_TIME_MS,
			gcTime: GC_TIME_MS,
			retry: 1,
			refetchOnWindowFocus: false,
			refetchOnReconnect: true
		}
	}
});
