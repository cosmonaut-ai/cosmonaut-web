<script lang="ts">
	import type { UsageInfo } from '$lib/types/subscription';
	import { getTierConfig } from '$lib/config/tiers';
	import { useBillingPortal } from '$lib/queries';
	import { goto } from '$app/navigation';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Button } from '$lib/components/ui/button';
	import { AlertTriangle, Info, ExternalLink, Sparkles } from '@lucide/svelte';

	interface Props {
		usage: UsageInfo;
		/** Optional max width constraint (e.g. "max-w-2xl mx-auto") */
		class?: string;
	}

	let { usage, class: className = '' }: Props = $props();

	const billingPortalMutation = useBillingPortal();
	const tierConfig = $derived(getTierConfig(usage.tier));

	const isPastDue = $derived(usage.subscription_status === 'past_due');
	const isPaused = $derived(usage.subscription_status === 'paused');
	const isUnpaid = $derived(usage.subscription_status === 'unpaid');

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return '';
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

{#if usage.pending_cancellation && usage.cancellation_date}
	<Alert class="border-amber-500/50 bg-amber-500/10 {className}">
		<AlertTriangle class="h-4 w-4 text-amber-400" />
		<AlertDescription>
			<p class="text-amber-200">
				Your {tierConfig.name} plan will end on
				<strong>{formatDate(usage.cancellation_date)}</strong>. You'll be downgraded to the Free
				plan after that.
			</p>
			<Button
				variant="outline"
				size="sm"
				onclick={() => billingPortalMutation.mutate()}
				disabled={billingPortalMutation.isPending}
				class="mt-2 gap-2 border-amber-500/40 text-amber-200 hover:bg-amber-500/10 hover:text-amber-100"
			>
				<ExternalLink class="h-3.5 w-3.5" />
				Reactivate Subscription
			</Button>
		</AlertDescription>
	</Alert>
{:else if isPastDue}
	<Alert class="border-amber-500/50 bg-amber-500/10 {className}">
		<AlertTriangle class="h-4 w-4 text-amber-400" />
		<AlertDescription>
			<p class="text-amber-200">
				There's an issue with your payment. Please update your payment method to avoid losing
				access.
			</p>
			<Button
				variant="outline"
				size="sm"
				onclick={() => billingPortalMutation.mutate()}
				disabled={billingPortalMutation.isPending}
				class="mt-2 gap-2 border-amber-500/40 text-amber-200 hover:bg-amber-500/10 hover:text-amber-100"
			>
				<ExternalLink class="h-3.5 w-3.5" />
				Update Payment Method
			</Button>
		</AlertDescription>
	</Alert>
{:else if isPaused}
	<Alert class="border-blue-500/50 bg-blue-500/10 {className}">
		<Info class="h-4 w-4 text-blue-400" />
		<AlertDescription>
			<p class="text-blue-200">
				Your {tierConfig.name} subscription is currently paused.
			</p>
			<Button
				variant="outline"
				size="sm"
				onclick={() => billingPortalMutation.mutate()}
				disabled={billingPortalMutation.isPending}
				class="mt-2 gap-2 border-blue-500/40 text-blue-200 hover:bg-blue-500/10 hover:text-blue-100"
			>
				<ExternalLink class="h-3.5 w-3.5" />
				Manage Subscription
			</Button>
		</AlertDescription>
	</Alert>
{:else if isUnpaid}
	<Alert class="border-destructive/50 bg-destructive/10 {className}">
		<AlertTriangle class="h-4 w-4 text-destructive" />
		<AlertDescription>
			<p class="text-destructive/90">
				Your subscription payment failed and your account has been downgraded to the Free plan.
			</p>
			<Button
				variant="outline"
				size="sm"
				onclick={() => goto('/pricing')}
				class="mt-2 gap-2 border-destructive/40 text-destructive hover:bg-destructive/10"
			>
				<Sparkles class="h-3.5 w-3.5" />
				Re-subscribe
			</Button>
		</AlertDescription>
	</Alert>
{/if}
