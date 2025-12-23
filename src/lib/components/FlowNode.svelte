<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import type { NodeProps } from '@xyflow/svelte';
	import type { FlowNodeData } from '$lib/utils/nodeTransform';

	let { data, selected }: NodeProps<FlowNodeData> = $props();

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

	const nodeClasses = $derived(() => {
		const baseClasses =
			'px-4 py-3 rounded-lg border-2 shadow-md transition-all duration-200 cursor-pointer min-w-[200px] max-w-[250px]';
		const selectedClasses = selected
			? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
			: 'border-gray-300 bg-white hover:border-gray-400 hover:shadow-lg';
		const rootClasses = data.isRoot ? 'ring-2 ring-green-400 ring-offset-2' : '';
		const leafClasses = data.isLeaf ? 'ring-2 ring-orange-400 ring-offset-2' : '';

		return `${baseClasses} ${selectedClasses} ${rootClasses} ${leafClasses}`;
	});
</script>

<div
	class={nodeClasses()}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	onclick={handleClick}
	role="button"
	tabindex="0"
>
	<!-- Input handle (top) -->
	{#if !data.isRoot}
		<Handle type="target" position={Position.Top} class="!bg-gray-400" />
	{/if}

	<!-- Node content -->
	<div class="space-y-2">
		<div class="flex items-center justify-between gap-2">
			<h3 class="line-clamp-2 text-sm font-semibold text-gray-900">
				{data.storyNode.title || 'Untitled Node'}
			</h3>
			{#if data.isRoot}
				<span class="text-xs font-medium text-green-600">START</span>
			{:else if data.isLeaf}
				<span class="text-xs font-medium text-orange-600">END</span>
			{/if}
		</div>

		{#if data.storyNode.choices.length > 0}
			<div class="text-xs text-gray-500">
				{data.storyNode.choices.length} choice{data.storyNode.choices.length !== 1 ? 's' : ''}
			</div>
		{/if}
	</div>

	<!-- Tooltip -->
	{#if showTooltip}
		<div
			class="pointer-events-none absolute top-full left-1/2 z-50 mt-2 w-80 -translate-x-1/2 rounded-lg border border-gray-200 bg-white p-4 shadow-xl"
		>
			<div class="space-y-2">
				<h4 class="font-semibold text-gray-900">
					{data.storyNode.title || 'Untitled Node'}
				</h4>
				<p class="line-clamp-4 text-sm text-gray-700">
					{data.storyNode.text}
				</p>
				{#if data.storyNode.choices.length > 0}
					<div class="border-t border-gray-200 pt-2">
						<p class="mb-1 text-xs font-medium text-gray-600">Choices:</p>
						<ul class="space-y-1">
							{#each data.storyNode.choices as choice, index (index)}
								<li class="flex items-start gap-1 text-xs text-gray-600">
									<span class="text-gray-400">•</span>
									<span class="line-clamp-1">{choice.label}</span>
								</li>
							{/each}
						</ul>
					</div>
				{/if}
			</div>
			<!-- Tooltip arrow -->
			<div
				class="pointer-events-none absolute top-0 left-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-t border-l border-gray-200 bg-white"
			></div>
		</div>
	{/if}

	<!-- Output handle (bottom) -->
	{#if !data.isLeaf}
		<Handle type="source" position={Position.Bottom} class="!bg-gray-400" />
	{/if}
</div>

<style>
	:global(.svelte-flow__node.selected) {
		outline: none;
	}
</style>
