import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import {
	getUsage,
	createCheckoutSession,
	createBillingPortalSession,
	updateNewsletter,
	setUsername
} from '$lib/api/subscription';
import type { CheckoutRequest } from '$lib/types/subscription';
import { showError } from '$lib/utils/toast';
import { useAuth } from '$lib/auth/auth.svelte';
import { queryKeys } from './keys';

/**
 * Query hook to fetch the authenticated user's profile, usage, and subscription info.
 * Automatically enabled only when the user is authenticated.
 */
export function useUser() {
	const auth = useAuth();
	return createQuery(() => ({
		queryKey: queryKeys.user.all,
		queryFn: getUsage,
		enabled: auth.isAuthenticated
	}));
}

/**
 * Mutation hook to create a Stripe Checkout Session.
 * On success the user is redirected to Stripe's hosted checkout page.
 */
export function useCheckout() {
	return createMutation(() => ({
		mutationFn: (data: CheckoutRequest) => createCheckoutSession(data),
		onSuccess: (result) => {
			window.location.href = result.checkout_url;
		},
		onError: (error: Error) => {
			showError('Failed to start checkout', error.message);
		}
	}));
}

/**
 * Mutation hook to create a Stripe Billing Portal Session.
 * On success the user is redirected to Stripe's hosted portal.
 */
export function useBillingPortal() {
	return createMutation(() => ({
		mutationFn: () => createBillingPortalSession(),
		onSuccess: (result) => {
			window.location.href = result.portal_url;
		},
		onError: (error: Error) => {
			showError('Failed to open billing portal', error.message);
		}
	}));
}

/**
 * Mutation hook to set the user's username (one-time).
 * Invalidates the usage query on success so is_onboarded updates.
 */
export function useSetUsername() {
	const queryClient = useQueryClient();
	return createMutation(() => ({
		mutationFn: (username: string) => setUsername(username),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
		},
		onError: (error: Error) => {
			showError('Failed to set username', error.message);
		}
	}));
}

/**
 * Mutation hook to update the user's newsletter preference.
 * Invalidates the user query on success to reflect the change.
 */
export function useUpdateNewsletter() {
	const queryClient = useQueryClient();
	return createMutation(() => ({
		mutationFn: (optedIn: boolean) => updateNewsletter(optedIn),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
		},
		onError: (error: Error) => {
			showError('Failed to update newsletter preference', error.message);
		}
	}));
}
