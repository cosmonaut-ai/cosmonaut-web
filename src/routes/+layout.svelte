<script lang="ts">
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { useAuth } from '$lib/auth/auth.svelte';
	import { isLocalEnvironment } from '$lib/config';
	import { Button } from '$lib/components/ui/button';
	import { Rocket, LogIn, LogOut } from '@lucide/svelte';

	let { children } = $props();

	const auth = useAuth();

	// Check if we're on the landing page - it has its own header
	const isLandingPage = $derived(page.url.pathname === '/');

	// Show header on non-landing pages when not in local environment
	const showGlobalHeader = $derived(!isLocalEnvironment && !isLandingPage);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Global Header for authenticated pages -->
{#if showGlobalHeader}
	<header class="border-b border-border bg-card">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
			<a href="/" class="flex items-center gap-2">
				<div
					class="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/10"
				>
					<Rocket class="h-4 w-4 text-primary" />
				</div>
				<span class="font-semibold text-foreground">Cosmonaut</span>
			</a>

			<div class="flex items-center gap-3">
				{#if auth.isLoading}
					<div class="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
				{:else if auth.isAuthenticated && auth.user}
					<div class="flex items-center gap-3">
						{#if auth.user.picture}
							<img
								src={auth.user.picture}
								alt={auth.user.name || 'User'}
								class="h-8 w-8 rounded-full ring-2 ring-primary/20"
							/>
						{:else}
							<div
								class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground"
							>
								{(auth.user.name || auth.user.email || 'U').charAt(0).toUpperCase()}
							</div>
						{/if}
						{#if auth.user.name}
							<span class="hidden text-sm font-medium text-foreground sm:block">
								{auth.user.name}
							</span>
						{/if}
						<Button
							variant="ghost"
							size="sm"
							onclick={async () => {
								try {
									await auth.logout();
									// Redirect to home after logout
									goto('/');
								} catch (error) {
									console.error('Failed to log out:', error);
								}
							}}
						>
							<LogOut class="h-4 w-4" />
							<span class="ml-2 hidden sm:inline">Log out</span>
						</Button>
					</div>
				{:else}
					<Button
						variant="ghost"
						size="sm"
						class="text-muted-foreground hover:text-foreground"
						onclick={async () => {
							try {
								await auth.login();
							} catch (error) {
								console.error('Failed to sign in:', error);
							}
						}}
					>
						<LogIn class="h-4 w-4" />
						<span class="ml-2">Sign In</span>
					</Button>
				{/if}
			</div>
		</div>
	</header>
{/if}

{@render children()}
