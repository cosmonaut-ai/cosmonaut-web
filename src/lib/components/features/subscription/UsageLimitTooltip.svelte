<script lang="ts">
	import { goto } from '$app/navigation';
	import { useUser } from '$lib/queries';
	import { getTierConfig } from '$lib/config/tiers';
	import { TooltipContent } from '$lib/components/ui/tooltip';
	import { Button } from '$lib/components/ui/button';
	import { Sparkles } from '@lucide/svelte';
	import { formatResetDate } from '$lib/utils/date';

	interface Props {
		/** Which resource hit the limit */
		resource: 'worlds' | 'nodes';
	}

	let { resource }: Props = $props();

	const usageQuery = useUser();
	const usage = $derived(usageQuery.data);
	const tierConfig = $derived(usage ? getTierConfig(usage.tier) : null);

	const used = $derived(resource === 'worlds' ? usage?.worlds_created : usage?.nodes_used);
	const limit = $derived(resource === 'worlds' ? usage?.worlds_limit : usage?.nodes_limit);
	const resourceLabel = $derived(resource === 'worlds' ? 'worlds' : 'generations');
	const title = $derived(
		resource === 'worlds' ? 'World limit reached' : 'Generation limit reached'
	);
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
