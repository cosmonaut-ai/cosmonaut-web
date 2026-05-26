<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		deleteAdminWorld,
		listAdminWorlds,
		promoteAdminWorld,
		removeAdminWorldFromFeatured
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
	import { RefreshCw, Search, Trash2 } from '@lucide/svelte';

	const searchParam = $derived(queryValue(page.url, 'search'));
	const cursorParam = $derived(page.url.searchParams.get('cursor'));

	let worldSearch = $state('');
	let worlds = $state<World[]>([]);
	let nextCursor = $state<string | null>(null);
	let worldsLoading = $state(false);
	let worldsError = $state('');
	let actionPending = $state('');
	let requestId = 0;

	const isMutating = $derived(actionPending !== '');

	$effect(() => {
		const currentRequest = ++requestId;
		worldSearch = searchParam;
		void loadWorlds(searchParam, cursorParam, currentRequest);
	});

	async function loadWorlds(search: string, cursor: string | null, currentRequest = ++requestId) {
		worldsLoading = true;
		worldsError = '';
		try {
			const response = await listAdminWorlds({
				search: search || undefined,
				cursor
			});
			if (currentRequest !== requestId) return;
			worlds = response.items;
			nextCursor = response.next_cursor;
		} catch (error) {
			if (currentRequest !== requestId) return;
			worldsError = error instanceof Error ? error.message : 'Failed to load worlds';
		} finally {
			if (currentRequest === requestId) worldsLoading = false;
		}
	}

	function applySearch() {
		goto(routeWithQuery(page.url, { search: worldSearch, cursor: null }));
	}

	function refreshWorlds() {
		void loadWorlds(searchParam, cursorParam);
	}

	function goToFirstPage() {
		goto(routeWithQuery(page.url, { cursor: null }), { replaceState: false });
	}

	function goToNextPage() {
		if (!nextCursor) return;
		goto(routeWithQuery(page.url, { cursor: nextCursor }), { replaceState: false });
	}

	async function featureWorld(worldId: string) {
		if (isMutating) return;
		actionPending = `feature:${worldId}`;
		try {
			await promoteAdminWorld(worldId);
			showSuccess('World featured');
			await loadWorlds(searchParam, cursorParam);
		} catch (error) {
			showError('Failed to feature world', error instanceof Error ? error.message : undefined);
		} finally {
			actionPending = '';
		}
	}

	async function unfeatureWorld(worldId: string) {
		if (isMutating) return;
		actionPending = `unfeature:${worldId}`;
		try {
			await removeAdminWorldFromFeatured(worldId);
			showSuccess('World removed from featured');
			await loadWorlds(searchParam, cursorParam);
		} catch (error) {
			showError(
				'Failed to update featured world',
				error instanceof Error ? error.message : undefined
			);
		} finally {
			actionPending = '';
		}
	}

	async function deleteWorld(world: World) {
		if (isMutating) return;
		const confirmation = window.prompt(
			`Permanently delete "${world.title || world.id}"? Type DELETE to confirm.`
		);
		if (confirmation !== 'DELETE') return;
		actionPending = `delete:${world.id}`;
		try {
			await deleteAdminWorld(world.id);
			showSuccess('World deleted');
			await loadWorlds(searchParam, cursorParam);
		} catch (error) {
			showError('Failed to delete world', error instanceof Error ? error.message : undefined);
		} finally {
			actionPending = '';
		}
	}
</script>

