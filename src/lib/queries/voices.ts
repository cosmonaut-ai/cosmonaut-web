import { createQuery } from '@tanstack/svelte-query';
import { listVoices } from '$lib/api/voices';
import { queryKeys } from './keys';

/**
 * Query hook to fetch the list of available TTS voices.
 * The voice list is static so we use `staleTime: Infinity` to cache it indefinitely.
 */
export function useVoices() {
	return createQuery(() => ({
		queryKey: queryKeys.voices.all,
		queryFn: listVoices,
		staleTime: Infinity
	}));
}
