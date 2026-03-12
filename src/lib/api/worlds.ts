import type { World, CreateWorldRequest, UpdateWorldSharingRequest } from '$lib/types/api';
import { API_BASE_URL } from '$lib/config';
import { apiRequest, MAX_POLL_ATTEMPTS, POLL_INTERVAL_MS } from './core';

/** Paginated response from the worlds list endpoint */
export interface PaginatedWorldsResponse {
	items: World[];
	next_cursor: string | null;
}

/**
 * Fetch a single page of worlds for the authenticated user.
 * Pass a cursor from a previous response to fetch subsequent pages.
 */
export async function getWorlds(cursor?: string | null): Promise<PaginatedWorldsResponse> {
	const url = new URL(`${API_BASE_URL}/worlds/`);
	if (cursor) url.searchParams.set('cursor', cursor);
	return apiRequest<PaginatedWorldsResponse>(url.toString());
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
