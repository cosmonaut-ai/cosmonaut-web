<script lang="ts">
	import { goto } from '$app/navigation';
	import { useUsage } from '$lib/queries';
	import { getTierConfig } from '$lib/config/tiers';
	import { TooltipContent } from '$lib/components/ui/tooltip';
	import { Button } from '$lib/components/ui/button';
	import { Sparkles } from '@lucide/svelte';

	interface Props {
		/** Which resource hit the limit */
		resource: 'worlds' | 'nodes';
	}

	let { resource }: Props = $props();

	const usageQuery = useUsage();
	const usage = $derived(usageQuery.data);
	const tierConfig = $derived(usage ? getTierConfig(usage.tier) : null);

	const used = $derived(resource === 'worlds' ? usage?.worlds_created : usage?.nodes_used);
	const limit = $derived(resource === 'worlds' ? usage?.worlds_limit : usage?.nodes_limit);
	const resourceLabel = $derived(resource === 'worlds' ? 'worlds' : 'generations');
	const title = $derived(
		resource === 'worlds' ? 'World limit reached' : 'Generation limit reached'
	);

	function formatResetDate(dateStr: string | null): string {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = date.getTime() - now.getTime();
		const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays <= 0) return 'Resets soon';
		if (diffDays === 1) return 'Resets tomorrow';
		if (diffDays <= 7) return `Resets in ${diffDays} days`;

		return `Resets ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
	}
</script>

<TooltipContent class="flex max-w-xs flex-col gap-2 px-4 py-3">
	<p class="font-medium text-popover-foreground">{title}</p>
	<p class="text-xs text-muted-foreground">
		You've used {used ?? 0} of {limit ?? 0}
		{resourceLabel} on the {tierConfig?.name ?? 'Free'} plan.
	</p>
	{#if usage?.period_end}
		<p class="text-xs text-muted-foreground/70">
			{formatResetDate(usage.period_end)}
		</p>
	{/if}
	<Button variant="default" size="sm" class="mt-1 w-full gap-1.5" onclick={() => goto('/pricing')}>
		<Sparkles class="h-3.5 w-3.5" />
		View Plans
	</Button>
</TooltipContent>