<section class="space-y-6">
	<div class="flex items-center justify-between gap-4">
		<div>
			<h2 class="text-xl font-semibold text-foreground">Worlds</h2>
			<p class="mt-1 text-sm text-muted-foreground">Inspect and moderate every world.</p>
		</div>
		<Button variant="outline" size="sm" disabled={worldsLoading} onclick={refreshWorlds}>
			<RefreshCw class="h-4 w-4" />
			Refresh
		</Button>
	</div>

	<Card class="min-w-0">
		<CardHeader>
			<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<CardTitle>All Worlds</CardTitle>
				<form
					class="flex w-full min-w-0 flex-col gap-2 sm:flex-row md:max-w-lg"
					onsubmit={(event) => {
						event.preventDefault();
						applySearch();
					}}
				>
					<Input
						bind:value={worldSearch}
						placeholder="Search title, world ID, author ID, or genre"
						aria-label="Search worlds"
						class="min-w-0"
					/>
					<Button type="submit" disabled={worldsLoading}>
						<Search class="h-4 w-4" />
						Search
					</Button>
					{#if searchParam}
						<Button
							type="button"
							variant="outline"
							disabled={worldsLoading}
							onclick={() => {
								worldSearch = '';
								goto(routeWithQuery(page.url, { search: null, cursor: null }));
							}}
						>
							Clear
						</Button>
					{/if}
				</form>
			</div>
		</CardHeader>
		<CardContent>
			{#if worldsError}
				<div
					class="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
				>
					{worldsError}
				</div>
			{:else if worldsLoading && worlds.length === 0}
				<div class="flex h-52 items-center justify-center">
					<Spinner class="h-6 w-6" />
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full min-w-[900px] text-left text-sm">
						<thead class="border-b border-border text-xs text-muted-foreground uppercase">
							<tr>
								<th class="py-3 pr-4 font-medium">World</th>
								<th class="px-4 py-3 font-medium">Author</th>
								<th class="px-4 py-3 font-medium">Visibility</th>
								<th class="px-4 py-3 font-medium">Status</th>
								<th class="px-4 py-3 font-medium">Updated</th>
								<th class="py-3 pl-4 text-right font-medium">Actions</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each worlds as world (world.id)}
								<tr class="hover:bg-muted/30">
									<td class="py-3 pr-4">
										<div class="flex max-w-[20rem] items-center gap-1">
											<a
												href={`/admin/worlds/${world.id}`}
												class="min-w-0 truncate font-medium text-foreground hover:text-primary hover:underline"
											>
												{world.title || 'Untitled world'}
											</a>
										</div>
										<div
											class="mt-1 flex items-center gap-1 font-mono text-xs text-muted-foreground"
										>
											{shortId(world.id)}
											<CopyButton
												value={world.id}
												label="Copy world ID"
												successLabel="World ID copied"
												class="h-6 w-6 text-muted-foreground"
											/>
										</div>
									</td>
									<td class="px-4 py-3">
										{#if world.author_id}
											<div class="flex items-center gap-1">
												<a
													href={`/admin/users/${world.author_id}`}
													class="font-mono text-xs text-primary hover:underline"
												>
													{shortId(world.author_id)}
												</a>
												<CopyButton
													value={world.author_id}
													label="Copy author ID"
													successLabel="Author ID copied"
													class="h-6 w-6 text-muted-foreground"
												/>
											</div>
										{:else}
											<span class="text-muted-foreground">N/A</span>
										{/if}
									</td>
									<td class="px-4 py-3">
										<Badge class={visibilityClass(world.visibility)}
											>{world.visibility || 'unknown'}</Badge
										>
									</td>
									<td class="px-4 py-3 text-muted-foreground">{world.generation_status}</td>
									<td class="px-4 py-3 text-muted-foreground">{formatDateTime(world.updated_at)}</td
									>
									<td class="py-3 pl-4">
										<div class="flex justify-end gap-2">
											<Button href={`/admin/worlds/${world.id}`} variant="outline" size="sm">
												Open
											</Button>
											{#if world.featured_order == null}
												<Button
													size="sm"
													disabled={isMutating}
													onclick={() => featureWorld(world.id)}
												>
													Feature
												</Button>
											{:else}
												<Button
													variant="outline"
													size="sm"
													disabled={isMutating}
													onclick={() => unfeatureWorld(world.id)}
												>
													Unfeature
												</Button>
											{/if}
											<Button
												variant="destructive"
												size="sm"
												disabled={isMutating}
												onclick={() => deleteWorld(world)}
												aria-label={`Delete ${world.title || world.id}`}
											>
												<Trash2 class="h-4 w-4" />
											</Button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				{#if worlds.length === 0}
					<p class="mt-4 text-sm text-muted-foreground">No worlds match the current filters.</p>
				{/if}

				<div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<p class="text-sm text-muted-foreground">
						Showing {worlds.length} world{worlds.length === 1 ? '' : 's'} on this page.
					</p>
					<div class="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={!cursorParam || worldsLoading}
							onclick={goToFirstPage}
						>
							First Page
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={!nextCursor || worldsLoading}
							onclick={goToNextPage}
						>
							{#if worldsLoading}
								<Spinner class="h-4 w-4" />
							{/if}
							Next Page
						</Button>
					</div>
				</div>
			{/if}
		</CardContent>
	</Card>
</section>
