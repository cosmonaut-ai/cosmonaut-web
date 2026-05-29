import { API_BASE_URL } from '$lib/config';
import type { StoryNode, World } from '$lib/types/api';
import type { SubscriptionTier } from '$lib/types/subscription';
import { apiRequest } from './core';

export interface PaginatedAdminResponse<T> {
	items: T[];
	next_cursor: string | null;
}

export interface AdminCognitoUser {
	username: string | null;
	cognito_username: string | null;
	sub: string;
	email: string;
	tier: string;
	stripe_customer_id: string | null;
	email_verified: boolean | null;
	created_at: string | null;
	status: string | null;
	enabled: boolean | null;
}

export interface AdminUserUsage {
	user_id: string;
	username: string | null;
	is_onboarded: boolean;
	tier: SubscriptionTier;
	stripe_customer_id: string | null;
	nodes_used: number;
	worlds_created: number;
	audio_narrations_used: number;
	saved_world_count: number;
	period_end: string | null;
	subscription_status: string | null;
	pending_cancellation: boolean;
	cancellation_date: string | null;
	pending_tier: SubscriptionTier | null;
	pending_tier_date: string | null;
	newsletter_opted_in: boolean;
	created_at: string | null;
	updated_at: string | null;
}

export interface AdminTierUpdateResponse {
	success: boolean;
	tier: SubscriptionTier;
	warning: string | null;
}

export interface AdminUserGroupsResponse {
	groups: string[];
}

export interface AdminBanResponse {
	status: 'banned';
	sessions_revoked: boolean;
}

export interface AdminStatusResponse {
	status: string;
}

export interface AdminFeaturedOrderItem {
	world_id: string;
	featured_order: number;
}

export type SoundtrackStatus = 'draft' | 'active' | 'disabled' | 'rejected';
export type SoundtrackContentRating = 'child' | 'teen' | 'adult';
export type SoundtrackLoopStrategy = 'crossfade' | 'fade_restart' | 'none';
export type SoundtrackProvider = 'suno';

export interface Soundtrack {
	id: string | null;
	status: SoundtrackStatus;
	title: string | null;
	description: string | null;
	prompt: string | null;
	audio_url: string | null;
	s3_key: string | null;
	file_size_bytes: number | null;
	duration_seconds: number | null;
	content_type: string | null;
	content_rating: SoundtrackContentRating;
	loop_strategy: SoundtrackLoopStrategy;
	provider: SoundtrackProvider;
	provider_track_id: string | null;
	generated_at: string | null;
	pinecone_record_id: string | null;
	pinecone_upserted_at: string | null;
	quality_score: number | null;
	curation_notes: string | null;
	created_by: string | null;
	reviewed_by: string | null;
	reviewed_at: string | null;
	created_at: string | null;
	updated_at: string | null;
}

export interface SoundtrackUpdatePayload {
	status?: SoundtrackStatus;
	title?: string | null;
	description?: string | null;
	prompt?: string | null;
	file_size_bytes?: number | null;
	duration_seconds?: number | null;
	content_type?: string | null;
	content_rating?: SoundtrackContentRating;
	loop_strategy?: SoundtrackLoopStrategy;
	provider?: SoundtrackProvider;
	provider_track_id?: string | null;
	generated_at?: string | null;
	quality_score?: number | null;
	curation_notes?: string | null;
}

interface ListAdminUsersOptions {
	emailPrefix?: string;
	cursor?: string | null;
	limit?: number;
}

interface ListAdminWorldsOptions {
	search?: string;
	cursor?: string | null;
	limit?: number;
}

interface CursorOptions {
	cursor?: string | null;
	limit?: number;
}

interface ListAdminSoundtracksOptions extends CursorOptions {
	status?: SoundtrackStatus | null;
}

export async function listAdminUsers({
	emailPrefix,
	cursor,
	limit = 60
}: ListAdminUsersOptions = {}): Promise<PaginatedAdminResponse<AdminCognitoUser>> {
	const url = new URL(`${API_BASE_URL}/admin/users`);
	url.searchParams.set('limit', String(limit));
	if (emailPrefix) url.searchParams.set('email_prefix', emailPrefix);
	if (cursor) url.searchParams.set('cursor', cursor);
	return apiRequest<PaginatedAdminResponse<AdminCognitoUser>>(url.toString());
}

export async function getAdminUser(userId: string): Promise<AdminCognitoUser> {
	return apiRequest<AdminCognitoUser>(`${API_BASE_URL}/admin/users/${userId}`);
}

export async function getAdminUserUsage(userId: string): Promise<AdminUserUsage> {
	return apiRequest<AdminUserUsage>(`${API_BASE_URL}/admin/users/${userId}/usage`);
}

export async function getAdminUserGroups(userId: string): Promise<string[]> {
	const response = await apiRequest<AdminUserGroupsResponse>(
		`${API_BASE_URL}/admin/users/${userId}/groups`
	);
	return response.groups;
}

