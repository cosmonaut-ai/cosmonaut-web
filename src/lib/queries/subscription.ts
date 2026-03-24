import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import {
	getUsage,
	createCheckoutSession,
	createBillingPortalSession,
	updateNewsletter,
	setUsername
} from '$lib/api/subscription';
import type { CheckoutRequest, UsageInfo } from '$lib/types/subscription';
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
 * Optimistically patches the cached user data so guards immediately
 * see is_onboarded=true, avoiding a redirect race on navigation.
 */
export function useSetUsername() {
	const queryClient = useQueryClient();
	return createMutation(() => ({
		mutationFn: (username: string) => setUsername(username),
		onSuccess: (data) => {
			queryClient.setQueryData<UsageInfo>(queryKeys.user.all, (old) =>
				old ? { ...old, username: data.username, is_onboarded: true } : old
			);
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
