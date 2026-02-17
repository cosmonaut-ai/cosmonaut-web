import type { World, CreateWorldRequest, UpdateWorldSharingRequest } from '$lib/types/api';
import { API_BASE_URL } from '$lib/config';
import { apiRequest, MAX_POLL_ATTEMPTS, POLL_INTERVAL_MS } from './core';

/**
 * List all worlds for the authenticated user
 */
export async function getWorlds(): Promise<World[]> {
	return apiRequest<World[]>(`${API_BASE_URL}/worlds/`);
}

/**
 * Get a specific world by ID
 */
export async function getWorld(worldId: string): Promise<World> {
	return apiRequest<World>(`${API_BASE_URL}/worlds/${worldId}`);
}

/**
 * Create a new world (unified async endpoint)
 * Returns immediately with initial world data; poll getWorld() for completion
 */
export async function createWorld(data: CreateWorldRequest): Promise<World> {
	return apiRequest<World>(`${API_BASE_URL}/worlds/`, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

/**
 * Update world sharing settings (visibility and shared users)
 */
export async function updateWorldSharing(
	worldId: string,
	data: UpdateWorldSharingRequest
): Promise<World> {
	return apiRequest<World>(`${API_BASE_URL}/worlds/${worldId}/sharing`, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

/**
 * Delete a world and all associated data
 */
export async function deleteWorld(worldId: string): Promise<void> {
	await apiRequest<void>(`${API_BASE_URL}/worlds/${worldId}`, { method: 'DELETE' });
}

/**
 * Pre-warm the Gemini content cache for a world.
 * Fire-and-forget: errors are silently logged.
 */
export async function warmWorldCache(worldId: string): Promise<void> {
	try {
		await apiRequest<void>(`${API_BASE_URL}/worlds/${worldId}/warm-cache`, { method: 'POST' });
	} catch {
		// Non-critical: cache will be created on first generation if this fails
	}
}

/**
 * Poll for world generation completion
 * Returns when generation_status is 'completed' or 'failed'
 */
export async function pollWorldCompletion(
	worldId: string,
	onStatusUpdate?: (status: string) => void,
	maxAttempts = MAX_POLL_ATTEMPTS,
	intervalMs = POLL_INTERVAL_MS
): Promise<World> {
	for (let i = 0; i < maxAttempts; i++) {
		const world = await getWorld(worldId);

		if (onStatusUpdate) {
			onStatusUpdate(world.generation_status);
		}

		if (world.generation_status === 'completed') {
			return world;
		}

		if (world.generation_status === 'failed') {
			throw new Error('World generation failed. Please try again.');
		}

		// Wait before next poll
		await new Promise((resolve) => setTimeout(resolve, intervalMs));
	}

	throw new Error('World generation timed out');
}
