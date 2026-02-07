<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// Redirect to dashboard - this route is deprecated
	onMount(() => {
		goto('/dashboard', { replaceState: true });
	});
</script>

<div class="flex h-full items-center justify-center bg-background">
	<p class="text-muted-foreground">Redirecting to dashboard...</p>
</div>
