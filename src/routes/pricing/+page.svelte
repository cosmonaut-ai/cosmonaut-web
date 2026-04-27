<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { useAuth } from '$lib/auth/auth.svelte';
	import { useUser, useCheckout, useBillingPortal, queryKeys } from '$lib/queries';
	import { useQueryClient } from '@tanstack/svelte-query';
	import { TIER_CONFIG, tierRank } from '$lib/config/tiers';
	import type { SubscriptionTier } from '$lib/types/subscription';
	import PricingCard from '$lib/components/features/subscription/PricingCard.svelte';
	import SubscriptionStatusBanner from '$lib/components/features/subscription/SubscriptionStatusBanner.svelte';
	import { Button } from '$lib/components/ui/button';
	import { showSuccess, showInfo } from '$lib/utils/toast';
	import { ArrowLeft } from '@lucide/svelte';
	import SEO from '$lib/components/shared/SEO.svelte';
	import { trackEvent } from '$lib/utils/analytics';

	const auth = useAuth();
	const usageQuery = useUser();
	const checkoutMutation = useCheckout();
	const billingPortalMutation = useBillingPortal();
	const queryClient = useQueryClient();

	const currentTier = $derived(usageQuery.data?.tier ?? null);

	// Handle post-checkout redirect
	onMount(() => {
		const checkoutStatus = page.url.searchParams.get('checkout');
		if (checkoutStatus === 'success') {
			trackEvent('checkout_completed');
			showSuccess('Subscription activated!', 'Welcome to your new plan.');
			queryClient.invalidateQueries({ queryKey: queryKeys.user.all });
			// Clean the URL
			const url = new URL(window.location.href);
			url.searchParams.delete('checkout');
			history.replaceState({}, '', url.toString());
		} else if (checkoutStatus === 'cancelled') {
			showInfo('Checkout cancelled', 'No changes were made to your subscription.');
			const url = new URL(window.location.href);
			url.searchParams.delete('checkout');
			history.replaceState({}, '', url.toString());
		}
	});

	function handleTierSelect(tier: SubscriptionTier) {
		if (!auth.isAuthenticated || !currentTier) return;

		const currentRank = tierRank(currentTier);
		const targetRank = tierRank(tier);

		if (targetRank === currentRank) return;

		if (currentTier === 'FREE') {
			trackEvent('checkout_initiated', { tier });
			checkoutMutation.mutate({
				tier: tier as 'EXPLORER' | 'COSMONAUT',
				success_url: `${window.location.origin}/pricing?checkout=success`,
				cancel_url: `${window.location.origin}/pricing?checkout=cancelled`
			});
		} else {
			trackEvent('billing_portal_opened');
			billingPortalMutation.mutate();
		}
	}

	function handleGuestAction() {
		auth.login();
	}

	const isActionLoading = $derived(checkoutMutation.isPending || billingPortalMutation.isPending);
</script>

<SEO
	title="Plans & Pricing - Cosmonaut"
	description="Choose the plan that fits your storytelling needs. Start free and upgrade as your adventures grow."
	path="/pricing"
/>

<div class="h-full overflow-y-auto bg-background">
	<main class="mx-auto max-w-6xl px-6 py-12">
		<!-- Header -->
		<div class="mb-4">
			{#if auth.isAuthenticated}
				<Button variant="ghost" size="sm" onclick={() => goto('/dashboard')} class="gap-2">
					<ArrowLeft class="h-4 w-4" />
					Back to Dashboard
				</Button>
			{/if}
		</div>

		<div class="mb-12 text-center">
			<h1 class="text-4xl font-bold text-foreground">Plans & Pricing</h1>
			<p class="mt-3 text-lg text-muted-foreground">
				Choose the plan that fits your storytelling ambitions.
			</p>
		</div>

		<!-- Subscription status warnings (cancellation, payment issues, paused) -->
		{#if usageQuery.data}
			<div class="mb-8">
				<SubscriptionStatusBanner usage={usageQuery.data} class="mx-auto max-w-2xl" />
			</div>
		{/if}

		<!-- Pricing grid -->
		<div class="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
			{#each TIER_CONFIG as tier (tier.key)}
				<PricingCard
					{tier}
					{currentTier}
					isLoading={isActionLoading}
					onSelect={handleTierSelect}
					isGuest={!auth.isAuthenticated}
					onGuestAction={handleGuestAction}
				/>
			{/each}
		</div>

		<!-- FAQ / Note -->
		<div class="mx-auto mt-16 max-w-2xl text-center">
			<p class="text-sm text-muted-foreground">
				All paid plans are billed monthly through Stripe. You can cancel or change your plan at any
				time. Usage limits reset at the start of each billing period.
			</p>
		</div>
	</main>
</div>
