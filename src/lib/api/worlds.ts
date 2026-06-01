import type {
	World,
	CreateWorldRequest,
	CreateWorldResponse,
	UpdateWorldSharingRequest,
	InviteToken
} from '$lib/types/api';
import { API_BASE_URL } from '$lib/config';
import { apiRequest } from './core';

/** Display info returned by the user batch-lookup endpoint */
export interface UserInfo {
	id: string;
	display_name: string;
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
 * Create a new world and the owner's initial playthrough session.
 * Returns immediately; poll the returned session for generation completion.
 */
export async function createWorld(data: CreateWorldRequest): Promise<CreateWorldResponse> {
	return apiRequest<CreateWorldResponse>(`${API_BASE_URL}/worlds/`, {
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
