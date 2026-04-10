// NOTE: Tier limits are also defined in cosmonaut-api (app/core/config.py)
// and cosmonaut-admin (src/lib/config.ts). Keep all three in sync.
import type { SubscriptionTier } from '$lib/types/subscription';

export interface TierConfig {
	key: SubscriptionTier;
	name: string;
	price: string;
	priceDetail: string;
	worldsLimit: number;
	nodesLimit: number;
	audioNarrationsLimit: number;
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
		name: 'Free',
		price: '$0',
		priceDetail: 'forever',
		worldsLimit: 3,
		nodesLimit: 30,
		audioNarrationsLimit: 10,
		resetPeriod: '7 days',
		features: [
			'3 stories per week',
			'30 story nodes per week',
			'Unlimited saved stories',
			'10 audio narrations (one-time)',
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
		audioNarrationsLimit: 30,
		resetPeriod: '30 days',
		highlighted: true,
		features: [
			'20 stories per month',
			'500 story nodes per month',
			'Unlimited saved stories',
			'30 audio narrations / month',
			'Full story graph visualization',
			'Community sharing'
		]
	},
	{
		key: 'COSMONAUT',
		name: 'Cosmonaut',
		price: '$25',
		priceDetail: 'per month',
		worldsLimit: 100,
		nodesLimit: 2000,
		audioNarrationsLimit: 150,
		resetPeriod: '30 days',
		features: [
			'100 stories per month',
			'2,000 story nodes per month',
			'Unlimited saved stories',
			'150 audio narrations / month',
			'Full story graph visualization',
			'Community sharing',
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
