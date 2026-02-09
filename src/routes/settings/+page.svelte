<script lang="ts">
	import { goto } from '$app/navigation';
	import { useAuth } from '$lib/auth/auth.svelte';
	import { useUsage, useBillingPortal } from '$lib/queries';
	import { getTierConfig } from '$lib/config/tiers';
	import UsageBar from '$lib/components/subscription/UsageBar.svelte';
	import SubscriptionStatusBanner from '$lib/components/subscription/SubscriptionStatusBanner.svelte';
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
	import { ArrowLeft, User, CreditCard, BarChart3, ExternalLink } from '@lucide/svelte';

	const auth = useAuth();
	const usageQuery = useUsage();
	const billingPortalMutation = useBillingPortal();

	const usage = $derived(usageQuery.data);
	const tierConfig = $derived(usage ? getTierConfig(usage.tier) : null);
	const isFree = $derived(usage?.tier === 'FREE');

	const tierBadgeClass: Record<string, string> = {
		FREE: 'bg-muted text-muted-foreground border-border',
		EXPLORER: 'bg-primary/15 text-primary border-primary/30',
		COSMONAUT: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
	};

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return 'N/A';
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>Settings - Cosmonaut</title>
	<meta name="description" content="Manage your account, subscription, and view usage." />
</svelte:head>

<div class="h-full overflow-y-auto bg-background">
	<main class="mx-auto max-w-3xl px-6 py-12">
		<!-- Header -->
		<div class="mb-8">
			<Button variant="ghost" size="sm" onclick={() => goto('/dashboard')} class="mb-4 gap-2">
				<ArrowLeft class="h-4 w-4" />
				Back to Dashboard
			</Button>
			<h1 class="text-3xl font-bold text-foreground">Settings</h1>
			<p class="mt-1 text-muted-foreground">Manage your account and subscription</p>
		</div>

		<div class="space-y-8">
			<!-- Account Info -->
			<Card>
				<CardHeader>
					<div class="flex items-center gap-2">
						<User class="h-5 w-5 text-primary" />
						<CardTitle>Account</CardTitle>
					</div>
				</CardHeader>
				<CardContent class="space-y-4">
					<div class="flex items-center gap-4">
						{#if auth.user?.picture}
							<img
								src={auth.user.picture}
								alt={auth.user.name || 'User'}
								class="h-16 w-16 rounded-full ring-2 ring-primary/20"
							/>
						{:else}
							<div
								class="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-medium text-primary-foreground"
							>
								{(auth.user?.name || auth.user?.email || 'U').charAt(0).toUpperCase()}
							</div>
						{/if}
						<div>
							{#if auth.user?.name}
								<p class="text-lg font-medium text-foreground">{auth.user.name}</p>
							{/if}
							{#if auth.user?.email}
								<p class="text-sm text-muted-foreground">{auth.user.email}</p>
							{/if}
						</div>
					</div>
				</CardContent>
			</Card>

			<!-- Subscription -->
			<Card>
				<CardHeader>
					<div class="flex items-center gap-2">
						<CreditCard class="h-5 w-5 text-primary" />
						<CardTitle>Subscription</CardTitle>
					</div>
					<CardDescription>Your current plan and billing information</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4">
					{#if usageQuery.isLoading}
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

						<!-- Subscription status warnings (cancellation, payment issues, paused) -->
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
								<Button variant="ghost" onclick={() => goto('/pricing')} class="gap-2">
									View Plans
								</Button>
							{/if}
						</div>
					{/if}
				</CardContent>
			</Card>

			<!-- Usage -->
			<Card>
				<CardHeader>
					<div class="flex items-center gap-2">
						<BarChart3 class="h-5 w-5 text-primary" />
						<CardTitle>Usage</CardTitle>
					</div>
					<CardDescription>Your current usage for this billing period</CardDescription>
				</CardHeader>
				<CardContent class="space-y-6">
					{#if usageQuery.isLoading}
						<div class="space-y-4">
							<Skeleton class="h-12 w-full" />
							<Skeleton class="h-12 w-full" />
						</div>
					{:else if usage}
						<UsageBar
							label="Worlds Created"
							used={usage.worlds_created}
							limit={usage.worlds_limit}
						/>
						<UsageBar label="Story Generations" used={usage.nodes_used} limit={usage.nodes_limit} />
						<UsageBar
							label="Audio Narrations"
							used={usage.audio_narrations_used}
							limit={usage.audio_narrations_limit}
						/>

						{#if usage.period_end}
							<div class="rounded-lg border border-border bg-muted/50 px-4 py-3">
								<p class="text-sm text-muted-foreground">
									Usage resets on <strong class="text-foreground"
										>{formatDate(usage.period_end)}</strong
									>
								</p>
							</div>
						{/if}

						<Separator />

						<UsageBar
							label="Saved Worlds"
							used={usage.worlds_stored}
							limit={usage.worlds_stored_limit}
						/>
						<div class="rounded-lg border border-border bg-muted/50 px-4 py-3">
							<p class="text-sm text-muted-foreground">
								Saved worlds do not reset with your billing period. Delete existing worlds to free
								up space.
							</p>
						</div>
						{#if usage.tier === 'FREE'}
							<div class="rounded-lg border border-border bg-muted/50 px-4 py-3">
								<p class="text-sm text-muted-foreground">
									Free audio narrations do not reset. Upgrade for more.
								</p>
							</div>
						{/if}
					{/if}
				</CardContent>
			</Card>
		</div>
	</main>
</div>
