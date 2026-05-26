<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { useAuth } from '$lib/auth/auth.svelte';
	import { useUser } from '$lib/queries/subscription';

	const auth = useAuth();
	const usageQuery = useUser();

	$effect(() => {
		if (
			!auth.isLoading &&
			auth.isAuthenticated &&
			!page.url.pathname.startsWith('/admin') &&
			usageQuery.data !== undefined &&
			!usageQuery.data.is_onboarded
		) {
			goto('/onboarding');
		}
	});
</script>
