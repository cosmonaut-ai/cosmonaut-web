<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		listAdminFeaturedWorlds,
		listAdminWorlds,
		promoteAdminWorld,
		removeAdminWorldFromFeatured,
		updateAdminFeaturedOrder,
		type AdminFeaturedOrderItem
	} from '$lib/api/admin';
	import type { World } from '$lib/types/api';
	import { formatDateTime, shortId, visibilityClass } from '$lib/admin/format';
	import { queryValue, routeWithQuery } from '$lib/admin/url';
	import { showError, showSuccess } from '$lib/utils/toast';
	import CopyButton from '$lib/components/admin/CopyButton.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Spinner } from '$lib/components/ui/spinner';
	import { ArrowDown, ArrowUp, Crown, RefreshCw, Search, WalletCards } from '@lucide/svelte';

	const cursorParam = $derived(page.url.searchParams.get('cursor'));
	const addSearchParam = $derived(queryValue(page.url, 'search'));

	let featuredWorlds = $state<World[]>([]);
	let nextCursor = $state<string | null>(null);
	let candidateWorlds = $state<World[]>([]);
	let addSearch = $state('');
	let loading = $state(false);
	let searching = $state(false);
	let error = $state('');
	let searchError = $state('');
	let actionPending = $state('');
	let listRequestId = 0;
	let searchRequestId = 0;

	const isMutating = $derived(actionPending !== '');

	$effect(() => {
		const currentRequest = ++listRequestId;
		void loadFeatured(cursorParam, currentRequest);
	});

	$effect(() => {
		const currentRequest = ++searchRequestId;
		addSearch = addSearchParam;
		void loadCandidateWorlds(addSearchParam, currentRequest);
	});

	async function loadFeatured(cursor: string | null, currentRequest = ++listRequestId) {
		loading = true;
		error = '';
		try {
			const response = await listAdminFeaturedWorlds({ cursor });
			if (currentRequest !== listRequestId) return;
			featuredWorlds = response.items;
			nextCursor = response.next_cursor;
		} catch (caught) {
			if (currentRequest !== listRequestId) return;
			error = caught instanceof Error ? caught.message : 'Failed to load featured worlds';
		} finally {
			if (currentRequest === listRequestId) loading = false;
		}
	}

	async function loadCandidateWorlds(search: string, currentRequest = ++searchRequestId) {
		if (!search) {
			candidateWorlds = [];
			searchError = '';
			return;
		}

		searching = true;
		searchError = '';
		try {
			const response = await listAdminWorlds({ search, limit: 8 });
			if (currentRequest !== searchRequestId) return;
			candidateWorlds = response.items;
		} catch (caught) {
			if (currentRequest !== searchRequestId) return;
			searchError = caught instanceof Error ? caught.message : 'Failed to search worlds';
		} finally {
			if (currentRequest === searchRequestId) searching = false;
		}
	}

	function refreshFeatured() {
		void loadFeatured(cursorParam);
		if (addSearchParam) void loadCandidateWorlds(addSearchParam);
	}

	function applyAddSearch() {
		goto(routeWithQuery(page.url, { search: addSearch, cursor: null }));
	}

	function goToFirstPage() {
		goto(routeWithQuery(page.url, { cursor: null }), { replaceState: false });
	}

	function goToNextPage() {
		if (!nextCursor) return;
		goto(routeWithQuery(page.url, { cursor: nextCursor }), { replaceState: false });
	}

	async function promoteWorld(worldId: string) {
		if (isMutating) return;
		if (!worldId.trim()) return;
		actionPending = `promote:${worldId}`;
		try {
			await promoteAdminWorld(worldId.trim());
			showSuccess('World featured');
			await loadFeatured(cursorParam);
			if (addSearchParam) await loadCandidateWorlds(addSearchParam);
		} catch (caught) {
			showError('Failed to feature world', caught instanceof Error ? caught.message : undefined);
		} finally {
			actionPending = '';
		}
	}

	async function removeFeatured(worldId: string) {
		if (isMutating) return;
		actionPending = `remove:${worldId}`;
		try {
			await removeAdminWorldFromFeatured(worldId);
			showSuccess('World removed from featured');
			await loadFeatured(cursorParam);
			if (addSearchParam) await loadCandidateWorlds(addSearchParam);
		} catch (caught) {
			showError(
				'Failed to update featured world',
				caught instanceof Error ? caught.message : undefined
			);
		} finally {
			actionPending = '';
		}
	}

	async function moveFeatured(index: number, direction: -1 | 1) {
		if (isMutating) return;
		const targetIndex = index + direction;
		const current = featuredWorlds[index];
		const target = featuredWorlds[targetIndex];
		if (!current || !target || current.featured_order == null || target.featured_order == null) {
			return;
		}

		const items: AdminFeaturedOrderItem[] = [
			{ world_id: current.id, featured_order: target.featured_order },
			{ world_id: target.id, featured_order: current.featured_order }
		];
		actionPending = `move:${current.id}`;
		try {
			await updateAdminFeaturedOrder(items);
			await loadFeatured(cursorParam);
		} catch (caught) {
			showError(
				'Failed to reorder featured worlds',
				caught instanceof Error ? caught.message : undefined
			);
		} finally {
			actionPending = '';
		}
	}
