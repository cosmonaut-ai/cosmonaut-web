<script lang="ts">
	import { goto } from '$app/navigation';
	import { useBillingPortal } from '$lib/queries';
	import { getTierConfig } from '$lib/config/tiers';
	import type { UsageInfo } from '$lib/types/subscription';
	import SubscriptionStatusBanner from './SubscriptionStatusBanner.svelte';
	import UsageBar from './UsageBar.svelte';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { CreditCard, BarChart3, ExternalLink } from '@lucide/svelte';
	import { formatDate } from '$lib/utils/date';

	interface Props {
		usage: UsageInfo | undefined;
		isLoading: boolean;
	}

	let { usage, isLoading }: Props = $props();

	const billingPortalMutation = useBillingPortal();
	const tierConfig = $derived(usage ? getTierConfig(usage.tier) : null);
	const isFree = $derived(usage?.tier === 'FREE');

	const tierBadgeClass: Record<string, string> = {
		FREE: 'bg-muted text-muted-foreground border-border',
		EXPLORER: 'bg-primary/15 text-primary border-primary/30',
		COSMONAUT: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
	};
</script>

<Card>
	<CardHeader>
		<div class="flex items-center gap-2">
			<CreditCard class="h-5 w-5 text-primary" />
			<CardTitle>Subscription</CardTitle>
		</div>
		<CardDescription>Your current plan and billing information</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		{#if isLoading}
			<div class="space-y-3">
				<Skeleton class="h-6 w-32" />
				<Skeleton class="h-4 w-48" />
			</div>
		{:else if usage && tierConfig}
			<div class="flex items-center justify-between">
				<div>
					<div class="flex items-center gap-2">
						<span class="text-lg font-semibold text-foreground">{tierConfig.name} Plan</span>
						<Badge class={tierBadgeClass[usage.tier] ?? ''}>
							{tierConfig.price}/{tierConfig.priceDetail}
						</Badge>
					</div>
					{#if usage.period_end}
						<p class="mt-1 text-sm text-muted-foreground">
							{#if usage.pending_cancellation}
								Ends on {formatDate(usage.cancellation_date)}
							{:else if usage.pending_tier}
								Changes to {getTierConfig(usage.pending_tier).name} on {formatDate(
									usage.pending_tier_date
								)}
							{:else}
								Renews on {formatDate(usage.period_end)}
							{/if}
						</p>
					{/if}
				</div>
			</div>

			<SubscriptionStatusBanner {usage} />

			<Separator />

			<div class="flex flex-wrap gap-3">
				{#if isFree}
					<Button variant="default" onclick={() => goto('/pricing')} class="gap-2">
						Upgrade Plan
					</Button>
				{:else}
					<Button
						variant="outline"
						onclick={() => billingPortalMutation.mutate()}
						disabled={billingPortalMutation.isPending}
						class="gap-2"
					>
						<ExternalLink class="h-4 w-4" />
						Manage Subscription
					</Button>
					<Button variant="ghost" onclick={() => goto('/pricing')} class="gap-2">View Plans</Button>
				{/if}
			</div>
		{/if}
	</CardContent>
</Card>

<Card>
	<CardHeader>
		<div class="flex items-center gap-2">
			<BarChart3 class="h-5 w-5 text-primary" />
			<CardTitle>Usage</CardTitle>
		</div>
		<CardDescription>Your current usage for this billing period</CardDescription>
	</CardHeader>
	<CardContent class="space-y-6">
		{#if isLoading}
			<div class="space-y-4">
				<Skeleton class="h-12 w-full" />
				<Skeleton class="h-12 w-full" />
			</div>
		{:else if usage}
			<UsageBar label="Worlds Created" used={usage.worlds_created} limit={usage.worlds_limit} />
			<UsageBar label="Story Generations" used={usage.nodes_used} limit={usage.nodes_limit} />

			{#if usage.period_end}
				<div class="rounded-lg border border-border bg-muted/50 px-4 py-3">
					<p class="text-sm text-muted-foreground">
						Usage resets on <strong class="text-foreground">{formatDate(usage.period_end)}</strong>
					</p>
				</div>
			{/if}

			<UsageBar
				label="Audio Narrations"
				used={usage.audio_narrations_used}
				limit={usage.audio_narrations_limit}
			/>
			{#if isFree}
				<div class="rounded-lg border border-border bg-muted/50 px-4 py-3">
					<p class="text-sm text-muted-foreground">
						Free audio narrations are a one-time allowance and do not reset. Upgrade for monthly
						narrations.
					</p>
				</div>
			{/if}
		{/if}
	</CardContent>
</Card>
