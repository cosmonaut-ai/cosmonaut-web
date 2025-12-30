import { Amplify } from 'aws-amplify';
import { signInWithRedirect, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import { amplifyConfig, isLocalEnvironment, isAuthConfigured, API_BASE_URL } from '$lib/config';

// Auth state using Svelte 5 runes
let isAuthenticated = $state(false);
let isLoading = $state(true);
let user = $state<UserInfo | null>(null);
let amplifyInitialized = false;

export interface UserInfo {
	sub: string;
	email?: string;
	name?: string;
	picture?: string;
}

/**
 * Initialize Amplify Auth - call this once in the root layout
 */
export function initializeAuth(): void {
	if (amplifyInitialized) return;

	if (isAuthConfigured) {
		Amplify.configure(amplifyConfig);
		amplifyInitialized = true;
		// Check current auth state
		checkAuthState();
	} else if (isLocalEnvironment) {
		// In local environment, mark as not loading but not authenticated
		isLoading = false;
		isAuthenticated = false;
	} else {
		console.warn('Auth is not configured for non-local environment');
		isLoading = false;
	}
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
		const currentUser = await getCurrentUser();
		const session = await fetchAuthSession();
		const claims = session.tokens?.idToken?.payload;

		user = {
			sub: currentUser.userId,
			email: claims?.email as string | undefined,
			name: claims?.given_name as string | undefined,
			picture: claims?.picture as string | undefined
		};
		isAuthenticated = true;
	} catch {
		// User is not authenticated
		isAuthenticated = false;
		user = null;
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
	} catch (error) {
		console.error('Logout failed:', error);
		throw error;
	}
}

/**
 * Get the current auth token for API calls
 * Returns null if not authenticated or in local environment
 */
export async function getAuthToken(): Promise<string | null> {
	// In local environment, return a mock token
	if (isLocalEnvironment) {
		return 'local-dev-token';
	}

	if (!isAuthConfigured || !isAuthenticated) {
		return null;
	}

	try {
		const session = await fetchAuthSession();
		return session.tokens?.idToken?.toString() ?? null;
	} catch (error) {
		console.error('Failed to get auth token:', error);
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
