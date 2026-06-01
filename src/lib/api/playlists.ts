import { API_BASE_URL } from '$lib/config';
import { apiRequest } from './core';
import type { Playlist } from '$lib/types/api';

export async function getPlaylist(playlistId: string): Promise<Playlist> {
	return apiRequest<Playlist>(`${API_BASE_URL}/playlists/${playlistId}`);
}
