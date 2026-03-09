import type { StoryNode, ChooseRequest, StreamingCallback } from '$lib/types/api';
import { ApiError } from '$lib/types/api';
import { API_BASE_URL, STREAMING_BASE_URL, isLocalEnvironment } from '$lib/config';
import {
	getAuthToken,
	refreshStreamingSession,
	invalidateStreamingSession
} from '$lib/auth/auth.svelte';
import { apiRequest, getAuthHeaders, POST_STREAM_DELAY_MS } from './core';

/** Response from the progress endpoint */
export interface WorldProgressResponse {
	current_node_id: string | null;
}

/**
 * Get the authenticated user's last-visited node in a world
 */
export async function getWorldProgress(worldId: string): Promise<WorldProgressResponse> {
	return apiRequest<WorldProgressResponse>(`${API_BASE_URL}/worlds/${worldId}/progress`);
}

/**
 * Get a specific story node
 */
export async function getNode(worldId: string, nodeId: string): Promise<StoryNode> {
	return apiRequest<StoryNode>(`${API_BASE_URL}/worlds/${worldId}/nodes/${nodeId}`);
}

/** Paginated response from the nodes list endpoint */
interface PaginatedNodesResponse {
	nodes: StoryNode[];
	next_cursor: string | null;
}

/**
 * Get all nodes in a world (auto-paginating)
 */
export async function getWorldNodes(
	worldId: string,
	fetchFn: typeof fetch = fetch
): Promise<StoryNode[]> {
	const allNodes: StoryNode[] = [];
	let cursor: string | null = null;

	do {
		const url = new URL(`${API_BASE_URL}/worlds/${worldId}/nodes/`);
		if (cursor) url.searchParams.set('cursor', cursor);

		const page = await apiRequest<PaginatedNodesResponse>(url.toString(), {}, true, fetchFn);
		allNodes.push(...page.nodes);
		cursor = page.next_cursor;
	} while (cursor);

	return allNodes;
}

/**
 * Choose an option and initialize a new story node (without generated text)
 * This is step 1 of the two-step generation flow.
 * @param choice - Either { choiceIndex: number } for predefined choices or { customChoice: string } for custom text (max 200 chars)
 * @returns The initialized StoryNode with generation_status: 'initialized' (no text yet)
 */
export async function chooseOption(
	worldId: string,
	nodeId: string,
	choice: { choiceIndex: number } | { customChoice: string }
): Promise<StoryNode> {
	const url = `${API_BASE_URL}/worlds/${worldId}/nodes/${nodeId}/choose`;

	// Build request body based on choice type
	const requestBody: ChooseRequest =
		'choiceIndex' in choice
			? { choice_index: choice.choiceIndex, custom_choice: null }
			: { choice_index: null, custom_choice: choice.customChoice };

	return apiRequest<StoryNode>(url, {
		method: 'POST',
		body: JSON.stringify(requestBody)
	});
}

/**
 * Generate story text for an initialized node (streaming)
 * This is step 2 of the two-step generation flow.
 * Only works for nodes with generation_status: 'initialized' or 'failed'
 * @param worldId - The world ID
 * @param nodeId - The node ID to generate text for
 * @param onTextUpdate - Callback for streaming text updates
 * @returns The completed StoryNode with generated text
 */
export async function generateNodeText(
	worldId: string,
	nodeId: string,
	onTextUpdate: StreamingCallback
): Promise<StoryNode> {
	const baseUrl = isLocalEnvironment ? API_BASE_URL : STREAMING_BASE_URL;
	const url = `${baseUrl}/worlds/${worldId}/nodes/${nodeId}/generate-text`;

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
		credentials: 'include' // Include signed cookies
	});

	// Retry on auth errors
	if ((response.status === 401 || response.status === 403) && !isLocalEnvironment) {
		invalidateStreamingSession();
		const refreshedToken = await getAuthToken(true);
		const sessionRefreshed = await refreshStreamingSession();

		if (refreshedToken && sessionRefreshed) {
			const retryHeaders = (await getAuthHeaders()) as Record<string, string>;

			response = await fetch(url, {
				method: 'POST',
				headers: retryHeaders,
				credentials: 'include'
			});
		}
	}

	if (!response.ok) {
		const errorBody: { detail?: string } = await response.json().catch(() => ({
			detail: `HTTP ${response.status}: ${response.statusText}`
		}));
		throw new ApiError(response.status, errorBody.detail || response.statusText);
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

		let currentEventType = '';

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
				// Track SSE event type (e.g. "event: error")
				if (line.startsWith('event: ')) {
					currentEventType = line.slice(7).trim();
					continue;
				}

				// Empty line resets event type per SSE spec
				if (line === '') {
					currentEventType = '';
					continue;
				}

				// SSE format: "data: content"
				if (line.startsWith('data: ')) {
					const content = line.slice(6); // Remove "data: " prefix

					// Handle error events before processing as text
					if (currentEventType === 'error') {
						reader.cancel();
						let status = 500;
						if (content.startsWith('Quota exceeded')) {
							status = 429;
						} else if (/Cannot generate text for node/i.test(content)) {
							status = 400;
						}
						throw new ApiError(status, content);
					}

					// Reset event type after processing a data line
					currentEventType = '';

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

		// Wait briefly to ensure the node is fully updated on the server
		await new Promise((resolve) => setTimeout(resolve, POST_STREAM_DELAY_MS));

		// Fetch the full node to get all metadata (choices, title, etc.)
		return await getNode(worldId, nodeId);
	} else {
		// Handle JSON response (pre-generated node or already completed)
		const node = (await response.json()) as StoryNode;
		if (node.text) {
			onTextUpdate(node.text, true);
		}
		return node;
	}
}

/**
 * Retry background processing for a node with failed processing_status
 * This re-enqueues fact extraction and Pinecone upsert for nodes that
 * completed text generation but failed subsequent async processing.
 * @param worldId - The world ID
 * @param nodeId - The node ID to retry processing for
 * @returns The updated StoryNode with processing_status reset to 'pending'
 */
export async function retryNodeProcessing(worldId: string, nodeId: string): Promise<StoryNode> {
	return apiRequest<StoryNode>(
		`${API_BASE_URL}/worlds/${worldId}/nodes/${nodeId}/retry-processing`,
		{ method: 'POST' }
	);
}
