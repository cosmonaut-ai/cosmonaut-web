import type { Voice } from '$lib/types/api';
import { API_BASE_URL } from '$lib/config';
import { apiRequest } from './core';

/**
 * Fetch the list of available TTS voices.
 * The list is static and can be cached indefinitely.
 */
export async function listVoices(): Promise<Voice[]> {
	return apiRequest<Voice[]>(`${API_BASE_URL}/voices/`);
}

/**
 * Generate audio narration for a completed story node with a specific voice.
 * Returns the permanent CDN URL of the generated MP3.
 * Idempotent: calling again for the same node + voice returns the cached URL without consuming quota.
 * @param voiceId - Internal voice ID from the /voices/ endpoint
 * @throws ApiError with status 429 when the user's audio quota is exceeded
 */
export async function generateNodeAudio(
	worldId: string,
	nodeId: string,
	voiceId: string
): Promise<{ audio_url: string; timestamps_url?: string | null }> {
	return apiRequest<{ audio_url: string; timestamps_url?: string | null }>(
		`${API_BASE_URL}/worlds/${worldId}/nodes/${nodeId}/audio`,
		{
			method: 'POST',
			body: JSON.stringify({ voice_id: voiceId })
		}
	);
}
