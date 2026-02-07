<script lang="ts">
	interface Props {
		label: string;
		used: number;
		limit: number;
		/** Optional compact mode for inline display */
		compact?: boolean;
	}

	let { label, used, limit, compact = false }: Props = $props();

	const percentage = $derived(limit > 0 ? Math.min((used / limit) * 100, 100) : 0);
	const isAtLimit = $derived(used >= limit);
	const isNearLimit = $derived(percentage >= 80);

	const barColor = $derived.by(() => {
		if (isAtLimit) return 'bg-destructive';
		if (isNearLimit) return 'bg-amber-500';
		return 'bg-primary';
	});

	const textColor = $derived.by(() => {
		if (isAtLimit) return 'text-destructive';
		if (isNearLimit) return 'text-amber-400';
		return 'text-muted-foreground';
	});
</script>

{#if compact}
	<div class="space-y-1">
		<div class="flex items-center justify-between text-xs">
			<span class="text-muted-foreground">{label}</span>
			<span class="{textColor} font-medium tabular-nums">
				{used.toLocaleString()}/{limit.toLocaleString()}
			</span>
		</div>
		<div class="h-1.5 w-full overflow-hidden rounded-full bg-muted">
			<div
				class="{barColor} h-full rounded-full transition-all duration-300"
				style="width: {percentage}%"
			></div>
		</div>
	</div>
{:else}
	<div class="space-y-2">
		<div class="flex items-center justify-between">
			<span class="text-sm font-medium text-foreground">{label}</span>
			<span class="{textColor} text-sm font-medium tabular-nums">
				{used.toLocaleString()} / {limit.toLocaleString()}
			</span>
		</div>
		<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
			<div
				class="{barColor} h-full rounded-full transition-all duration-300"
				style="width: {percentage}%"
			></div>
		</div>
		{#if isAtLimit}
			<p class="text-xs text-destructive">Limit reached</p>
		{:else if isNearLimit}
			<p class="text-xs text-amber-400">Approaching limit</p>
		{/if}
	</div>
{/if}
