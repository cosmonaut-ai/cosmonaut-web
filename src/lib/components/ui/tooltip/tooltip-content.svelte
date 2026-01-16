<script lang="ts">
	import { Tooltip as TooltipPrimitive } from 'bits-ui';
	import { cn, type WithoutChild } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChild<TooltipPrimitive.ContentProps> = $props();
</script>

<TooltipPrimitive.Content
	bind:ref
	data-slot="tooltip-content"
	class={cn(
		'z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
		className
	)}
	{...restProps}
>
	{@render children?.()}
</TooltipPrimitive.Content>
