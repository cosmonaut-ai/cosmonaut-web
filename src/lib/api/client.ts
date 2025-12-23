import type { World, StoryNode, CreateWorldRequest, ApiError } from '$lib/types/api';

const API_BASE_URL = 'http://localhost:8000';

async function handleResponse<T>(response: Response): Promise<T> {
	if (!response.ok) {
		const error: ApiError = await response.json().catch(() => ({
			detail: `HTTP ${response.status}: ${response.statusText}`
		}));
		throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
	}
	return response.json();
}

export async function getWorlds(): Promise<World[]> {
	const response = await fetch(`${API_BASE_URL}/worlds`);
	return handleResponse<World[]>(response);
}

export async function getWorld(worldId: string): Promise<World> {
	const response = await fetch(`${API_BASE_URL}/worlds/${worldId}`);
	return handleResponse<World>(response);
}

export async function createWorld(data: CreateWorldRequest): Promise<World> {
	const response = await fetch(`${API_BASE_URL}/worlds/init`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data)
	});
	return handleResponse<World>(response);
}

export async function generateLore(worldId: string): Promise<World> {
	const response = await fetch(`${API_BASE_URL}/worlds/${worldId}/generate-lore`, {
		method: 'POST'
	});
	return handleResponse<World>(response);
}

export async function generateStartNode(worldId: string): Promise<World> {
	const response = await fetch(`${API_BASE_URL}/worlds/${worldId}/generate-start-node`, {
		method: 'POST'
	});
	return handleResponse<World>(response);
}

export async function getNode(worldId: string, nodeId: string): Promise<StoryNode> {
	const response = await fetch(`${API_BASE_URL}/worlds/${worldId}/nodes/${nodeId}`);
	return handleResponse<StoryNode>(response);
}

export async function makeChoice(
	worldId: string,
	nodeId: string,
	choiceIndex: number
): Promise<StoryNode> {
	const response = await fetch(
		`${API_BASE_URL}/worlds/${worldId}/nodes/${nodeId}/choose/${choiceIndex}`,
		{
			method: 'POST'
		}
	);
	return handleResponse<StoryNode>(response);
}

export async function deleteWorld(worldId: string): Promise<void> {
	const response = await fetch(`${API_BASE_URL}/worlds/${worldId}`, {
		method: 'DELETE'
	});
	if (!response.ok) {
		const error: ApiError = await response.json().catch(() => ({
			detail: `HTTP ${response.status}: ${response.statusText}`
		}));
		throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
	}
	// DELETE returns 204 No Content, so no JSON to parse
}

export async function getWorldNodes(
	worldId: string,
	fetchFn: typeof fetch = fetch
): Promise<StoryNode[]> {
	const response = await fetchFn(`${API_BASE_URL}/worlds/${worldId}/nodes`);
	return handleResponse<StoryNode[]>(response);
}
