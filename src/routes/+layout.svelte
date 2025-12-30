<script lang="ts">
	import { onMount } from 'svelte';
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { initializeAuth, useAuth } from '$lib/auth/auth.svelte';
	import { isLocalEnvironment } from '$lib/config';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	let { children } = $props();

	const auth = useAuth();

	onMount(() => {
		initializeAuth();
	});

	// Determine if we should show the login button
	// Only show when: not local AND not authenticated AND not loading
	const showLoginButton = $derived(!isLocalEnvironment && !auth.isAuthenticated && !auth.isLoading);

	// Show user info when authenticated
	const showUserInfo = $derived(!isLocalEnvironment && auth.isAuthenticated);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Global Header with Auth -->
{#if !isLocalEnvironment}
	<header class="border-b border-gray-200 bg-white">
		<div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
			<a href="/" class="text-xl font-bold text-gray-900">Cosmonaut</a>

			<div class="flex items-center gap-4">
				{#if auth.isLoading}
					<LoadingSpinner size="sm" />
				{:else if showLoginButton}
					<button
						onclick={() => auth.login()}
						class="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
					>
						<svg class="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
							<path
								fill="#4285F4"
								d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
							/>
							<path
								fill="#34A853"
								d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
							/>
							<path
								fill="#FBBC05"
								d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
							/>
							<path
								fill="#EA4335"
								d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
							/>
						</svg>
						Log in with Google
					</button>
				{:else if showUserInfo && auth.user}
					<div class="flex items-center gap-3">
						{#if auth.user.picture}
							<img
								src={auth.user.picture}
								alt={auth.user.name || 'User'}
								class="h-8 w-8 rounded-full"
							/>
						{:else}
							<div
								class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white"
							>
								{(auth.user.name || auth.user.email || 'U').charAt(0).toUpperCase()}
							</div>
						{/if}
						{#if auth.user.name}
							<span class="text-sm font-medium text-gray-700">{auth.user.name}</span>
						{/if}
						<button
							onclick={() => auth.logout()}
							class="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
						>
							Log out
						</button>
					</div>
				{/if}
			</div>
		</div>
	</header>
{/if}

{@render children()}
