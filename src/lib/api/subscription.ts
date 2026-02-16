import type {
	UsageInfo,
	CheckoutRequest,
	CheckoutResponse,
	BillingPortalResponse
} from '$lib/types/subscription';
import { API_BASE_URL } from '$lib/config';
import { apiRequest } from './core';

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
