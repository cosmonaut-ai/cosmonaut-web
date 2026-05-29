<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { API_BASE_URL } from '$lib/config';
	import { isAdminUser, useAuth } from '$lib/auth/auth.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Spinner } from '$lib/components/ui/spinner';
	import SEO from '$lib/components/shared/SEO.svelte';
	import {
		Check,
		ChevronDown,
		Crown,
		Globe2,
		LayoutDashboard,
		Music2,
		ShieldCheck,
		Users
	} from '@lucide/svelte';

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
		{ href: '/admin/soundtracks', label: 'Soundtracks', icon: Music2 },
		{ href: '/admin/featured', label: 'Featured', icon: Crown }
	];
	const activeNavItem = $derived(navItems.find((item) => isActive(item.href)) ?? navItems[0]);

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
						User support, moderation, featured story, and soundtrack operations.
					</p>
				</div>

				<div class="flex lg:justify-end">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class="inline-flex h-10 w-full min-w-0 cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-muted/50 px-3 text-sm font-medium text-foreground shadow-xs transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:w-64"
							aria-label="Admin section menu"
						>
							{@const ActiveIcon = activeNavItem.icon}
							<span class="flex min-w-0 items-center gap-2">
								<ActiveIcon class="h-4 w-4 shrink-0 text-muted-foreground" />
								<span class="truncate">{activeNavItem.label}</span>
							</span>
							<ChevronDown class="h-4 w-4 shrink-0 text-muted-foreground" />
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-64">
							<DropdownMenu.Label>Admin sections</DropdownMenu.Label>
							<DropdownMenu.Separator />
							{#each navItems as item (item.href)}
								{@const Icon = item.icon}
								<DropdownMenu.Item onclick={() => goto(item.href)} class="cursor-pointer">
									<Icon class="h-4 w-4" />
									<span class="min-w-0 flex-1 truncate">{item.label}</span>
									{#if isActive(item.href)}
										<Check class="h-4 w-4 text-primary" />
									{/if}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
			</div>

			{@render children()}
		</main>
	</div>
{/if}
