<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { ArrowLeft } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description?: string;
		backHref?: string;
		backLabel?: string;
		children?: Snippet;
	}

	let {
		title,
		description,
		backHref = '/dashboard',
		backLabel = 'Back to Dashboard',
		children
	}: Props = $props();
</script>

<div class="mb-8">
	<Button variant="ghost" size="sm" onclick={() => goto(backHref)} class="mb-4 gap-2">
		<ArrowLeft class="h-4 w-4" />
		{backLabel}
	</Button>
	<h1 class="text-3xl font-bold text-foreground">{title}</h1>
	{#if description}
		<p class="mt-1 text-muted-foreground">{description}</p>
	{/if}
	{#if children}
		{@render children()}
	{/if}
</div>
