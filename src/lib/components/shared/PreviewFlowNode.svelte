<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';

	interface Props {
		data: { title: string; summary: string; isRoot?: boolean; isLeaf?: boolean };
	}

	let { data }: Props = $props();

	const borderClass = $derived(
		data.isRoot ? 'border-primary/60' : data.isLeaf ? 'border-chart-2/60' : 'border-border'
	);
</script>

<div
	class={`pointer-events-none w-[180px] rounded-md border-2 bg-card px-3 py-2.5 shadow-sm ${borderClass}`}
>
	<Handle type="target" position={Position.Top} style="opacity: 0; pointer-events: none;" />
	{#if data.isRoot}
		<p class="mb-1 text-[9px] font-medium tracking-[0.15em] text-primary/80 uppercase">Start</p>
	{:else if data.isLeaf}
		<p class="mb-1 text-[9px] font-medium tracking-[0.15em] text-muted-foreground/70 uppercase">
			Ending
		</p>
	{/if}
	<p class="text-xs leading-snug font-medium text-foreground">{data.title}</p>
	<p class="mt-1 text-[11px] leading-snug text-muted-foreground/80">{data.summary}</p>
	<Handle type="source" position={Position.Bottom} style="opacity: 0; pointer-events: none;" />
</div>
