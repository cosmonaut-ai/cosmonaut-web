<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	// Redirect to new graph route
	const worldId = $derived(page.params.worldId);
	const graphQuery = $derived.by(() => {
		const searchParams = new SvelteURLSearchParams(page.url.searchParams);
		return searchParams.toString();
	});

	$effect(() => {
		const url = `/worlds/${worldId}/graph${graphQuery ? `?${graphQuery}` : ''}`;
		goto(url, { replaceState: true });
	});
</script>

<div class="flex h-full items-center justify-center bg-background">
	<p class="text-muted-foreground">Redirecting to story map...</p>
</div>
