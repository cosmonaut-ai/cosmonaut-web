import { Amplify } from 'aws-amplify';
import {
	signInWithRedirect,
	signOut,
	getCurrentUser,
	fetchAuthSession,
	signUp,
	confirmSignUp,
	signIn,
	resetPassword,
	confirmResetPassword,
	resendSignUpCode
} from 'aws-amplify/auth';
import * as Sentry from '@sentry/sveltekit';
import { amplifyConfig, isLocalEnvironment, isAuthConfigured, API_BASE_URL } from '$lib/config';
import { apiRequest } from '$lib/api/core';
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { logger } from '$lib/utils/logger';

// Auth state using Svelte 5 runes
let isAuthenticated = $state(false);
let isLoading = $state(true);
let user = $state<UserInfo | null>(null);
let authReadyPromise: Promise<void> | null = null;

// Local storage key for persisting local dev auth
const LOCAL_AUTH_KEY = 'cosmonaut-local-dev-auth';

// Mock user for local development
const LOCAL_DEV_USER: UserInfo = {
	sub: 'local-dev-user-123',
	email: 'developer@localhost',
	name: 'Local Developer',
	picture: undefined
};

export interface UserInfo {
	sub: string;
	email?: string;
	name?: string;
	picture?: string;
	username?: string;
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
				logger.error('Failed to initialize Amplify:', error);
				isLoading = false;
			}
		} else if (isLocalEnvironment) {
			// In local environment, always auto-authenticate
			isAuthenticated = true;
			user = LOCAL_DEV_USER;
			isLoading = false;
		} else {
			logger.warn('Auth is not configured for non-local environment');
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
					picture: claims?.picture as string | undefined,
					username: claims?.['custom:username'] as string | undefined
				};
			} catch {
				// If getCurrentUser fails but we have tokens, use the sub from claims
				user = {
					sub: claims?.sub as string,
					email: claims?.email as string | undefined,
					name: claims?.given_name as string | undefined,
					picture: claims?.picture as string | undefined,
					username: claims?.['custom:username'] as string | undefined
				};
			}

			isAuthenticated = true;
			Sentry.setUser({ id: user.sub, email: user.email, username: user.name });
		} else {
			// No valid tokens
			isAuthenticated = false;
			user = null;
			Sentry.setUser(null);
		}
	} catch (error) {
		// User is not authenticated
		isAuthenticated = false;
		user = null;
		Sentry.setUser(null);
		// Don't log expected "no user" errors as errors
		if (
			error &&
			typeof error === 'object' &&
			'name' in error &&
			error.name !== 'UserUnauthenticatedException'
		) {
			logger.debug('Auth state check:', error);
		}
	} finally {
		isLoading = false;
	}
}

/**
 * Navigate to the login page (replaces direct Google OAuth redirect).
 * In local environment, uses mock authentication and redirects to dashboard.
 */
export async function login(): Promise<void> {
	// Guard: prevent navigation when already authenticated
	if (isAuthenticated) {
		return;
	}

	// In local environment, use mock authentication
	if (isLocalEnvironment) {
		isAuthenticated = true;
		user = LOCAL_DEV_USER;
		if (browser) {
			try {
				localStorage.setItem(LOCAL_AUTH_KEY, 'true');
			} catch {
				// localStorage might not be available
			}
		}
		return;
	}

	if (!isAuthConfigured) {
		logger.warn('Cannot login: Auth is not configured');
		return;
	}

	// Navigate to the login page instead of direct Google redirect
	await goto('/login');
}

/**
 * Sign in directly with Google OAuth (used from the login page)
 */
export async function loginWithGoogle(): Promise<void> {
	if (isAuthenticated) return;

	if (!isAuthConfigured) {
		logger.warn('Cannot login: Auth is not configured');
		return;
	}

	try {
		await signInWithRedirect({ provider: 'Google' });
	} catch (error) {
		logger.error('Google login failed:', error);
		throw error;
	}
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
	email: string,
	password: string
): Promise<{ isConfirmationRequired: boolean }> {
	if (isLocalEnvironment) {
		isAuthenticated = true;
		user = { ...LOCAL_DEV_USER, email };
		return { isConfirmationRequired: false };
	}

	if (!isAuthConfigured) throw new Error('Auth is not configured');

	const result = await signUp({
		username: email,
		password,
		options: {
			userAttributes: {
				email
			}
		}
	});

	return {
		isConfirmationRequired: result.nextStep.signUpStep === 'CONFIRM_SIGN_UP'
	};
}

/**
 * Confirm sign-up with the verification code sent via email
 */
export async function confirmSignUpWithCode(email: string, code: string): Promise<void> {
	if (isLocalEnvironment) return;
	if (!isAuthConfigured) throw new Error('Auth is not configured');

	await confirmSignUp({
		username: email,
		confirmationCode: code
	});
}

/**
 * Resend the verification code for sign-up confirmation
 */
