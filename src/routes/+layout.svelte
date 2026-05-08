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
	import UserMenu from '$lib/components/shared/UserMenu.svelte';
	import AppFooter from '$lib/components/shared/AppFooter.svelte';
	import OnboardingGuard from '$lib/components/shared/OnboardingGuard.svelte';

	let { children } = $props();

	const auth = useAuth();

	// Routes that do not require authentication
	const PUBLIC_ROUTES = ['/', '/login', '/callback', '/terms', '/privacy', '/pricing', '/about'];

	function isPublicRoute(pathname: string): boolean {
		const normalized =
			pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
		return PUBLIC_ROUTES.includes(normalized);
	}

	const isLandingPage = $derived(page.url.pathname === '/');
	const isOnboardingPage = $derived(page.url.pathname.startsWith('/onboarding'));

	const showGlobalHeader = $derived(!isOnboardingPage);

	const showFooter = $derived(
		!page.url.pathname.startsWith('/login') &&
			!page.url.pathname.startsWith('/callback') &&
			!page.url.pathname.startsWith('/onboarding') &&
			!page.url.pathname.includes('/graph') &&
			!page.url.pathname.includes('/map')
	);

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
			<!-- Global Header -->
			{#if showGlobalHeader}
				<header class="border-b border-border bg-card {isLandingPage ? 'sticky top-0 z-50' : ''}">
					<div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
						<a href={auth.isAuthenticated ? '/dashboard' : '/'} class="flex items-center gap-2">
							<div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
								<img src="/logo.png" alt="Cosmonaut logo" class="h-6 w-6" />
							</div>
							<span class="font-orbitron font-semibold text-foreground">Cosmonaut</span>
						</a>

						<div class="flex items-center gap-1">
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
									onclick={() => goto('/about')}
								>
									About
								</Button>
								<Button
									variant="ghost"
									size="sm"
									class="text-muted-foreground hover:text-foreground"
									onclick={() => goto('/pricing')}
								>
									Pricing
								</Button>
								<Button size="sm" class="ml-2" onclick={handleSignIn}>
									<LogIn class="h-4 w-4" />
									Sign In
								</Button>
							{/if}
						</div>
					</div>
				</header>
			{/if}

			{#if !isOnboardingPage}
				<OnboardingGuard />
			{/if}

			<div id="main-content" class="relative flex flex-1 flex-col">
				{@render children()}
			</div>
			{#if showFooter}
				<AppFooter isAuthenticated={auth.isAuthenticated} />
			{/if}
		</div>
	</TooltipProvider>
</QueryClientProvider>
