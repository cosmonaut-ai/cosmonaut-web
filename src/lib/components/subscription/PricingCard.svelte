<script lang="ts">
	import type { TierConfig } from '$lib/config/tiers';
	import type { SubscriptionTier } from '$lib/types/subscription';
	import { tierRank } from '$lib/config/tiers';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Check } from '@lucide/svelte';

	interface Props {
		tier: TierConfig;
		currentTier?: SubscriptionTier | null;
		isLoading?: boolean;
		onSelect?: (tier: SubscriptionTier) => void;
		/** True when the user is not authenticated */
		isGuest?: boolean;
		onGuestAction?: () => void;
	}

	let {
		tier,
		currentTier = null,
		isLoading = false,
		onSelect,
		isGuest = false,
		onGuestAction
	}: Props = $props();

	const isCurrent = $derived(currentTier === tier.key);
	const currentRank = $derived(currentTier ? tierRank(currentTier) : -1);
	const tierRankValue = $derived(tierRank(tier.key));
	const isUpgrade = $derived(tierRankValue > currentRank);
	const isDowngrade = $derived(tierRankValue < currentRank && currentTier !== null);
	const isFree = $derived(tier.key === 'SCOUT');
	const isCosmonaut = $derived(tier.key === 'COSMONAUT');

	const buttonLabel = $derived.by(() => {
		if (isGuest) return 'Get Started';
		if (isCurrent) return 'Current Plan';
		if (isFree) return 'Free Plan';
		if (isUpgrade) return 'Upgrade';
		if (isDowngrade) return 'Downgrade';
		return 'Select';
	});

	const buttonDisabled = $derived(isCurrent || (isFree && !isGuest) || isLoading);
</script>

<div
	class={isCosmonaut
		? 'cosmonaut-glow relative flex flex-col overflow-hidden rounded-xl p-[1.5px]'
		: 'contents'}
>
	<Card
		class="relative flex flex-col {tier.highlighted && !isCurrent
			? 'border-primary shadow-lg shadow-primary/10'
			: ''} {isCurrent ? 'border-primary/50 bg-primary/5' : ''} {isCosmonaut
			? 'z-10 flex-1 border-0 bg-card'
			: ''}"
	>
		{#if tier.highlighted && !isCurrent}
			<div class="absolute -top-3 left-1/2 -translate-x-1/2">
				<Badge class="bg-primary text-primary-foreground">Most Popular</Badge>
			</div>
		{/if}

		<CardHeader class="pb-4">
			<div class="flex items-center justify-between">
				<CardTitle class="text-xl">{tier.name}</CardTitle>
				{#if isCurrent}
					<Badge variant="outline" class="border-primary/40 text-primary">Current</Badge>
				{/if}
			</div>
			<div class="mt-2">
				<span class="text-4xl font-bold text-foreground">{tier.price}</span>
				<span class="text-sm text-muted-foreground">/{tier.priceDetail}</span>
			</div>
			<CardDescription class="mt-1">
				{tier.resetPeriod} usage period
			</CardDescription>
		</CardHeader>

		<CardContent class="flex flex-1 flex-col">
			<ul class="mb-8 flex-1 space-y-3">
				{#each tier.features as feature (feature)}
					<li class="flex items-start gap-2 text-sm">
						<Check class="mt-0.5 h-4 w-4 shrink-0 text-primary" />
						<span class="text-muted-foreground">{feature}</span>
					</li>
				{/each}
			</ul>

			<Button
				class="w-full {tier.highlighted && !isCurrent ? 'shadow-md shadow-primary/20' : ''}"
				variant={tier.highlighted && !isCurrent ? 'default' : 'outline'}
				disabled={buttonDisabled}
				onclick={() => {
					if (isGuest && onGuestAction) {
						onGuestAction();
					} else if (onSelect && !buttonDisabled) {
						onSelect(tier.key);
					}
				}}
			>
				{#if isLoading && !isCurrent}
					<Spinner class="h-4 w-4" />
				{/if}
				{buttonLabel}
			</Button>
		</CardContent>
	</Card>
</div>

<style>
	.cosmonaut-glow::before {
		content: '';
		position: absolute;
		inset: -100%;
		background: conic-gradient(#d4a54a, #9a82d1, #4db8b8, #d4a54a);
		animation: cosmonaut-spin 6s linear infinite;
		will-change: transform;
	}

	.cosmonaut-glow {
		box-shadow:
			0 0 20px -5px rgba(212, 165, 74, 0.15),
			0 0 40px -10px rgba(154, 130, 209, 0.1);
	}

	@keyframes cosmonaut-spin {
		to {
			transform: rotate(360deg);
		}
	}
</style>
