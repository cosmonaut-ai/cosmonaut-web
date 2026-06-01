import type {
	CreateWorldSessionRequest,
	SessionLinkHandoff,
	WorldSession,
	WorldSessionSummary
} from '$lib/types/api';
import { API_BASE_URL } from '$lib/config';
import { apiRequest } from './core';

/** Paginated response from the sessions list endpoint */
export interface PaginatedSessionsResponse {
	items: WorldSessionSummary[];
	next_cursor: string | null;
}

/**
 * Fetch a single page of playthrough sessions for the authenticated user.
 */
export async function getSessions(cursor?: string | null): Promise<PaginatedSessionsResponse> {
	const url = new URL(`${API_BASE_URL}/sessions/`);
	if (cursor) url.searchParams.set('cursor', cursor);
	return apiRequest<PaginatedSessionsResponse>(url.toString());
}

/**
 * Fetch session detail, including the embedded root world.
 */
export async function getSession(sessionId: string): Promise<WorldSession> {
	return apiRequest<WorldSession>(`${API_BASE_URL}/sessions/${sessionId}`);
}

/**
 * Resolve an accessible session link to its canonical root world.
 */
export async function getSessionHandoff(sessionId: string): Promise<SessionLinkHandoff> {
	return apiRequest<SessionLinkHandoff>(`${API_BASE_URL}/sessions/${sessionId}/handoff`);
}

/**
 * Find or create the current user's session for a root world.
 */
export async function createWorldSession(
	worldId: string,
	data: CreateWorldSessionRequest = {}
): Promise<WorldSession> {
	return apiRequest<WorldSession>(`${API_BASE_URL}/worlds/${worldId}/sessions`, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

/**
 * Remove a playthrough session from the user's library.
 */
export async function deleteSession(sessionId: string): Promise<void> {
	await apiRequest<void>(`${API_BASE_URL}/sessions/${sessionId}`, { method: 'DELETE' });
}
