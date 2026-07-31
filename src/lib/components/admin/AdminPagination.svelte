<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';

	interface Props {
		count: number;
		label?: string;
		hasPrevious: boolean;
		hasNext: boolean;
		loading?: boolean;
		onFirst: () => void;
		onNext: () => void;
	}

	let {
		count,
		label = 'item',
		hasPrevious,
		hasNext,
		loading = false,
		onFirst,
		onNext
	}: Props = $props();

	const plural = $derived(count === 1 ? label : `${label}s`);
</script>

<div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
	<p class="text-sm text-muted-foreground">
		Showing {count}
		{plural} on this page.
	</p>
	<div class="flex gap-2">
		<Button variant="outline" size="sm" disabled={!hasPrevious || loading} onclick={onFirst}>
			First Page
		</Button>
		<Button variant="outline" size="sm" disabled={!hasNext || loading} onclick={onNext}>
			{#if loading}
				<Spinner class="h-4 w-4" />
			{/if}
			Next Page
		</Button>
	</div>
</div>
