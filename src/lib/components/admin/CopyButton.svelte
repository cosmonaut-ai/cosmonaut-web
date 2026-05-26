<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Check, Copy } from '@lucide/svelte';
	import { Button } from '$lib/components/ui/button';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import { showError, showSuccess } from '$lib/utils/toast';

	interface Props {
		value: string | null | undefined;
		label?: string;
		successLabel?: string;
		class?: string;
	}

	let { value, label = 'Copy', successLabel = 'Copied', class: className = '' }: Props = $props();

	let copied = $state(false);
	let resetTimer: ReturnType<typeof setTimeout> | null = null;

	onDestroy(() => {
		if (resetTimer) clearTimeout(resetTimer);
	});

	async function copyValue() {
		if (!value) return;

		try {
			await navigator.clipboard.writeText(value);
			copied = true;
			showSuccess(successLabel);
			if (resetTimer) clearTimeout(resetTimer);
			resetTimer = setTimeout(() => {
				copied = false;
				resetTimer = null;
			}, 1500);
		} catch (error) {
			showError('Copy failed', error instanceof Error ? error.message : undefined);
		}
	}
</script>

<Tooltip>
	<TooltipTrigger>
		<Button
			type="button"
			variant="ghost"
			size="icon-sm"
			class={className}
			disabled={!value}
			onclick={copyValue}
			aria-label={label}
		>
			{#if copied}
				<Check class="h-4 w-4 text-emerald-300" />
			{:else}
				<Copy class="h-4 w-4" />
			{/if}
		</Button>
	</TooltipTrigger>
	<TooltipContent>{label}</TooltipContent>
</Tooltip>
