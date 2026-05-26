<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Spinner } from '$lib/components/ui/spinner';

	onMount(() => {
		goto('/admin/dashboard', { replaceState: true });
	});
</script>

<div class="flex min-h-[60dvh] items-center justify-center">
	<Spinner class="h-6 w-6" />
</div>
