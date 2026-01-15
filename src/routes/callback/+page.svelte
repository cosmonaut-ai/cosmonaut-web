<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { checkAuthState, getIsAuthenticated } from '$lib/auth/auth.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	let error = $state<string | null>(null);
	let checking = $state(true);

	onMount(async () => {
		try {
			// Amplify automatically handles the code exchange when configured
			// We just need to wait for it to complete and check auth state
			await checkAuthState();

			// Give Amplify a moment to finish processing
			await new Promise((resolve) => setTimeout(resolve, 500));

			if (getIsAuthenticated()) {
				// Successfully authenticated, redirect to dashboard
				goto('/dashboard');
			} else {
				// Check again after a delay
				await new Promise((resolve) => setTimeout(resolve, 1000));
				await checkAuthState();

				if (getIsAuthenticated()) {
					goto('/dashboard');
				} else {
					error = 'Authentication failed. Please try again.';
				}
			}
		} catch (err) {
			console.error('Callback error:', err);
			error = err instanceof Error ? err.message : 'Authentication failed';
		} finally {
			checking = false;
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
	<div class="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
		{#if checking}
			<div class="flex flex-col items-center gap-4">
				<LoadingSpinner size="lg" />
				<p class="text-gray-600">Completing sign in...</p>
			</div>
		{:else if error}
			<div class="text-center">
				<div class="mb-4 text-red-500">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mx-auto h-12 w-12"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
				</div>
				<h2 class="mb-2 text-xl font-semibold text-gray-900">Authentication Failed</h2>
				<p class="mb-4 text-gray-600">{error}</p>
				<button
					onclick={() => goto('/')}
					class="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
				>
					Return Home
				</button>
			</div>
		{/if}
	</div>
</div>
