<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { useAuth } from '$lib/auth/auth.svelte';
	import { isLocalEnvironment, isDevEnvironment, PRODUCTION_URL, DEV_ALLOWED_EMAILS } from '$lib/config';
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Toaster } from '$lib/components/ui/sonner';
	import { TooltipProvider } from '$lib/components/ui/tooltip';
	import { ModeWatcher, setMode } from 'mode-watcher';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { queryClient } from '$lib/queries/client';
	import { LogIn } from '@lucide/svelte';
	import UserMenu from '$lib/components/UserMenu.svelte';

	let { children } = $props();

	const auth = useAuth();

	let isSigningIn = $state(false);

	// Check if we're on the landing page - it has its own header
	const isLandingPage = $derived(page.url.pathname === '/');

	// Show header on non-landing pages (works in both local and production)
	const showGlobalHeader = $derived(!isLandingPage);

	// Redirect non-allowlisted users away from the dev environment to production
	$effect(() => {
		if (isDevEnvironment && !auth.isLoading && auth.isAuthenticated && auth.user?.email) {
			if (!DEV_ALLOWED_EMAILS.includes(auth.user.email)) {
				window.location.href = PRODUCTION_URL;
			}
		}
	});

	onMount(() => {
		if (typeof localStorage === 'undefined') return;

		const storedMode = localStorage.getItem('mode-watcher-mode');

		if (!storedMode || storedMode === 'system') {
			setMode('dark');
		}
	});

	async function handleSignIn() {
		if (isSigningIn) return;

		// If already authenticated, navigate to dashboard instead of re-triggering OAuth
		if (auth.isAuthenticated) {
			goto('/dashboard');
			return;
		}

		try {
			isSigningIn = true;
			await auth.login();
			// In local environment, redirect after login (OAuth redirects via callback)
			if (isLocalEnvironment && auth.isAuthenticated) {
				goto('/dashboard');
			}
		} catch (error) {
			console.error('Failed to sign in:', error);
		} finally {
			// Only reset if we're still on this page (local env)
			if (isLocalEnvironment) {
				isSigningIn = false;
			}
		}
	}
</script>

<ModeWatcher defaultMode="dark" track={false} />
<Toaster richColors />
<QueryClientProvider client={queryClient}>
	<TooltipProvider>
		<div class="flex h-full flex-col">
			<!-- Global Header for authenticated pages -->
			{#if showGlobalHeader}
				<header class="shrink-0 border-b border-border bg-card">
					<div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
						<a href="/" class="flex items-center gap-2">
							<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
								<img src="/logo.png" alt="Cosmonaut logo" class="h-6 w-6" />
							</div>
							<span class="font-semibold text-foreground">Cosmonaut</span>
						</a>

						<div class="flex items-center gap-3">
							{#if auth.isLoading}
								<div class="flex items-center gap-3">
									<Skeleton class="h-8 w-8 rounded-full" />
									<Skeleton class="hidden h-4 w-20 sm:block" />
								</div>
							{:else if auth.isAuthenticated && auth.user}
								<UserMenu />
							{:else}
								<Button
									variant="ghost"
									size="sm"
									class="text-muted-foreground hover:text-foreground"
									onclick={handleSignIn}
									disabled={isSigningIn}
								>
									{#if isSigningIn}
										<Spinner />
										Signing in...
									{:else}
										<LogIn class="h-4 w-4" />
										Sign In
									{/if}
								</Button>
							{/if}
						</div>
					</div>
				</header>
			{/if}

			<div class="min-h-0 flex-1">
				{@render children()}
			</div>
		</div>
	</TooltipProvider>
</QueryClientProvider>
