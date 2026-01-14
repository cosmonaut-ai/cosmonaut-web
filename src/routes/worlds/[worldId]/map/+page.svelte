<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	// Redirect to new graph route
	onMount(() => {
		const nodeParam = page.url.searchParams.get('node');
		const worldId = page.params.worldId;
		const url = nodeParam
			? `/worlds/${worldId}/graph?node=${nodeParam}`
			: `/worlds/${worldId}/graph`;
		goto(url, { replaceState: true });
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-background">
	<p class="text-muted-foreground">Redirecting to story map...</p>
</div>
