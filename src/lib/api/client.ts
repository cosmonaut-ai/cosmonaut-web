import type {
	World,
	StoryNode,
	CreateWorldRequest,
	ApiError,
	StreamingCallback,
	ChooseRequest
} from '$lib/types/api';
import { API_BASE_URL, STREAMING_BASE_URL, isLocalEnvironment } from '$lib/config';
import { getAuthToken, refreshStreamingSession } from '$lib/auth/auth.svelte';

/**
 * Get authorization headers for API requests
 * @param forceRefresh - If true, forces a token refresh
 */
async function getAuthHeaders(forceRefresh = false): Promise<HeadersInit> {
	const token = await getAuthToken(forceRefresh);
	const headers: HeadersInit = {
		'Content-Type': 'application/json'
	};

	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	} else if (!isLocalEnvironment) {
		console.warn('No auth token available for API request');
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
 * Perform an authenticated API request with automatic retry on 401
 */
async function apiRequest<T>(
	url: string,
	options: RequestInit = {},
	retry = true,
	fetchFn: typeof fetch = fetch
): Promise<T> {
	const headers = await getAuthHeaders();
	const response = await fetchFn(url, {
		...options,
		headers: {
			...(headers as Record<string, string>),
			...(options.headers as Record<string, string>)
		}
	});

	if (response.status === 401 && retry && !isLocalEnvironment) {
		console.log('API returned 401, attempting token refresh and retry...');
		// Force token refresh
		const newHeaders = await getAuthHeaders(true);

		// Also refresh streaming session (sets signed cookies for CloudFront)
		// This is often required by the backend in addition to the Bearer token
		await refreshStreamingSession();

		// Retry once
		const retryResponse = await fetchFn(url, {
			...options,
			headers: {
				...(newHeaders as Record<string, string>),
				...(options.headers as Record<string, string>)
			}
		});

		return handleResponse<T>(retryResponse);
	}

	return handleResponse<T>(response);
}

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
 * Delete a world and all associated data
 */
export async function deleteWorld(worldId: string): Promise<void> {
	const headers = await getAuthHeaders();
	const response = await fetch(`${API_BASE_URL}/worlds/${worldId}`, {
		method: 'DELETE',
		headers
	});

	if (response.status === 401 && !isLocalEnvironment) {
		const retryHeaders = await getAuthHeaders(true);
		await refreshStreamingSession();
		const retryResponse = await fetch(`${API_BASE_URL}/worlds/${worldId}`, {
			method: 'DELETE',
			headers: retryHeaders
		});
		if (!retryResponse.ok) {
			const error: ApiError = await retryResponse.json().catch(() => ({
				detail: `HTTP ${retryResponse.status}: ${retryResponse.statusText}`
			}));
			throw new Error(error.detail || `HTTP ${retryResponse.status}: ${retryResponse.statusText}`);
		}
		return;
	}

	if (!response.ok) {
		const error: ApiError = await response.json().catch(() => ({
			detail: `HTTP ${response.status}: ${response.statusText}`
		}));
		throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
	}
}

/**
 * Get a specific story node
 */
export async function getNode(worldId: string, nodeId: string): Promise<StoryNode> {
	return apiRequest<StoryNode>(`${API_BASE_URL}/worlds/${worldId}/nodes/${nodeId}`);
}

/**
 * Get all nodes in a world
 */
export async function getWorldNodes(
	worldId: string,
	fetchFn: typeof fetch = fetch
): Promise<StoryNode[]> {
	return apiRequest<StoryNode[]>(`${API_BASE_URL}/worlds/${worldId}/nodes/`, {}, true, fetchFn);
}

/**
 * Make a choice and stream the new story node text
 * Uses the streaming endpoint with signed cookies
 * @param choice - Either { choiceIndex: number } for predefined choices or { customChoice: string } for custom text (max 200 chars)
 */
export async function makeChoiceStreaming(
	worldId: string,
	nodeId: string,
	choice: { choiceIndex: number } | { customChoice: string },
	onTextUpdate: StreamingCallback
): Promise<StoryNode> {
	const baseUrl = isLocalEnvironment ? API_BASE_URL : STREAMING_BASE_URL;
	const url = `${baseUrl}/worlds/${worldId}/nodes/${nodeId}/choose`;

	// Build request body based on choice type
	const requestBody: ChooseRequest =
		'choiceIndex' in choice
			? { choice_index: choice.choiceIndex, custom_choice: null }
			: { choice_index: null, custom_choice: choice.customChoice };

	// Ensure streaming session is valid (sets signed cookies)
	if (!isLocalEnvironment) {
		const sessionValid = await refreshStreamingSession();
		if (!sessionValid) {
			throw new Error('Failed to establish streaming session. Please log in again.');
		}
	}

	const headers = (await getAuthHeaders()) as Record<string, string>;

	let response = await fetch(url, {
		method: 'POST',
		headers,
		body: JSON.stringify(requestBody),
		credentials: 'include' // Include signed cookies
	});

	// Retry on auth errors
	if ((response.status === 401 || response.status === 403) && !isLocalEnvironment) {
		console.log('Streaming API returned auth error, refreshing session and retrying...');
		const refreshedToken = await getAuthToken(true);
		const sessionRefreshed = await refreshStreamingSession();

		if (refreshedToken && sessionRefreshed) {
			const retryHeaders = (await getAuthHeaders()) as Record<string, string>;

			response = await fetch(url, {
				method: 'POST',
				headers: retryHeaders,
				body: JSON.stringify(requestBody),
				credentials: 'include'
			});
		}
	}

	if (!response.ok) {
		const error: ApiError = await response.json().catch(() => ({
			detail: `HTTP ${response.status}: ${response.statusText}`
		}));
		throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
	}

	// Get the new node ID from the response header
	const newNodeId = response.headers.get('X-New-Node-Id');
	if (!newNodeId) {
		throw new Error('Server did not return X-New-Node-Id header');
	}

	// Check if this is a streaming response
	const contentType = response.headers.get('Content-Type') || '';

	if (contentType.includes('text/plain') || contentType.includes('text/event-stream')) {
		// Handle streaming SSE response
		const reader = response.body?.getReader();
		if (!reader) {
			throw new Error('No response body for streaming');
		}

		const decoder = new TextDecoder();
		let fullText = '';
		let buffer = '';

		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			// Decode the chunk and add to buffer
			buffer += decoder.decode(value, { stream: true });

			// Process complete SSE messages (lines ending with \n)
			const lines = buffer.split('\n');
			// Keep the last incomplete line in the buffer
			buffer = lines.pop() || '';

			for (const line of lines) {
				// SSE format: "data: content"
				if (line.startsWith('data: ')) {
					const content = line.slice(6); // Remove "data: " prefix

					// Check for completion marker
					if (content === '[DONE]') {
						// Signal streaming is complete
						onTextUpdate(fullText, true);
						break;
					}

					// Convert literal \n to actual newlines and append to full text
					const processedContent = content.replace(/\\n/g, '\n');
					fullText += processedContent;
					onTextUpdate(fullText, false);
				}
			}
		}

		// If we haven't received [DONE], signal completion anyway
		if (!fullText || buffer) {
			onTextUpdate(fullText, true);
		}

		// Fetch the full node to get all metadata (choices, etc.)
		// This node is created by the streaming process
		return await getNode(worldId, newNodeId);
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

	await makeChoiceStreaming(worldId, nodeId, { choiceIndex }, (text, done) => {
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
