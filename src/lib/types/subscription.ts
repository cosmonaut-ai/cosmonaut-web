export type SubscriptionTier = 'SCOUT' | 'EXPLORER' | 'COSMONAUT';

export type SubscriptionStatus = 'active' | 'past_due' | 'unpaid' | 'paused' | null;

export interface UsageInfo {
	tier: SubscriptionTier;
	nodes_used: number;
	nodes_limit: number;
	worlds_created: number;
	worlds_limit: number;
	worlds_stored: number;
	worlds_stored_limit: number;
	audio_narrations_used: number;
	audio_narrations_limit: number;
	period_end: string | null;
	pending_cancellation: boolean;
	cancellation_date: string | null;
	subscription_status: SubscriptionStatus;
	pending_tier: SubscriptionTier | null;
	pending_tier_date: string | null;
}

export interface CheckoutRequest {
	tier: 'EXPLORER' | 'COSMONAUT';
	success_url: string;
	cancel_url: string;
}

export interface CheckoutResponse {
	checkout_url: string;
}

export interface BillingPortalResponse {
	portal_url: string;
}
