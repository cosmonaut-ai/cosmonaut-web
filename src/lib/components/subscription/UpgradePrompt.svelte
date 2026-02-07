<script lang="ts">
	import { goto } from '$app/navigation';
	import { useUsage, useBillingPortal } from '$lib/queries';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Sparkles, ExternalLink } from '@lucide/svelte';

	interface Props {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		/** Which resource hit the quota: "worlds" or "nodes" */
		resource?: 'worlds' | 'nodes';
	}

	let { open, onOpenChange, resource = 'nodes' }: Props = $props();

	const usageQuery = useUsage();
	const billingPortalMutation = useBillingPortal();

	const usage = $derived(usageQuery.data);
	const isFree = $derived(usage?.tier === 'FREE');

	const resourceLabel = $derived(resource === 'worlds' ? 'world creation' : 'story generation');

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return '';
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<Dialog.Root {open} {onOpenChange}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Sparkles class="h-5 w-5 text-primary" />
				{resource === 'worlds' ? 'World Limit Reached' : 'Generation Limit Reached'}
			</Dialog.Title>
			<Dialog.Description>
				You've reached your {resourceLabel} limit for this period.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-2">
			{#if usage}
				<div class="rounded-lg border border-border bg-muted/50 p-4 text-sm">
					{#if resource === 'worlds'}
						<p class="text-muted-foreground">
							<strong class="text-foreground">{usage.worlds_created}</strong> of
							<strong class="text-foreground">{usage.worlds_limit}</strong> worlds used
						</p>
					{:else}
						<p class="text-muted-foreground">
							<strong class="text-foreground">{usage.nodes_used}</strong> of
							<strong class="text-foreground">{usage.nodes_limit}</strong> generations used
						</p>
					{/if}
					{#if usage.period_end}
						<p class="mt-1 text-muted-foreground">
							Resets on <strong class="text-foreground">{formatDate(usage.period_end)}</strong>
						</p>
					{/if}
				</div>
			{/if}

			<p class="text-sm text-muted-foreground">
				Upgrade your plan for higher limits, or wait for your usage period to reset.
			</p>
		</div>

		<Dialog.Footer class="flex-col gap-2 sm:flex-row">
			{#if !isFree}
				<Button
					variant="outline"
					onclick={() => {
						onOpenChange(false);
						billingPortalMutation.mutate();
					}}
					disabled={billingPortalMutation.isPending}
					class="gap-2"
				>
					<ExternalLink class="h-4 w-4" />
					Manage Subscription
				</Button>
			{/if}
			<Button
				onclick={() => {
					onOpenChange(false);
					goto('/pricing');
				}}
				class="gap-2"
			>
				<Sparkles class="h-4 w-4" />
				View Plans
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
