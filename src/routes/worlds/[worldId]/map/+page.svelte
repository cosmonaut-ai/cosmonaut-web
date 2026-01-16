<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	// Redirect to new graph route
	const worldId = page.params.worldId;
	const nodeParam = page.url.searchParams.get('node');

	$effect(() => {
		const url = nodeParam
			? `/worlds/${worldId}/graph?node=${nodeParam}`
			: `/worlds/${worldId}/graph`;
		goto(url, { replaceState: true });
	});
</script>

<div class="flex h-full items-center justify-center bg-background">
	<p class="text-muted-foreground">Redirecting to story map...</p>
</div>
