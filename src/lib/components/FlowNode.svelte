<script lang="ts">
	import { Handle, Position } from '@xyflow/svelte';
	import type { FlowNodeData } from '$lib/utils/nodeTransform';
	import {
		Tooltip,
		TooltipContent,
		TooltipProvider,
		TooltipTrigger
	} from '$lib/components/ui/tooltip';

	interface Props {
		data: FlowNodeData;
		selected?: boolean;
	}

	let { data, selected = false }: Props = $props();

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

	const nodeClasses = $derived.by(() => {
		const baseClasses =
			'flow-node px-4 py-3 rounded-lg border-2 shadow-md cursor-pointer min-w-[200px] max-w-[250px]';
		const selectedClasses = selected
			? 'border-primary bg-primary/10 shadow-lg shadow-primary/20 scale-105'
			: 'border-border bg-card hover:border-primary/50 hover:shadow-lg';
		const rootClasses = data.isRoot
			? 'ring-2 ring-green-500 ring-offset-2 ring-offset-background'
			: '';
		const leafClasses = data.isLeaf
			? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-background'
			: '';
		const currentClasses = data.isCurrent ? 'current-node' : '';

		return `${baseClasses} ${selectedClasses} ${rootClasses} ${leafClasses} ${currentClasses}`;
	});
</script>

<TooltipProvider delayDuration={500}>
	<Tooltip>
		<TooltipTrigger
			type="button"
			class={nodeClasses}
			onclick={handleClick}
			onkeydown={handleKeydown}
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
						<span class="text-xs font-medium text-green-500">START</span>
					{:else if data.isLeaf}
						<span class="text-xs font-medium text-orange-500">END</span>
					{/if}
				</div>

				{#if data.storyNode.choices.length > 0}
					<div class="text-xs text-muted-foreground">
						{data.storyNode.choices.length} choice{data.storyNode.choices.length !== 1 ? 's' : ''}
					</div>
				{/if}
			</div>

			<!-- Output handle (bottom) -->
			{#if !data.isLeaf}
				<Handle type="source" position={Position.Bottom} class="border-primary/50! bg-primary!" />
			{/if}
		</TooltipTrigger>
		<TooltipContent
			side="bottom"
			sideOffset={8}
			class="pointer-events-none w-80 rounded-lg border-border bg-popover p-4 text-sm shadow-xl"
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
		</TooltipContent>
	</Tooltip>
</TooltipProvider>

<style>
	/* ── Flow node entrance ── */
	:global(.flow-node) {
		animation: node-enter 0.4s ease-out both;
		transition:
			transform 0.2s ease,
			border-color 0.2s ease,
			box-shadow 0.2s ease;
	}

	:global(.flow-node:hover) {
		transform: translateY(-2px);
	}

	:global(.flow-node:active) {
		transform: translateY(0);
		transition-duration: 0.1s;
	}

	@keyframes node-enter {
		from {
			opacity: 0;
			transform: scale(0.92);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	/* ── Current node pulsing ring ── */
	:global(.current-node) {
		border-color: var(--chart-2);
		box-shadow:
			0 0 0 2px color-mix(in oklch, var(--chart-2) 35%, transparent),
			0 8px 20px color-mix(in oklch, var(--chart-2) 25%, transparent);
		animation: current-pulse 2.5s ease-in-out infinite;
	}

	@keyframes current-pulse {
		0%, 100% {
			box-shadow:
				0 0 0 2px color-mix(in oklch, var(--chart-2) 35%, transparent),
				0 8px 20px color-mix(in oklch, var(--chart-2) 25%, transparent);
		}
		50% {
			box-shadow:
				0 0 0 4px color-mix(in oklch, var(--chart-2) 25%, transparent),
				0 8px 24px color-mix(in oklch, var(--chart-2) 35%, transparent);
		}
	}

	:global(.svelte-flow__node.selected) {
		outline: none;
	}

	/* ── Reduced motion ── */
	@media (prefers-reduced-motion: reduce) {
		:global(.flow-node) {
			animation: none;
			opacity: 1;
		}
		:global(.flow-node:hover) {
			transform: none;
		}
		:global(.flow-node:active) {
			transform: none;
		}
		:global(.current-node) {
			animation: none;
		}
	}
</style>
