import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
import {
	getUsage,
	createCheckoutSession,
	createBillingPortalSession,
	updateNewsletter
} from '$lib/api/client';
import type { CheckoutRequest } from '$lib/types/subscription';
import { showError } from '$lib/utils/toast';
import { useAuth } from '$lib/auth/auth.svelte';

/**
 * Query keys for subscription / usage data
 */
export const usageKeys = {
	all: ['usage'] as const
};

/**
 * Query hook to fetch the authenticated user's usage and subscription info.
 * Automatically enabled only when the user is authenticated.
 */
export function useUsage() {
	const auth = useAuth();
	return createQuery(() => ({
		queryKey: usageKeys.all,
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
			// Redirect to Stripe checkout
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
			// Redirect to Stripe billing portal
			window.location.href = result.portal_url;
		},
		onError: (error: Error) => {
			showError('Failed to open billing portal', error.message);
		}
	}));
}

/**
 * Mutation hook to update the user's newsletter preference.
 * Invalidates the usage query on success to reflect the change.
 */
export function useUpdateNewsletter() {
	const queryClient = useQueryClient();
	return createMutation(() => ({
		mutationFn: (optedIn: boolean) => updateNewsletter(optedIn),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: usageKeys.all });
		},
		onError: (error: Error) => {
			showError('Failed to update newsletter preference', error.message);
		}
	}));
}
