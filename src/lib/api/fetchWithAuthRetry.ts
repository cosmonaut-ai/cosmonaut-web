import { isLocalEnvironment } from '$lib/config';
import {
	getAuthToken,
	refreshStreamingSession,
	invalidateStreamingSession,
	handleSessionExpired
} from '$lib/auth/auth.svelte';
import { logger } from '$lib/utils/logger';

/**
 * Build auth headers from the current token.
 */
async function buildAuthHeaders(forceRefresh = false): Promise<Record<string, string>> {
	const token = await getAuthToken(forceRefresh);
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	} else if (!isLocalEnvironment) {
		logger.warn('No auth token available for API request');
	}
	return headers;
}

interface FetchWithAuthRetryOptions {
	credentials?: RequestCredentials;
	handleExpired?: boolean;
	signal?: AbortSignal;
}

/**
 * Perform an authenticated fetch with automatic retry on 401/403.
 */
export async function fetchWithAuthRetry(
	url: string,
	init: RequestInit = {},
	options: FetchWithAuthRetryOptions = {}
): Promise<Response> {
	const { credentials, handleExpired = true, signal: optionSignal } = options;
	const signal = optionSignal ?? init.signal;
	const headers = await buildAuthHeaders();

	const fetchOpts: RequestInit = {
		...init,
		headers: { ...headers, ...(init.headers as Record<string, string>) },
		...(signal !== undefined ? { signal } : {})
	};
	if (credentials) fetchOpts.credentials = credentials;

	let response = await fetch(url, fetchOpts);

	if ((response.status === 401 || response.status === 403) && !isLocalEnvironment) {
		invalidateStreamingSession();
		const token = await getAuthToken(true);
		await refreshStreamingSession();

		if (token) {
			const retryHeaders = await buildAuthHeaders();
			const retryOpts: RequestInit = {
				...init,
				headers: { ...retryHeaders, ...(init.headers as Record<string, string>) },
				...(signal !== undefined ? { signal } : {})
			};
			if (credentials) retryOpts.credentials = credentials;

			response = await fetch(url, retryOpts);
		}

		if (response.status === 401 && handleExpired) {
			await handleSessionExpired();
		}
	}

	return response;
}