export async function resendVerificationCode(email: string): Promise<void> {
	if (isLocalEnvironment) return;
	if (!isAuthConfigured) throw new Error('Auth is not configured');

	await resendSignUpCode({ username: email });
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<void> {
	if (isLocalEnvironment) {
		isAuthenticated = true;
		user = { ...LOCAL_DEV_USER, email };
		if (browser) {
			try {
				localStorage.setItem(LOCAL_AUTH_KEY, 'true');
			} catch {
				// localStorage might not be available
			}
		}
		return;
	}

	if (!isAuthConfigured) throw new Error('Auth is not configured');

	const result = await signIn({
		username: email,
		password
	});

	if (result.isSignedIn) {
		await checkAuthState();
	} else if (result.nextStep.signInStep === 'CONFIRM_SIGN_UP') {
		throw new SignUpNotConfirmedError();
	}
}

/**
 * Initiate forgot-password flow — sends a reset code to the user's email
 */
export async function forgotPassword(email: string): Promise<void> {
	if (isLocalEnvironment) return;
	if (!isAuthConfigured) throw new Error('Auth is not configured');

	await resetPassword({ username: email });
}

/**
 * Complete the forgot-password flow with code + new password
 */
export async function confirmForgotPassword(
	email: string,
	code: string,
	newPassword: string
): Promise<void> {
	if (isLocalEnvironment) return;
	if (!isAuthConfigured) throw new Error('Auth is not configured');

	await confirmResetPassword({
		username: email,
		confirmationCode: code,
		newPassword
	});
}

/**
 * Delete the current user's account via the API, then sign out
 */
export async function deleteAccount(): Promise<void> {
	await apiRequest(`${API_BASE_URL}/auth/account`, { method: 'DELETE' });
	await logout();
}

/**
 * Sign out the current user
 */
export async function logout(): Promise<void> {
	// In local environment, clear mock authentication
	if (isLocalEnvironment) {
		isAuthenticated = false;
		user = null;
		authReadyPromise = null;
		if (browser) {
			try {
				localStorage.removeItem(LOCAL_AUTH_KEY);
			} catch {
				// localStorage might not be available
			}
		}
		return;
	}

	if (!isAuthConfigured) {
		return;
	}

	try {
		await signOut();
		isAuthenticated = false;
		user = null;
		authReadyPromise = null; // Reset promise so it can be re-initialized
		Sentry.setUser(null);
	} catch (error) {
		logger.error('Logout failed:', error);
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
		logger.warn('Auth not configured, cannot get token');
		return null;
	}

	// If not authenticated and not forcing refresh, return null early
	if (!isAuthenticated && !forceRefresh) {
		logger.warn('Not authenticated, cannot get token');
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
			logger.warn('No ID token in session');
		}
		return token;
	} catch (error) {
		logger.error('Failed to get auth token:', error);
		// If token fetching fails, we might not be authenticated anymore
		if (isAuthenticated) {
			await checkAuthState();
		}
		return null;
	}
}

/**
 * Handle a terminal session expiry (refresh token gone / expired).
 * Clears local auth state and redirects to login with a message.
 */
export async function handleSessionExpired(): Promise<void> {
	if (!browser) return;
	isAuthenticated = false;
	user = null;
	const redirectPath = window.location.pathname + window.location.search;
	await goto(`/login?expired=true&redirect=${encodeURIComponent(redirectPath)}`);
}

/**
 * Refresh the streaming session by calling /auth/session
 * This sets signed cookies for CloudFront streaming access.
 * Results are cached for STREAMING_SESSION_TTL_MS to avoid redundant round-trips.
 */
const STREAMING_SESSION_TTL_MS = 5 * 60 * 1000; // 5 minutes
let _streamingSessionValidUntil = 0;
let _streamingSessionPromise: Promise<boolean> | null = null;

export async function refreshStreamingSession(): Promise<boolean> {
	// In local environment, no session refresh needed
	if (isLocalEnvironment) {
		return true;
	}

	// Return cached result if still valid
	if (Date.now() < _streamingSessionValidUntil) {
		return true;
	}

	// Deduplicate concurrent calls
	if (_streamingSessionPromise) {
		return _streamingSessionPromise;
	}

	_streamingSessionPromise = (async () => {
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
				credentials: 'include'
			});

			if (response.ok) {
				_streamingSessionValidUntil = Date.now() + STREAMING_SESSION_TTL_MS;
			}
			return response.ok;
		} catch (error) {
			logger.error('Failed to refresh streaming session:', error);
			return false;
		} finally {
			_streamingSessionPromise = null;
		}
	})();

	return _streamingSessionPromise;
}

/** Invalidate the cached streaming session (e.g. after a 401/403 from streaming). */
export function invalidateStreamingSession(): void {
	_streamingSessionValidUntil = 0;
}

// Export reactive getter
export function getIsAuthenticated(): boolean {
	return isAuthenticated;
}

/**
 * Custom error for sign-up not confirmed — the caller should prompt for
 * the verification code.
 */
export class SignUpNotConfirmedError extends Error {
	constructor() {
		super('Sign-up not confirmed. Please enter the verification code sent to your email.');
		this.name = 'SignUpNotConfirmedError';
	}
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
		loginWithGoogle,
		signUpWithEmail,
		confirmSignUpWithCode,
		resendVerificationCode,
		signInWithEmail,
		forgotPassword,
		confirmForgotPassword,
		deleteAccount,
		logout,
		checkAuthState
	};
}
