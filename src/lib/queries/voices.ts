import { createQuery } from '@tanstack/svelte-query';
import { listVoices } from '$lib/api/client';

/**
 * Query keys for voices
 */
export const voiceKeys = {
	all: ['voices'] as const
};

/**
 * Query hook to fetch the list of available TTS voices.
 * The voice list is static so we use `staleTime: Infinity` to cache it indefinitely.
 */
export function useVoices() {
	return createQuery(() => ({
		queryKey: voiceKeys.all,
		queryFn: listVoices,
		staleTime: Infinity
	}));
}
