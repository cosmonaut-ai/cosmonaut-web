<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import type { FlowNodeData } from '$lib/utils/nodeTransform';

	interface Props {
		data: FlowNodeData;
		selected?: boolean;
	}

	let { data, selected = false }: Props = $props();

	let showTooltip = $state(false);
	let tooltipTimeout: ReturnType<typeof setTimeout> | null = null;

	function handleMouseEnter() {
		tooltipTimeout = setTimeout(() => {
			showTooltip = true;
		}, 500);
	}

	function handleMouseLeave() {
		if (tooltipTimeout) {
			clearTimeout(tooltipTimeout);
			tooltipTimeout = null;
		}
		showTooltip = false;
	}

	function handleClick() {
		if (data.onNodeClick) {
			data.onNodeClick(data.storyNode.id);
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleClick();
		}
	}

	const nodeClasses = $derived(() => {
		const baseClasses =
			'px-4 py-3 rounded-lg border-2 shadow-md transition-all duration-200 cursor-pointer min-w-[200px] max-w-[250px]';
		const selectedClasses = selected
			? 'border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-105'
			: 'border-border bg-card hover:border-primary/50 hover:shadow-lg';
		const rootClasses = data.isRoot
			? 'ring-2 ring-primary ring-offset-2 ring-offset-background'
			: '';
		const leafClasses = data.isLeaf
			? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-background'
			: '';

		return `${baseClasses} ${selectedClasses} ${rootClasses} ${leafClasses}`;
	});
</script>

<div
	class={nodeClasses()}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	onclick={handleClick}
	onkeydown={handleKeydown}
	role="button"
	tabindex="0"
>
	<!-- Input handle (top) -->
	{#if !data.isRoot}
		<Handle type="target" position={Position.Top} class="border-border! bg-muted-foreground!" />
	{/if}

	<!-- Node content -->
	<div class="space-y-2">
		<div class="flex items-center justify-between gap-2">
			<h3 class="line-clamp-2 text-sm font-semibold text-card-foreground">
				{data.storyNode.title || 'Untitled Node'}
			</h3>
			{#if data.isRoot}
				<span class="text-xs font-medium text-primary">START</span>
			{:else if data.isLeaf}
				<span class="text-xs font-medium text-amber-500">END</span>
			{/if}
		</div>

		{#if data.storyNode.choices.length > 0}
			<div class="text-xs text-muted-foreground">
				{data.storyNode.choices.length} choice{data.storyNode.choices.length !== 1 ? 's' : ''}
			</div>
		{/if}
	</div>

	<!-- Tooltip -->
	{#if showTooltip}
		<div
			class="pointer-events-none absolute top-full left-1/2 z-50 mt-2 w-80 -translate-x-1/2 rounded-lg border border-border bg-popover p-4 shadow-xl"
		>
			<div class="space-y-2">
				<h4 class="font-semibold text-popover-foreground">
					{data.storyNode.title || 'Untitled Node'}
				</h4>
				<p class="line-clamp-4 text-sm text-muted-foreground">
					{data.storyNode.text}
				</p>
				{#if data.storyNode.choices.length > 0}
					<div class="border-t border-border pt-2">
						<p class="mb-1 text-xs font-medium text-muted-foreground">Choices:</p>
						<ul class="space-y-1">
							{#each data.storyNode.choices as choice, index (index)}
								<li class="flex items-start gap-1 text-xs text-muted-foreground">
									<span class="text-primary">•</span>
									<span class="line-clamp-1">{choice.label}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
			<!-- Tooltip arrow -->
			<div
				class="pointer-events-none absolute top-0 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-t border-l border-border bg-popover"
			></div>
		</div>
	{/if}

	<!-- Output handle (bottom) -->
	{#if !data.isLeaf}
		<Handle type="source" position={Position.Bottom} class="border-primary/50! bg-primary!" />
	{/if}
</div>

<style>
	:global(.svelte-flow__node.selected) {
		outline: none;
	}
</style>
