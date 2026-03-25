import type {
	World,
	CreateWorldRequest,
	UpdateWorldSharingRequest,
	InviteToken
} from '$lib/types/api';
import { API_BASE_URL } from '$lib/config';
import { apiRequest } from './core';

/** Paginated response from the worlds list endpoint */
export interface PaginatedWorldsResponse {
	items: World[];
	next_cursor: string | null;
}

/** Display info returned by the user batch-lookup endpoint */
export interface UserInfo {
	id: string;
	display_name: string;
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
 * Fetch featured public worlds, ordered by featured_order ascending.
 */
export async function getFeaturedWorlds(): Promise<World[]> {
	return apiRequest<World[]>(`${API_BASE_URL}/worlds/featured`);
}

/**
 * Get a specific world by ID, optionally with an invite token.
 */
export async function getWorld(worldId: string, invite?: string | null): Promise<World> {
	const url = new URL(`${API_BASE_URL}/worlds/${worldId}`);
	if (invite) url.searchParams.set('invite', invite);
	return apiRequest<World>(url.toString());
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
 * Remove a world from the user's library (deletes their session).
 */
export async function deleteWorld(worldId: string): Promise<void> {
	await apiRequest<void>(`${API_BASE_URL}/worlds/${worldId}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Invite tokens
// ---------------------------------------------------------------------------

export async function createInviteToken(worldId: string): Promise<InviteToken> {
	return apiRequest<InviteToken>(`${API_BASE_URL}/worlds/${worldId}/invite-token`, {
		method: 'POST'
	});
}

export async function getInviteToken(worldId: string): Promise<InviteToken | null> {
	return apiRequest<InviteToken | null>(`${API_BASE_URL}/worlds/${worldId}/invite-token`);
}

export async function deleteInviteToken(worldId: string): Promise<void> {
	await apiRequest<void>(`${API_BASE_URL}/worlds/${worldId}/invite-token`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// User lookup
// ---------------------------------------------------------------------------

export async function batchLookupUsers(ids: string[]): Promise<UserInfo[]> {
	if (ids.length === 0) return [];
	return apiRequest<UserInfo[]>(`${API_BASE_URL}/auth/users/batch?ids=${ids.join(',')}`);
}
