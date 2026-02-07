import type { SubscriptionTier } from '$lib/types/subscription';

export interface TierConfig {
	key: SubscriptionTier;
	name: string;
	price: string;
	priceDetail: string;
	worldsLimit: number;
	nodesLimit: number;
	resetPeriod: string;
	features: string[];
	highlighted?: boolean;
}

/**
 * Static display configuration for each subscription tier.
 * Prices are display-only -- actual billing is handled by Stripe.
 */
export const TIER_CONFIG: TierConfig[] = [
	{
		key: 'FREE',
		name: 'Scout',
		price: '$0',
		priceDetail: 'forever',
		worldsLimit: 3,
		nodesLimit: 30,
		resetPeriod: '7 days',
		features: [
			'3 worlds per week',
			'30 story nodes per week',
			'5 saved stories',
			'Full story graph visualization',
			'Community sharing'
		]
	},
	{
		key: 'EXPLORER',
		name: 'Explorer',
		price: '$10',
		priceDetail: 'per month',
		worldsLimit: 20,
		nodesLimit: 500,
		resetPeriod: '30 days',
		highlighted: true,
		features: [
			'20 worlds per month',
			'500 story nodes per month',
			'50 saved stories',
			'Standard audio (unlimited)',
			'Full story graph visualization',
			'Community sharing',
			'Priority generation'
		]
	},
	{
		key: 'COSMONAUT',
		name: 'Cosmonaut',
		price: '$25',
		priceDetail: 'per month',
		worldsLimit: 100,
		nodesLimit: 2000,
		resetPeriod: '30 days',
		features: [
			'Unlimited worlds (soft cap 100)',
			'Unlimited story nodes (fair use 2,000+)',
			'100 saved stories',
			'Neural audio (high quality)',
			'Full story graph visualization',
			'Community sharing',
			'Priority generation',
			'Early access to new features'
		]
	}
];

/** Lookup a tier config by key */
export function getTierConfig(tier: SubscriptionTier): TierConfig {
	return TIER_CONFIG.find((t) => t.key === tier) ?? TIER_CONFIG[0];
}

/** Tier ordering for comparison (higher index = higher tier) */
const TIER_ORDER: SubscriptionTier[] = ['FREE', 'EXPLORER', 'COSMONAUT'];

export function tierRank(tier: SubscriptionTier): number {
	return TIER_ORDER.indexOf(tier);
}
