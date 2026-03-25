<script lang="ts">
	import { AlertDialog as AlertDialogPrimitive } from 'bits-ui';
	import {
		buttonVariants,
		type ButtonVariant
	} from '$lib/components/ui/button/index.js';
	import { cn } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		class: className,
		variant = 'default' as ButtonVariant,
		...restProps
	}: AlertDialogPrimitive.ActionProps & { variant?: ButtonVariant } = $props();
</script>

<AlertDialogPrimitive.Action
	bind:ref
	data-slot="button"
	data-variant={variant}
	class={cn(buttonVariants({ variant }), className)}
	{...restProps}
/>
