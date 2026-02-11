import type { SubscriptionTier } from '$lib/types/subscription';

export interface TierConfig {
	key: SubscriptionTier;
	name: string;
	price: string;
	priceDetail: string;
	worldsLimit: number;
	nodesLimit: number;
	savedWorldsLimit: number;
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
		key: 'SCOUT',
		name: 'Scout',
		price: '$0',
		priceDetail: 'forever',
		worldsLimit: 3,
		nodesLimit: 30,
		savedWorldsLimit: 5,
		audioNarrationsLimit: 20,
		resetPeriod: '7 days',
		features: [
			'3 worlds per week',
			'30 story nodes per week',
			'5 saved stories',
			'20 audio narrations (one-time)',
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
		savedWorldsLimit: 50,
		audioNarrationsLimit: 60,
		resetPeriod: '30 days',
		highlighted: true,
		features: [
			'20 worlds per month',
			'500 story nodes per month',
			'50 saved stories',
			'60 audio narrations / month',
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
		savedWorldsLimit: 100,
		audioNarrationsLimit: 200,
		resetPeriod: '30 days',
		features: [
			'100 worlds per month',
			'2,000 story nodes per month',
			'100 saved stories',
			'200 audio narrations / month',
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
const TIER_ORDER: SubscriptionTier[] = ['SCOUT', 'EXPLORER', 'COSMONAUT'];

export function tierRank(tier: SubscriptionTier): number {
	return TIER_ORDER.indexOf(tier);
}
