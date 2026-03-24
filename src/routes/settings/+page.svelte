<script lang="ts">
	import { goto } from '$app/navigation';
	import { useUser, useUpdateNewsletter } from '$lib/queries';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Switch } from '$lib/components/ui/switch';
	import { ArrowLeft } from '@lucide/svelte';
	import SEO from '$lib/components/shared/SEO.svelte';
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
		<div class="mb-8">
			<Button variant="ghost" size="sm" onclick={() => goto('/dashboard')} class="mb-4 gap-2">
				<ArrowLeft class="h-4 w-4" />
				Back to Dashboard
			</Button>
			<h1 class="text-3xl font-bold text-foreground">Settings</h1>
			<p class="mt-1 text-muted-foreground">Manage your account and subscription</p>
		</div>

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
								Receive occasional emails about new features and improvements
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
