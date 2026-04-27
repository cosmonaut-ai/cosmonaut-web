import * as Sentry from '@sentry/sveltekit';
import { ApiError } from '$lib/types/api';
import { isLocalEnvironment } from '$lib/config';
import { logger } from '$lib/utils/logger';
import { getAuthToken } from '$lib/auth/auth.svelte';
import { getPostHogDistinctId, getPostHogSessionId } from '$lib/utils/analytics';
import { fetchWithAuthRetry } from './fetchWithAuthRetry';

/** Delay after streaming completes to ensure server-side persistence before re-fetching */
export const POST_STREAM_DELAY_MS = 500;

/** Default polling interval for world generation status */
export const POLL_INTERVAL_MS = 2_000;

/** Maximum number of polling attempts before timing out */
export const MAX_POLL_ATTEMPTS = 120;

export { ApiError };

/**
 * Parse an error response body into an ApiError.
 * Shared between `handleResponse` (JSON APIs) and streaming endpoints.
 */
export async function parseApiError(response: Response): Promise<ApiError> {
	const errorBody = await response.json().catch(() => ({}));
	const message =
		errorBody.error?.message ??
		errorBody.detail ??
		`HTTP ${response.status}: ${response.statusText}`;
	const code: string | undefined = errorBody.error?.code;
	return new ApiError(response.status, message, code);
}

/**
 * Get authorization headers for API requests
 * @param forceRefresh - If true, forces a token refresh
 */
export async function getAuthHeaders(forceRefresh = false): Promise<HeadersInit> {
	const token = await getAuthToken(forceRefresh);
	const headers: Record<string, string> = {
		'Content-Type': 'application/json'
	};

	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	} else if (!isLocalEnvironment) {
		logger.warn('No auth token available for API request');
	}

	const phDistinctId = getPostHogDistinctId();
	if (phDistinctId) headers['X-PostHog-Distinct-Id'] = phDistinctId;

	const phSessionId = getPostHogSessionId();
	if (phSessionId) headers['X-PostHog-Session-Id'] = phSessionId;

	return headers;
}

/**
 * Handle API response and throw on error.
 * Gracefully handles 204 No Content (e.g. DELETE) by returning undefined.
 */
async function handleResponse<T>(response: Response, method?: string): Promise<T> {
	if (!response.ok) {
		const error = await parseApiError(response);
		if (response.status >= 500) {
			Sentry.captureException(error, {
				tags: { api_status: response.status, api_code: error.code },
				contexts: { api: { url: response.url, method: method ?? 'unknown' } }
			});
		}
		throw error;
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
export async function apiRequest<T>(
	url: string,
	options: RequestInit = {},
	retry = true,
	fetchFn: typeof fetch = fetch
): Promise<T> {
	const method = (options.method ?? 'GET').toUpperCase();

	if (!retry || fetchFn !== fetch) {
		const headers = await getAuthHeaders();
		const response = await fetchFn(url, {
			...options,
			headers: {
				...(headers as Record<string, string>),
				...(options.headers as Record<string, string>)
			}
		});
		return handleResponse<T>(response, method);
	}

	const response = await fetchWithAuthRetry(url, options);
	return handleResponse<T>(response, method);
}
