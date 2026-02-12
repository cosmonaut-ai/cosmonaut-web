import {
	ApiError,
	type Choice,
	type Voice,
	type World,
	type StoryNode,
	type CreateWorldRequest,
	type UpdateWorldSharingRequest,
	type StreamingCallback,
	type ChooseRequest
} from '$lib/types/api';
import type {
	UsageInfo,
	CheckoutRequest,
	CheckoutResponse,
	BillingPortalResponse
} from '$lib/types/subscription';
import { API_BASE_URL, STREAMING_BASE_URL, isLocalEnvironment } from '$lib/config';
import { getAuthToken, refreshStreamingSession } from '$lib/auth/auth.svelte';

/** Delay after streaming completes to ensure server-side persistence before re-fetching */
const POST_STREAM_DELAY_MS = 500;

/** Default polling interval for world generation status */
const POLL_INTERVAL_MS = 2_000;

/** Maximum number of polling attempts before timing out */
const MAX_POLL_ATTEMPTS = 120;

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
 * Handle API response and throw on error.
 * Gracefully handles 204 No Content (e.g. DELETE) by returning undefined.
 */
async function handleResponse<T>(response: Response): Promise<T> {
	if (!response.ok) {
		const errorBody: { detail?: string } = await response.json().catch(() => ({
			detail: `HTTP ${response.status}: ${response.statusText}`
		}));
		throw new ApiError(response.status, errorBody.detail || response.statusText);
	}
	// Handle empty responses (204 No Content or zero-length body)
	if (response.status === 204 || response.headers.get('content-length') === '0') {
		return undefined as T;
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
 * Choose an option and initialize a new story node (without generated text)
 * This is step 1 of the two-step generation flow.
 * @param choice - Either { choiceIndex: number } for predefined choices or { customChoice: string } for custom text (max 200 chars)
 * @param parentChoice - The Choice object from the parent node being selected
 * @returns The initialized StoryNode with generation_status: 'initialized' (no text yet)
 */
export async function chooseOption(
	worldId: string,
	nodeId: string,
	choice: { choiceIndex: number } | { customChoice: string },
	parentChoice?: Choice
): Promise<StoryNode> {
	const url = `${API_BASE_URL}/worlds/${worldId}/nodes/${nodeId}/choose`;

	// Build request body based on choice type
	const requestBody: ChooseRequest =
		'choiceIndex' in choice
			? { choice_index: choice.choiceIndex, custom_choice: null, parent_choice: parentChoice }
			: { choice_index: null, custom_choice: choice.customChoice, parent_choice: parentChoice };

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
		console.log('Streaming API returned auth error, refreshing session and retrying...');
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
						const status = content.startsWith('Quota exceeded') ? 429 : 500;
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

// ── Voices & Audio Narration ──

/**
 * Fetch the list of available TTS voices.
 * The list is static and can be cached indefinitely.
 */
export async function listVoices(): Promise<Voice[]> {
	return apiRequest<Voice[]>(`${API_BASE_URL}/voices/`);
}

/**
 * Generate audio narration for a completed story node with a specific voice.
 * Returns the permanent CDN URL of the generated MP3.
 * Idempotent: calling again for the same node + voice returns the cached URL without consuming quota.
 * @param voiceId - Internal voice ID from the /voices/ endpoint
 * @throws ApiError with status 429 when the user's audio quota is exceeded
 */
export async function generateNodeAudio(
	worldId: string,
	nodeId: string,
	voiceId: string
): Promise<{ audio_url: string }> {
	return apiRequest<{ audio_url: string }>(
		`${API_BASE_URL}/worlds/${worldId}/nodes/${nodeId}/audio`,
		{
			method: 'POST',
			body: JSON.stringify({ voice_id: voiceId })
		}
	);
}

// ── Subscription & Billing ──

/**
 * Get the authenticated user's current tier, usage counters, and limits
 */
export async function getUsage(): Promise<UsageInfo> {
	return apiRequest<UsageInfo>(`${API_BASE_URL}/auth/usage`);
}

/**
 * Create a Stripe Checkout Session for subscribing to a paid tier.
 * Returns a URL to redirect the user to Stripe's hosted checkout page.
 */
export async function createCheckoutSession(data: CheckoutRequest): Promise<CheckoutResponse> {
	return apiRequest<CheckoutResponse>(`${API_BASE_URL}/auth/checkout`, {
		method: 'POST',
		body: JSON.stringify(data)
	});
}

/**
 * Create a Stripe Billing Portal Session for managing an existing subscription.
 * Returns a URL to redirect the user to Stripe's hosted portal.
 * Only works for users who have subscribed (have a stripe_customer_id).
 */
export async function createBillingPortalSession(): Promise<BillingPortalResponse> {
	return apiRequest<BillingPortalResponse>(`${API_BASE_URL}/auth/billing-portal`, {
		method: 'POST'
	});
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
