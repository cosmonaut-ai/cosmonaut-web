import type {
	World,
	StoryNode,
	CreateWorldRequest,
	ApiError,
	StreamingCallback
} from '$lib/types/api';
import { API_BASE_URL, STREAMING_BASE_URL, isLocalEnvironment } from '$lib/config';
import { getAuthToken, refreshStreamingSession } from '$lib/auth/auth.svelte';

/**
 * Get authorization headers for API requests
 */
async function getAuthHeaders(): Promise<HeadersInit> {
	const token = await getAuthToken();
	const headers: HeadersInit = {
		'Content-Type': 'application/json'
	};

	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	return headers;
}

/**
 * Handle API response and throw on error
 */
async function handleResponse<T>(response: Response): Promise<T> {
	if (!response.ok) {
		const error: ApiError = await response.json().catch(() => ({
			detail: `HTTP ${response.status}: ${response.statusText}`
		}));
		throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
	}
	return response.json();
}

/**
 * List all worlds for the authenticated user
 */
export async function getWorlds(): Promise<World[]> {
	const headers = await getAuthHeaders();
	const response = await fetch(`${API_BASE_URL}/worlds/`, { headers });
	return handleResponse<World[]>(response);
}

/**
 * Get a specific world by ID
 */
export async function getWorld(worldId: string): Promise<World> {
	const headers = await getAuthHeaders();
	const response = await fetch(`${API_BASE_URL}/worlds/${worldId}`, { headers });
	return handleResponse<World>(response);
}

/**
 * Create a new world (unified async endpoint)
 * Returns immediately with initial world data; poll getWorld() for completion
 */
export async function createWorld(data: CreateWorldRequest): Promise<World> {
	const headers = await getAuthHeaders();
	const response = await fetch(`${API_BASE_URL}/worlds/`, {
		method: 'POST',
		headers,
		body: JSON.stringify(data)
	});
	return handleResponse<World>(response);
}

/**
 * Delete a world and all associated data
 */
export async function deleteWorld(worldId: string): Promise<void> {
	const headers = await getAuthHeaders();
	const response = await fetch(`${API_BASE_URL}/worlds/${worldId}`, {
		method: 'DELETE',
		headers
	});
	if (!response.ok) {
		const error: ApiError = await response.json().catch(() => ({
			detail: `HTTP ${response.status}: ${response.statusText}`
		}));
		throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
	}
	// DELETE returns 204 No Content
}

/**
 * Get a specific story node
 */
export async function getNode(worldId: string, nodeId: string): Promise<StoryNode> {
	const headers = await getAuthHeaders();
	const response = await fetch(`${API_BASE_URL}/worlds/${worldId}/nodes/${nodeId}`, { headers });
	return handleResponse<StoryNode>(response);
}

/**
 * Get all nodes in a world
 */
export async function getWorldNodes(
	worldId: string,
	fetchFn: typeof fetch = fetch
): Promise<StoryNode[]> {
	const headers = await getAuthHeaders();
	const response = await fetchFn(`${API_BASE_URL}/worlds/${worldId}/nodes/`, { headers });
	return handleResponse<StoryNode[]>(response);
}

/**
 * Make a choice and stream the new story node text
 * Uses the streaming endpoint with signed cookies
 */
export async function makeChoiceStreaming(
	worldId: string,
	nodeId: string,
	choiceIndex: number,
	onTextUpdate: StreamingCallback
): Promise<StoryNode> {
	const baseUrl = isLocalEnvironment ? API_BASE_URL : STREAMING_BASE_URL;
	const url = `${baseUrl}/worlds/${worldId}/nodes/${nodeId}/choose/${choiceIndex}`;

	// Ensure streaming session is valid (sets signed cookies)
	if (!isLocalEnvironment) {
		const sessionValid = await refreshStreamingSession();
		if (!sessionValid) {
			throw new Error('Failed to establish streaming session. Please log in again.');
		}
	}

	const headers = await getAuthHeaders();
	// Remove Content-Type for streaming request
	delete (headers as Record<string, string>)['Content-Type'];

	let response = await fetch(url, {
		method: 'POST',
		headers,
		credentials: 'include' // Include signed cookies
	});

	// Retry on auth errors
	if (response.status === 401 || response.status === 403) {
		if (!isLocalEnvironment) {
			const refreshed = await refreshStreamingSession();
			if (refreshed) {
				response = await fetch(url, {
					method: 'POST',
					headers: await getAuthHeaders(),
					credentials: 'include'
				});
			}
		}
	}

	if (!response.ok) {
		const error: ApiError = await response.json().catch(() => ({
			detail: `HTTP ${response.status}: ${response.statusText}`
		}));
		throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
	}

	// Check if this is a streaming response
	const contentType = response.headers.get('Content-Type') || '';

	if (contentType.includes('text/plain')) {
		// Handle streaming text response
		const reader = response.body?.getReader();
		if (!reader) {
			throw new Error('No response body for streaming');
		}

		const decoder = new TextDecoder();
		let fullText = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			const chunk = decoder.decode(value, { stream: true });
			fullText += chunk;
			onTextUpdate(fullText, false);
		}

		// Signal streaming is complete
		onTextUpdate(fullText, true);

		// After streaming completes, fetch the full node to get all metadata
		// Wait a moment for the server to finish processing
		await new Promise((resolve) => setTimeout(resolve, 500));

		// Get the latest node - the response should have created a new node
		// We need to find it. For now, re-fetch the parent and find the choice target
		const parentNode = await getNode(worldId, nodeId);
		const choice = parentNode.choices[choiceIndex];

		if (choice?.target) {
			return await getNode(worldId, choice.target);
		}

		// If no target yet, construct a partial node from what we have
		return {
			id: '', // Will be populated when we can fetch it
			world_id: worldId,
			title: null,
			text: fullText,
			story_summary: null,
			choices: [],
			parent_id: nodeId,
			ancestors: [...(parentNode.ancestors || []), nodeId],
			processing_status: 'pending',
			created_at: new Date().toISOString()
		};
	} else {
		// Handle JSON response (pre-generated node)
		const node = (await response.json()) as StoryNode;
		onTextUpdate(node.text, true);
		return node;
	}
}

/**
 * Legacy makeChoice function - non-streaming fallback
 * For backwards compatibility with existing code
 */
export async function makeChoice(
	worldId: string,
	nodeId: string,
	choiceIndex: number
): Promise<StoryNode> {
	let resultNode: StoryNode | null = null;

	await makeChoiceStreaming(worldId, nodeId, choiceIndex, (text, done) => {
		if (done && !resultNode) {
			// This shouldn't happen in normal flow, but handle gracefully
			resultNode = {
				id: '',
				world_id: worldId,
				title: null,
				text,
				story_summary: null,
				choices: [],
				parent_id: nodeId,
				ancestors: [],
				processing_status: 'completed',
				created_at: new Date().toISOString()
			};
		}
	});

	// Wait for the streaming to complete and get the node
	if (resultNode) {
		return resultNode;
	}

	// Fallback: fetch the node directly after streaming
	const parentNode = await getNode(worldId, nodeId);
	const choice = parentNode.choices[choiceIndex];
	if (choice?.target) {
		return await getNode(worldId, choice.target);
	}

	throw new Error('Failed to get new node after choice');
}

/**
 * Poll for world generation completion
 * Returns when generation_status is 'completed' or 'failed'
 */
export async function pollWorldCompletion(
	worldId: string,
	onStatusUpdate?: (status: string) => void,
	maxAttempts = 120,
	intervalMs = 2000
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
