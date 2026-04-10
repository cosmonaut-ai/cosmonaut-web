<script lang="ts">
	import { useUser, useUpdateNewsletter } from '$lib/queries';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Switch } from '$lib/components/ui/switch';
	import SEO from '$lib/components/shared/SEO.svelte';
	import AppPageHeader from '$lib/components/shared/AppPageHeader.svelte';
	import AccountSection from '$lib/components/features/subscription/AccountSection.svelte';
	import SubscriptionSection from '$lib/components/features/subscription/SubscriptionSection.svelte';
	import DangerZone from '$lib/components/features/subscription/DangerZone.svelte';

	const usageQuery = useUser();
	const newsletterMutation = useUpdateNewsletter();
	const usage = $derived(usageQuery.data);
</script>

<SEO
	title="Settings - Cosmonaut"
	description="Manage your account, subscription, and view usage."
	path="/settings"
	noindex
/>

<div class="h-full overflow-y-auto bg-background">
	<main class="mx-auto max-w-3xl px-6 py-12">
		<AppPageHeader title="Settings" description="Your account, subscription, and preferences" />

		<div class="space-y-8">
			<AccountSection />

			<SubscriptionSection {usage} isLoading={usageQuery.isLoading} />

			<Card>
				<CardHeader>
					<CardTitle>Email Preferences</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="flex items-center justify-between">
						<div class="space-y-0.5">
							<p class="text-sm font-medium">Product Updates Newsletter</p>
							<p class="text-sm text-muted-foreground">
								Occasional emails when something new ships - no fluff
							</p>
						</div>
						<Switch
							checked={usageQuery.data?.newsletter_opted_in ?? false}
							onCheckedChange={(checked) => newsletterMutation.mutate(checked)}
							disabled={newsletterMutation.isPending}
						/>
					</div>
				</CardContent>
			</Card>

			<DangerZone />
		</div>
	</main>
</div>
