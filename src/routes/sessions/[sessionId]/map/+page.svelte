<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	const sessionId = $derived(page.params.sessionId!);

	$effect(() => {
		goto(`/sessions/${sessionId}/graph${page.url.search}`, { replaceState: true });
	});
</script>
