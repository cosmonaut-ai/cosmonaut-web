import { Amplify } from 'aws-amplify';
import { signInWithRedirect, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { amplifyConfig, isLocalEnvironment, isAuthConfigured, API_BASE_URL } from '$lib/config';

// Auth state using Svelte 5 runes
let isAuthenticated = $state(false);
let isLoading = $state(true);
let user = $state<UserInfo | null>(null);
let authReadyPromise: Promise<void> | null = null;

export interface UserInfo {
	sub: string;
	email?: string;
	name?: string;
	picture?: string;
}

/**
 * Initialize Amplify Auth - call this once in the root layout
 */
export function initializeAuth(): Promise<void> {
	if (authReadyPromise) return authReadyPromise;

	authReadyPromise = (async () => {
		if (isAuthConfigured) {
			try {
				Amplify.configure(amplifyConfig);
				// Check current auth state and wait for it
				await checkAuthState();
			} catch (error) {
				console.error('Failed to initialize Amplify:', error);
				isLoading = false;
			}
		} else if (isLocalEnvironment) {
			// In local environment, mark as not loading but not authenticated
			isLoading = false;
			isAuthenticated = false;
		} else {
			console.warn('Auth is not configured for non-local environment');
			isLoading = false;
		}
	})();

	return authReadyPromise;
}

/**
 * Check the current authentication state
 */
export async function checkAuthState(): Promise<void> {
	if (!isAuthConfigured) {
		isLoading = false;
		return;
	}

	try {
		isLoading = true;

		// Try to get the session first - this is more reliable on page load
		const session = await fetchAuthSession();

		// If we have a valid session with tokens, we're authenticated
		if (session.tokens?.idToken) {
			const claims = session.tokens.idToken.payload;

			// Try to get current user for the userId
			try {
				const currentUser = await getCurrentUser();
				user = {
					sub: currentUser.userId,
					email: claims?.email as string | undefined,
					name: claims?.given_name as string | undefined,
					picture: claims?.picture as string | undefined
				};
			} catch {
				// If getCurrentUser fails but we have tokens, use the sub from claims
				user = {
					sub: claims?.sub as string,
					email: claims?.email as string | undefined,
					name: claims?.given_name as string | undefined,
					picture: claims?.picture as string | undefined
				};
			}

			isAuthenticated = true;
		} else {
			// No valid tokens
			isAuthenticated = false;
			user = null;
		}
	} catch (error) {
		// User is not authenticated
		isAuthenticated = false;
		user = null;
		// Don't log expected "no user" errors as errors
		if (
			error &&
			typeof error === 'object' &&
			'name' in error &&
			error.name !== 'UserUnauthenticatedException'
		) {
			console.debug('Auth state check:', error);
		}
	} finally {
		isLoading = false;
	}
}

/**
 * Sign in with Google OAuth
 */
export async function login(): Promise<void> {
	if (!isAuthConfigured) {
		console.warn('Cannot login: Auth is not configured');
		return;
	}

	try {
		await signInWithRedirect({ provider: 'Google' });
	} catch (error) {
		console.error('Login failed:', error);
		throw error;
	}
}

/**
 * Sign out the current user
 */
export async function logout(): Promise<void> {
	if (!isAuthConfigured) {
		return;
	}

	try {
		await signOut();
		isAuthenticated = false;
		user = null;
		authReadyPromise = null; // Reset promise so it can be re-initialized
	} catch (error) {
		console.error('Logout failed:', error);
		throw error;
	}
}

/**
 * Get the current auth token for API calls
 * Returns null if not authenticated or in local environment
 * @param forceRefresh - If true, forces a token refresh from Cognito
 */
export async function getAuthToken(forceRefresh = false): Promise<string | null> {
	// Ensure auth is initialized before getting token
	await initializeAuth();

	// In local environment, return a mock token
	if (isLocalEnvironment) {
		return 'local-dev-token';
	}

	if (!isAuthConfigured) {
		console.warn('Auth not configured, cannot get token');
		return null;
	}

	// If not authenticated and not forcing refresh, return null early
	if (!isAuthenticated && !forceRefresh) {
		console.warn('Not authenticated, cannot get token');
		return null;
	}

	try {
		const session = await fetchAuthSession({ forceRefresh });

		// If we're forcing refresh and it succeeds, ensure we're marked as authenticated
		if (forceRefresh && session.tokens?.idToken) {
			if (!isAuthenticated) {
				await checkAuthState();
			}
		}

		const token = session.tokens?.idToken?.toString() ?? null;
		if (!token) {
			console.warn('No ID token in session');
		}
		return token;
	} catch (error) {
		console.error('Failed to get auth token:', error);
		// If token fetching fails, we might not be authenticated anymore
		if (isAuthenticated) {
			await checkAuthState();
		}
		return null;
	}
}

/**
 * Refresh the streaming session by calling /auth/session
 * This sets signed cookies for CloudFront streaming access
 */
export async function refreshStreamingSession(): Promise<boolean> {
	// In local environment, no session refresh needed
	if (isLocalEnvironment) {
		return true;
	}

	const token = await getAuthToken();
	if (!token) {
		return false;
	}

	try {
		const response = await fetch(`${API_BASE_URL}/auth/session`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${token}`
			},
			credentials: 'include' // Important: include cookies
		});

		return response.ok;
	} catch (error) {
		console.error('Failed to refresh streaming session:', error);
		return false;
	}
}

// Export reactive getters
export function getIsAuthenticated(): boolean {
	return isAuthenticated;
}

export function getIsLoading(): boolean {
	return isLoading;
}

export function getUser(): UserInfo | null {
	return user;
}

// Export a reactive auth state object for components
export function useAuth() {
	return {
		get isAuthenticated() {
			return isAuthenticated;
		},
		get isLoading() {
			return isLoading;
		},
		get user() {
			return user;
		},
		get requiresAuth() {
			return !isLocalEnvironment;
		},
		login,
		logout,
		checkAuthState
	};
}
