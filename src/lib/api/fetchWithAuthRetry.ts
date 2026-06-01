import { isLocalEnvironment } from '$lib/config';
import {
	getAuthToken,
	refreshStreamingSession,
	invalidateStreamingSession,
	handleSessionExpired
} from '$lib/auth/auth.svelte';
import { getAuthHeaders } from './core';

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
	const headers = await getAuthHeaders();

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
			const retryHeaders = await getAuthHeaders();
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