export async function listAdminUserWorlds(
	userId: string,
	{ cursor, limit = 50 }: CursorOptions = {}
): Promise<PaginatedAdminResponse<World>> {
	const url = new URL(`${API_BASE_URL}/admin/users/${userId}/worlds`);
	url.searchParams.set('limit', String(limit));
	if (cursor) url.searchParams.set('cursor', cursor);
	return apiRequest<PaginatedAdminResponse<World>>(url.toString());
}

export async function updateAdminUserTier(
	userId: string,
	tier: SubscriptionTier
): Promise<AdminTierUpdateResponse> {
	return apiRequest<AdminTierUpdateResponse>(`${API_BASE_URL}/admin/users/${userId}/tier`, {
		method: 'PATCH',
		body: JSON.stringify({ tier })
	});
}

export async function banAdminUser(userId: string): Promise<AdminBanResponse> {
	return apiRequest<AdminBanResponse>(`${API_BASE_URL}/admin/users/${userId}/ban`, {
		method: 'POST'
	});
}

export async function unbanAdminUser(userId: string): Promise<AdminStatusResponse> {
	return apiRequest<AdminStatusResponse>(`${API_BASE_URL}/admin/users/${userId}/unban`, {
		method: 'POST'
	});
}

export async function deleteAdminAccount(userId: string): Promise<AdminStatusResponse> {
	return apiRequest<AdminStatusResponse>(`${API_BASE_URL}/admin/users/${userId}`, {
		method: 'DELETE'
	});
}

export async function listAdminWorlds({
	search,
	cursor,
	limit = 50
}: ListAdminWorldsOptions = {}): Promise<PaginatedAdminResponse<World>> {
	const url = new URL(`${API_BASE_URL}/admin/worlds`);
	url.searchParams.set('limit', String(limit));
	if (search) url.searchParams.set('search', search);
	if (cursor) url.searchParams.set('cursor', cursor);
	return apiRequest<PaginatedAdminResponse<World>>(url.toString());
}

export async function getAdminWorld(worldId: string): Promise<World> {
	return apiRequest<World>(`${API_BASE_URL}/admin/worlds/${worldId}`);
}

export async function listAdminWorldNodes(
	worldId: string,
	{ cursor, limit = 100 }: CursorOptions = {}
): Promise<PaginatedAdminResponse<StoryNode>> {
	const url = new URL(`${API_BASE_URL}/admin/worlds/${worldId}/nodes`);
	url.searchParams.set('limit', String(limit));
	if (cursor) url.searchParams.set('cursor', cursor);
	return apiRequest<PaginatedAdminResponse<StoryNode>>(url.toString());
}

export async function deleteAdminWorld(worldId: string): Promise<void> {
	await apiRequest<void>(`${API_BASE_URL}/admin/worlds/${worldId}`, { method: 'DELETE' });
}

export async function listAdminFeaturedWorlds({ cursor, limit = 50 }: CursorOptions = {}): Promise<
	PaginatedAdminResponse<World>
> {
	const url = new URL(`${API_BASE_URL}/admin/featured`);
	url.searchParams.set('limit', String(limit));
	if (cursor) url.searchParams.set('cursor', cursor);
	return apiRequest<PaginatedAdminResponse<World>>(url.toString());
}

export async function promoteAdminWorld(worldId: string, order?: number | null): Promise<World> {
	return apiRequest<World>(`${API_BASE_URL}/admin/worlds/${worldId}/featured`, {
		method: 'POST',
		body: JSON.stringify({ order: order ?? null })
	});
}

export async function removeAdminWorldFromFeatured(worldId: string): Promise<World> {
	return apiRequest<World>(`${API_BASE_URL}/admin/worlds/${worldId}/featured`, {
		method: 'DELETE'
	});
}

export async function updateAdminFeaturedOrder(items: AdminFeaturedOrderItem[]): Promise<World[]> {
	return apiRequest<World[]>(`${API_BASE_URL}/admin/featured/order`, {
		method: 'PATCH',
		body: JSON.stringify({ items })
	});
}

export async function listAdminSoundtracks({
	status,
	cursor,
	limit = 50
}: ListAdminSoundtracksOptions = {}): Promise<PaginatedAdminResponse<Soundtrack>> {
	const url = new URL(`${API_BASE_URL}/admin/audio/soundtracks`);
	url.searchParams.set('limit', String(limit));
	if (status) url.searchParams.set('status', status);
	if (cursor) url.searchParams.set('cursor', cursor);
	return apiRequest<PaginatedAdminResponse<Soundtrack>>(url.toString());
}

export async function getAdminSoundtrack(soundtrackId: string): Promise<Soundtrack> {
	return apiRequest<Soundtrack>(`${API_BASE_URL}/admin/audio/soundtracks/${soundtrackId}`);
}

export async function updateAdminSoundtrack(
	soundtrackId: string,
	payload: SoundtrackUpdatePayload
): Promise<Soundtrack> {
	return apiRequest<Soundtrack>(`${API_BASE_URL}/admin/audio/soundtracks/${soundtrackId}`, {
		method: 'PATCH',
		body: JSON.stringify(payload)
	});
}

export async function deleteAdminSoundtrack(soundtrackId: string): Promise<void> {
	await apiRequest<void>(`${API_BASE_URL}/admin/audio/soundtracks/${soundtrackId}`, {
		method: 'DELETE'
	});
}
