<script lang="ts">
	import './layout.css';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { useAuth } from '$lib/auth/auth.svelte';
	import { isDevEnvironment, PRODUCTION_URL, DEV_ALLOWED_EMAILS } from '$lib/config';
	import { trackPageView } from '$lib/utils/analytics';
	import { Button } from '$lib/components/ui/button';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Toaster } from '$lib/components/ui/sonner';
	import { TooltipProvider } from '$lib/components/ui/tooltip';
	import { ModeWatcher, setMode } from 'mode-watcher';
	import { QueryClientProvider } from '@tanstack/svelte-query';
	import { queryClient } from '$lib/queries/client';
	import { LogIn } from '@lucide/svelte';
	import UserMenu from '$lib/components/UserMenu.svelte';

	let { children } = $props();

	const auth = useAuth();

	// Routes that do not require authentication
	const PUBLIC_ROUTES = ['/', '/login', '/callback', '/terms', '/privacy', '/pricing', '/about'];

	function isPublicRoute(pathname: string): boolean {
		const normalized =
			pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
		return PUBLIC_ROUTES.includes(normalized);
	}

	// Check if we're on the landing page - it has its own header
	const isLandingPage = $derived(page.url.pathname === '/');

	// Show header on non-landing pages (works in both local and production)
	const showGlobalHeader = $derived(!isLandingPage);

	// Track SPA page views on route changes
	$effect(() => {
		trackPageView(page.url.pathname);
	});

	// Redirect unauthenticated users on protected routes to the login page
	$effect(() => {
		if (!auth.isLoading && !auth.isAuthenticated && !isPublicRoute(page.url.pathname)) {
			const redirectPath = page.url.pathname + page.url.search;
			goto(`/login?redirect=${encodeURIComponent(redirectPath)}`);
		}
	});

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

	function handleSignIn() {
		if (auth.isAuthenticated) {
			goto('/dashboard');
			return;
		}
		goto('/login');
	}
</script>

<ModeWatcher defaultMode="dark" track={false} />
<Toaster richColors />
<QueryClientProvider client={queryClient}>
	<TooltipProvider>
		<a
			href="#main-content"
			class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
		>
			Skip to main content
		</a>
		<div class="flex min-h-dvh flex-col">
			<!-- Global Header for authenticated pages -->
			{#if showGlobalHeader}
				<header class="border-b border-border bg-card">
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
								>
									<LogIn class="h-4 w-4" />
									Sign In
								</Button>
							{/if}
						</div>
					</div>
				</header>
			{/if}

			<div id="main-content" class="relative flex-1">
				{@render children()}
			</div>
		</div>
	</TooltipProvider>
</QueryClientProvider>