</script>

<section class="space-y-6">
	<div class="flex items-center justify-between gap-4">
		<div>
			<h2 class="text-xl font-semibold text-foreground">Featured</h2>
			<p class="mt-1 text-sm text-muted-foreground">Manage the public discovery queue.</p>
		</div>
		<Button variant="outline" size="sm" disabled={loading} onclick={refreshFeatured}>
			<RefreshCw class="h-4 w-4" />
			Refresh
		</Button>
	</div>

	<div class="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
		<Card class="min-w-0">
			<CardHeader>
				<CardTitle>Featured Queue</CardTitle>
			</CardHeader>
			<CardContent>
				{#if error}
					<div
						class="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
					>
						{error}
					</div>
				{:else if loading && featuredWorlds.length === 0}
					<div class="flex h-52 items-center justify-center">
						<Spinner class="h-6 w-6" />
					</div>
				{:else}
					<div class="space-y-3">
						{#each featuredWorlds as world, index (world.id)}
							<div
								class="flex flex-col gap-3 rounded-md border border-border p-3 md:flex-row md:items-center md:justify-between"
							>
								<div class="min-w-0">
									<div class="flex items-center gap-2">
										<Badge class="border-amber-500/30 bg-amber-500/10 text-amber-300">
											#{world.featured_order ?? index + 1}
										</Badge>
										<p class="truncate text-sm font-medium text-foreground">
											{world.title || 'Untitled world'}
										</p>
									</div>
									<p class="mt-1 font-mono text-xs text-muted-foreground">
										{shortId(world.id)} · {world.visibility} · {formatDateTime(world.updated_at)}
										<CopyButton
											value={world.id}
											label="Copy world ID"
											successLabel="World ID copied"
											class="ml-1 h-6 w-6 text-muted-foreground"
										/>
									</p>
								</div>
								<div class="flex shrink-0 flex-wrap gap-2">
									<Button
										variant="outline"
										size="sm"
										disabled={isMutating || index === 0}
										onclick={() => moveFeatured(index, -1)}
										aria-label="Move featured world up"
									>
										<ArrowUp class="h-4 w-4" />
									</Button>
									<Button
										variant="outline"
										size="sm"
										disabled={isMutating || index === featuredWorlds.length - 1}
										onclick={() => moveFeatured(index, 1)}
										aria-label="Move featured world down"
									>
										<ArrowDown class="h-4 w-4" />
									</Button>
									<Button href={`/admin/worlds/${world.id}`} variant="outline" size="sm">
										Open
									</Button>
									<Button
										variant="destructive"
										size="sm"
										disabled={isMutating}
										onclick={() => removeFeatured(world.id)}
									>
										Remove
									</Button>
								</div>
							</div>
						{/each}
						{#if featuredWorlds.length === 0}
							<p class="text-sm text-muted-foreground">No featured worlds yet.</p>
						{/if}
					</div>

					<div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<p class="text-sm text-muted-foreground">
							Showing {featuredWorlds.length} featured world{featuredWorlds.length === 1 ? '' : 's'} on
							this page.
						</p>
						<div class="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={!cursorParam || loading}
								onclick={goToFirstPage}
							>
								First Page
							</Button>
							<Button
								variant="outline"
								size="sm"
								disabled={!nextCursor || loading}
								onclick={goToNextPage}
							>
								{#if loading}
									<Spinner class="h-4 w-4" />
								{/if}
								Next Page
							</Button>
						</div>
					</div>
				{/if}
			</CardContent>
		</Card>

		<Card class="min-w-0 self-start">
			<CardHeader>
				<CardTitle>Feature a World</CardTitle>
			</CardHeader>
			<CardContent class="space-y-5">
				<form
					class="space-y-3"
					onsubmit={(event) => {
						event.preventDefault();
						applyAddSearch();
					}}
				>
					<div class="space-y-2">
						<label for="feature-world-search" class="text-sm font-medium text-foreground">
							Search title, ID, author, or genre
						</label>
						<Input
							id="feature-world-search"
							bind:value={addSearch}
							placeholder="world title or uuid"
							class="min-w-0"
						/>
					</div>
					<div class="flex gap-2">
						<Button type="submit" class="flex-1" disabled={searching}>
							<Search class="h-4 w-4" />
							Search
						</Button>
						{#if addSearchParam}
							<Button
								type="button"
								variant="outline"
								disabled={searching}
								onclick={() => {
									addSearch = '';
									goto(routeWithQuery(page.url, { search: null }));
								}}
							>
								Clear
							</Button>
						{/if}
					</div>
				</form>

				{#if searchError}
					<div
						class="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
					>
						{searchError}
					</div>
				{:else if searching}
					<div class="flex h-24 items-center justify-center">
						<Spinner class="h-5 w-5" />
					</div>
				{:else if addSearchParam}
					<div class="space-y-3">
						{#each candidateWorlds as world (world.id)}
							<div class="rounded-md border border-border p-3">
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<p class="truncate text-sm font-medium text-foreground">
											{world.title || 'Untitled world'}
										</p>
										<p class="mt-1 flex items-center gap-1 font-mono text-xs text-muted-foreground">
											{shortId(world.id)}
											<CopyButton
												value={world.id}
												label="Copy world ID"
												successLabel="World ID copied"
												class="h-6 w-6 text-muted-foreground"
											/>
										</p>
									</div>
									<Badge class={visibilityClass(world.visibility)}>
										{world.visibility || 'unknown'}
									</Badge>
								</div>
								<div class="mt-3 flex gap-2">
									<Button href={`/admin/worlds/${world.id}`} variant="outline" size="sm">
										Open
									</Button>
									<Button
										size="sm"
										disabled={isMutating || world.featured_order != null}
										onclick={() => promoteWorld(world.id)}
									>
										<Crown class="h-4 w-4" />
										{world.featured_order == null ? 'Feature' : 'Featured'}
									</Button>
								</div>
							</div>
						{/each}
						{#if candidateWorlds.length === 0}
							<p class="text-sm text-muted-foreground">No worlds match this search.</p>
						{/if}
					</div>
				{:else}
					<p class="text-sm text-muted-foreground">
						Search for a world before adding it to the discovery queue.
					</p>
				{/if}

				<div class="rounded-md border border-border p-4">
					<div class="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
						<WalletCards class="h-4 w-4 text-primary" />
						Moderation Notes
					</div>
					<ul class="space-y-2 text-sm text-muted-foreground">
						<li>Featured order changes write directly to the public discovery queue.</li>
						<li>Private and unlisted worlds can appear here until removed.</li>
						<li>Deleting a featured world also removes sessions, nodes, media, and vectors.</li>
					</ul>
				</div>
			</CardContent>
		</Card>
	</div>
</section>
