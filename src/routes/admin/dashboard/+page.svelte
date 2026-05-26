<script lang="ts">
	import { onMount } from 'svelte';
	import {
		listAdminFeaturedWorlds,
		listAdminUsers,
		listAdminWorlds,
		type AdminCognitoUser
	} from '$lib/api/admin';
	import type { World } from '$lib/types/api';
	import {
		formatDate,
		formatDateTime,
		shortId,
		tierClass,
		visibilityClass
	} from '$lib/admin/format';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Crown, Globe2, RefreshCw, Users } from '@lucide/svelte';

	let users = $state<AdminCognitoUser[]>([]);
	let worlds = $state<World[]>([]);
	let featuredWorlds = $state<World[]>([]);
	let loading = $state(false);
	let error = $state('');

	onMount(() => {
		void loadDashboard();
	});

	async function loadDashboard() {
		if (loading) return;
		loading = true;
		error = '';
		try {
			const [userResponse, worldResponse, featuredResponse] = await Promise.all([
				listAdminUsers({ limit: 10 }),
				listAdminWorlds(),
				listAdminFeaturedWorlds()
			]);
			users = userResponse.items;
			worlds = worldResponse.items;
			featuredWorlds = featuredResponse.items;
		} catch (caught) {
			error = caught instanceof Error ? caught.message : 'Failed to load admin dashboard';
		} finally {
			loading = false;
		}
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between gap-4">
		<div>
			<h2 class="text-xl font-semibold text-foreground">Dashboard</h2>
			<p class="mt-1 text-sm text-muted-foreground">A quick operational snapshot.</p>
		</div>
		<Button variant="outline" size="sm" disabled={loading} onclick={loadDashboard}>
			<RefreshCw class="h-4 w-4" />
			Refresh
		</Button>
	</div>

	{#if error}
		<div
			class="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
		>
			{error}
		</div>
	{/if}

	<div class="grid gap-3 sm:grid-cols-3">
		<Card class="min-w-0">
			<CardContent class="flex items-center justify-between p-4">
				<div>
					<p class="text-xs font-medium text-muted-foreground uppercase">Loaded users</p>
					<p class="mt-1 text-2xl font-semibold text-foreground">{users.length}</p>
				</div>
				<Users class="h-5 w-5 text-primary" />
			</CardContent>
		</Card>
		<Card class="min-w-0">
			<CardContent class="flex items-center justify-between p-4">
				<div>
					<p class="text-xs font-medium text-muted-foreground uppercase">Loaded worlds</p>
					<p class="mt-1 text-2xl font-semibold text-foreground">{worlds.length}</p>
				</div>
				<Globe2 class="h-5 w-5 text-sky-300" />
			</CardContent>
		</Card>
		<Card class="min-w-0">
			<CardContent class="flex items-center justify-between p-4">
				<div>
					<p class="text-xs font-medium text-muted-foreground uppercase">Featured</p>
					<p class="mt-1 text-2xl font-semibold text-foreground">{featuredWorlds.length}</p>
				</div>
				<Crown class="h-5 w-5 text-amber-300" />
			</CardContent>
		</Card>
	</div>

	{#if loading && users.length === 0 && worlds.length === 0 && featuredWorlds.length === 0}
		<div class="flex h-52 items-center justify-center">
			<Spinner class="h-6 w-6" />
		</div>
	{:else}
		<div class="grid min-w-0 gap-6 xl:grid-cols-2">
			<Card class="min-w-0">
				<CardHeader class="flex-row items-center justify-between">
					<CardTitle>Recent Users</CardTitle>
					<Button href="/admin/users" variant="outline" size="sm">View All</Button>
				</CardHeader>
				<CardContent>
					<div class="space-y-3">
						{#each users.slice(0, 5) as user (user.sub)}
							<a
								href={`/admin/users/${user.sub}`}
								class="block rounded-md border border-border p-3 hover:bg-muted/40"
							>
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<p class="truncate text-sm font-medium text-foreground">
											{user.email || 'No email'}
										</p>
										<p class="mt-1 font-mono text-xs text-muted-foreground">{shortId(user.sub)}</p>
									</div>
									<Badge class={tierClass(user.tier)}>{user.tier}</Badge>
								</div>
								<p class="mt-2 text-xs text-muted-foreground">{formatDate(user.created_at)}</p>
							</a>
						{/each}
					</div>
				</CardContent>
			</Card>

			<Card class="min-w-0">
				<CardHeader class="flex-row items-center justify-between">
					<CardTitle>Recent Worlds</CardTitle>
					<Button href="/admin/worlds" variant="outline" size="sm">View All</Button>
				</CardHeader>
				<CardContent>
					<div class="space-y-3">
						{#each worlds.slice(0, 5) as world (world.id)}
							<a
								href={`/admin/worlds/${world.id}`}
								class="block rounded-md border border-border p-3 hover:bg-muted/40"
							>
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<p class="truncate text-sm font-medium text-foreground">
											{world.title || 'Untitled world'}
										</p>
										<p class="mt-1 font-mono text-xs text-muted-foreground">{shortId(world.id)}</p>
									</div>
									<Badge class={visibilityClass(world.visibility)}>
										{world.visibility || 'unknown'}
									</Badge>
								</div>
								<p class="mt-2 text-xs text-muted-foreground">{formatDateTime(world.updated_at)}</p>
							</a>
						{/each}
					</div>
				</CardContent>
			</Card>
		</div>
	{/if}
</div>
