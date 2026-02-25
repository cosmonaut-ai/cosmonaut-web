<script lang="ts">
	import { goto } from '$app/navigation';
	import { useUsage, useBillingPortal } from '$lib/queries';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Sparkles, ExternalLink } from '@lucide/svelte';
	import { formatDate } from '$lib/utils/date';
	import { trackEvent } from '$lib/utils/analytics';

	interface Props {
		open: boolean;
		onOpenChange: (open: boolean) => void;
		/** Which resource hit the quota: "worlds", "worlds_storage", "nodes", or "audio" */
		resource?: 'worlds' | 'worlds_storage' | 'nodes' | 'audio';
	}

	let { open, onOpenChange, resource = 'nodes' }: Props = $props();

	const usageQuery = useUsage();
	const billingPortalMutation = useBillingPortal();

	const usage = $derived(usageQuery.data);
	const isFree = $derived(usage?.tier === 'FREE');

	$effect(() => {
		if (open) {
			trackEvent('upgrade_prompt_shown', { resource });
		}
	});

	const isStorageResource = $derived(resource === 'worlds_storage');
	const isAudioResource = $derived(resource === 'audio');
	const resourceLabel = $derived.by(() => {
		if (isStorageResource) return 'saved worlds';
		if (resource === 'worlds') return 'world creation';
		if (isAudioResource) return 'audio narration';
		return 'story generation';
	});
</script>

<Dialog.Root {open} {onOpenChange}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Sparkles class="h-5 w-5 text-primary" />
				{#if isStorageResource}
					Saved Worlds Limit Reached
				{:else if resource === 'worlds'}
					World Creation Limit Reached
				{:else if isAudioResource}
					Audio Narration Limit Reached
				{:else}
					Generation Limit Reached
				{/if}
			</Dialog.Title>
			<Dialog.Description>
				{#if isStorageResource}
					You've reached the maximum number of saved worlds for your plan.
				{:else if isAudioResource && isFree}
					You've used all your free audio narrations. Upgrade to generate more.
				{:else if isAudioResource}
					You've reached your audio narration limit for this period.
				{:else}
					You've reached your {resourceLabel} limit for this period.
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-2">
			{#if usage}
				<div class="rounded-lg border border-border bg-muted/50 p-4 text-sm">
					{#if isStorageResource}
						<p class="text-muted-foreground">
							<strong class="text-foreground">{usage.worlds_stored}</strong> of
							<strong class="text-foreground">{usage.worlds_stored_limit}</strong> saved worlds
						</p>
					{:else if resource === 'worlds'}
						<p class="text-muted-foreground">
							<strong class="text-foreground">{usage.worlds_created}</strong> of
							<strong class="text-foreground">{usage.worlds_limit}</strong> worlds created this period
						</p>
						{#if usage.period_end}
							<p class="mt-1 text-muted-foreground">
								Resets on <strong class="text-foreground">{formatDate(usage.period_end)}</strong>
							</p>
						{/if}
					{:else if isAudioResource}
						<p class="text-muted-foreground">
							<strong class="text-foreground">{usage.audio_narrations_used}</strong> of
							<strong class="text-foreground">{usage.audio_narrations_limit}</strong> audio narrations
							used
						</p>
						{#if isFree}
							<p class="mt-1 text-muted-foreground">One-time allowance — does not reset</p>
						{:else if usage.period_end}
							<p class="mt-1 text-muted-foreground">
								Resets on <strong class="text-foreground">{formatDate(usage.period_end)}</strong>
							</p>
						{/if}
					{:else}
						<p class="text-muted-foreground">
							<strong class="text-foreground">{usage.nodes_used}</strong> of
							<strong class="text-foreground">{usage.nodes_limit}</strong> generations used
						</p>
						{#if usage.period_end}
							<p class="mt-1 text-muted-foreground">
								Resets on <strong class="text-foreground">{formatDate(usage.period_end)}</strong>
							</p>
						{/if}
					{/if}
				</div>
			{/if}

			<p class="text-sm text-muted-foreground">
				{#if isStorageResource}
					Delete an existing world or upgrade your plan to create more.
				{:else if isAudioResource && isFree}
					Upgrade your plan to unlock more audio narrations.
				{:else}
					Upgrade your plan for higher limits, or wait for your usage period to reset.
				{/if}
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
