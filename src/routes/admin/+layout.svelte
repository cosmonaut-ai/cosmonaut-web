<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/config';
	import { isAdminUser, useAuth } from '$lib/auth/auth.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Spinner } from '$lib/components/ui/spinner';
	import SEO from '$lib/components/shared/SEO.svelte';
	import { Crown, Globe2, LayoutDashboard, ShieldCheck, Users } from '@lucide/svelte';

	let { children } = $props();

	const auth = useAuth();
	const apiBaseDisplay = API_BASE_URL.replace(/^https?:\/\//, '');
	const canUseAdmin = $derived(auth.isAuthenticated && isAdminUser(auth.user));
	const pathname = $derived(page.url.pathname);
	let routeReady = $state(false);

	const navItems = [
		{ href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/admin/users', label: 'Users', icon: Users },
		{ href: '/admin/worlds', label: 'Worlds', icon: Globe2 },
		{ href: '/admin/featured', label: 'Featured', icon: Crown }
	];

	onMount(() => {
		routeReady = true;
	});

	$effect(() => {
		if (!routeReady || auth.isLoading) return;
		if (auth.isAuthenticated && !isAdminUser(auth.user)) {
			goto('/', { replaceState: true });
		}
	});

	function isActive(href: string): boolean {
		return pathname === href || pathname.startsWith(`${href}/`);
	}
</script>

<SEO
	title="Admin - Cosmonaut"
	description="Cosmonaut administrative console."
	path={pathname}
	noindex
/>

{#if auth.isLoading || !routeReady || !auth.isAuthenticated || (auth.isAuthenticated && !canUseAdmin)}
	<div class="flex min-h-[60dvh] items-center justify-center bg-background">
		<Spinner class="h-6 w-6" />
	</div>
{:else}
	<div class="min-h-full bg-background">
		<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<div class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div>
					<div class="mb-3 flex flex-wrap items-center gap-2">
						<Badge class="border-primary/30 bg-primary/10 text-primary">
							<ShieldCheck class="mr-1 h-3.5 w-3.5" />
							{auth.user?.groups?.join(', ') || 'Admin'}
						</Badge>
						<Badge variant="outline">{apiBaseDisplay}</Badge>
					</div>
					<h1 class="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">Admin</h1>
					<p class="mt-1 max-w-2xl text-sm text-muted-foreground">
						User support, moderation, and featured story operations.
					</p>
				</div>

				<nav
					class="grid w-full grid-cols-2 gap-2 rounded-lg border border-border bg-muted/50 p-1 sm:grid-cols-4 lg:w-[36rem]"
					aria-label="Admin sections"
				>
					{#each navItems as item (item.href)}
						{@const Icon = item.icon}
						<a
							href={item.href}
							aria-current={isActive(item.href) ? 'page' : undefined}
							class="inline-flex min-w-0 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all {isActive(
								item.href
							)
								? 'bg-background text-foreground shadow-sm'
								: 'text-muted-foreground hover:text-foreground'}"
						>
							<Icon class="h-4 w-4 shrink-0" />
							<span class="truncate">{item.label}</span>
						</a>
					{/each}
				</nav>
			</div>

			{@render children()}
		</main>
	</div>
{/if}
