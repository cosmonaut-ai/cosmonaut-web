<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		deleteAdminWorld,
		getAdminWorld,
		listAdminWorldNodes,
		promoteAdminWorld,
		removeAdminWorldFromFeatured
	} from '$lib/api/admin';
	import type { StoryNode, World } from '$lib/types/api';
	import {
		formatDateTime,
		formatFileSize,
		formatNumber,
		shortId,
		visibilityClass
	} from '$lib/admin/format';
	import { showError, showSuccess } from '$lib/utils/toast';
	import CopyButton from '$lib/components/admin/CopyButton.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Spinner } from '$lib/components/ui/spinner';
	import { ChevronLeft, Crown, ExternalLink, Trash2 } from '@lucide/svelte';

	const worldId = $derived(page.params.worldId ?? '');

	let world = $state<World | null>(null);
	let nodes = $state<StoryNode[]>([]);
	let nodesCursor = $state<string | null>(null);
	let nodesLoading = $state(false);
	let loading = $state(false);
	let error = $state('');
	let actionPending = $state('');
	let requestId = 0;

	const nodeCount = $derived(nodes.length);
	const isMutating = $derived(actionPending !== '');
	const storyUrl = $derived(world ? `/worlds/${world.id}` : '');
	const imageDimensions = $derived(
		world?.world_image_width && world?.world_image_height
			? `${world.world_image_width} x ${world.world_image_height}`
			: 'N/A'
	);

	$effect(() => {
		if (!worldId) return;
		const currentRequest = ++requestId;
		void loadWorld(worldId, currentRequest, true);
	});

	async function loadWorld(targetWorldId = worldId, currentRequest = ++requestId, clear = false) {
		if (!targetWorldId) return;
		if (clear) {
			world = null;
			nodes = [];
			nodesCursor = null;
		}
		loading = true;
		error = '';
		try {
			const [freshWorld, nodeResponse] = await Promise.all([
				getAdminWorld(targetWorldId),
				listAdminWorldNodes(targetWorldId)
			]);
			if (currentRequest !== requestId) return;
			world = freshWorld;
			nodes = nodeResponse.items;
			nodesCursor = nodeResponse.next_cursor;
		} catch (caught) {
			if (currentRequest !== requestId) return;
			error = caught instanceof Error ? caught.message : 'Failed to load world details';
		} finally {
			if (currentRequest === requestId) loading = false;
		}
	}

	function refreshWorld() {
		void loadWorld(worldId, ++requestId, false);
	}

	async function loadMoreNodes() {
		if (!worldId || !nodesCursor || nodesLoading) return;
		const targetWorldId = worldId;
		nodesLoading = true;
		try {
			const response = await listAdminWorldNodes(targetWorldId, { cursor: nodesCursor });
			if (targetWorldId !== worldId) return;
			nodes = [...nodes, ...response.items];
			nodesCursor = response.next_cursor;
		} catch (caught) {
			showError('Failed to load more nodes', caught instanceof Error ? caught.message : undefined);
		} finally {
			nodesLoading = false;
		}
	}

	async function featureWorld() {
		if (!world || isMutating) return;
		actionPending = 'feature';
		try {
			await promoteAdminWorld(world.id);
			showSuccess('World featured');
			await loadWorld(world.id, ++requestId, false);
		} catch (caught) {
			showError('Failed to feature world', caught instanceof Error ? caught.message : undefined);
		} finally {
			actionPending = '';
		}
	}

	async function unfeatureWorld() {
		if (!world || isMutating) return;
		actionPending = 'unfeature';
		try {
			await removeAdminWorldFromFeatured(world.id);
			showSuccess('World removed from featured');
			await loadWorld(world.id, ++requestId, false);
		} catch (caught) {
			showError(
				'Failed to update featured world',
				caught instanceof Error ? caught.message : undefined
			);
		} finally {
			actionPending = '';
		}
	}

	async function deleteWorld() {
		if (!world || isMutating) return;
		const confirmation = window.prompt(
			`Permanently delete "${world.title || world.id}"? Type DELETE to confirm.`
		);
		if (confirmation !== 'DELETE') return;
		actionPending = 'delete';
		try {
			await deleteAdminWorld(world.id);
			showSuccess('World deleted');
			await goto('/admin/worlds');
		} catch (caught) {
			showError('Failed to delete world', caught instanceof Error ? caught.message : undefined);
		} finally {
			actionPending = '';
		}
	}
</script>

<section class="space-y-6">
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<Button href="/admin/worlds" variant="ghost" size="sm" class="mb-2 px-0">
				<ChevronLeft class="h-4 w-4" />
				Worlds
			</Button>
			<h2 class="text-xl font-semibold text-foreground">World Detail</h2>
			<p class="mt-1 flex items-center gap-1 font-mono text-sm break-all text-muted-foreground">
				{worldId}
				<CopyButton
					value={worldId}
					label="Copy world ID"
					successLabel="World ID copied"
					class="h-7 w-7 text-muted-foreground"
				/>
			</p>
		</div>
		<Button variant="outline" size="sm" disabled={loading} onclick={refreshWorld}>Refresh</Button>
	</div>

	{#if error}
		<div
			class="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
		>
			{error}
		</div>
	{:else if loading && !world}
		<div class="flex h-52 items-center justify-center">
			<Spinner class="h-6 w-6" />
		</div>
	{:else if world}
		<div class="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
			<div class="min-w-0 space-y-6">
				<Card class="min-w-0">
					<CardHeader>
						<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
							<div class="min-w-0">
								<div class="flex items-start gap-1">
									<CardTitle>{world.title || 'Untitled world'}</CardTitle>
									<CopyButton
										value={world.title || world.id}
										label={world.title ? 'Copy world title' : 'Copy world ID'}
										successLabel={world.title ? 'World title copied' : 'World ID copied'}
										class="h-7 w-7 text-muted-foreground"
									/>
								</div>
								<p
									class="mt-1 flex items-center gap-1 font-mono text-xs break-all text-muted-foreground"
								>
									{world.id}
									<CopyButton
										value={world.id}
										label="Copy world ID"
										successLabel="World ID copied"
										class="h-6 w-6 text-muted-foreground"
									/>
								</p>
							</div>
							<div class="flex flex-wrap gap-2">
								<Badge class={visibilityClass(world.visibility)}
									>{world.visibility || 'unknown'}</Badge
								>
								{#if world.featured_order != null}
									<Badge class="border-amber-500/30 bg-amber-500/10 text-amber-300">
										Featured #{world.featured_order}
									</Badge>
								{/if}
							</div>
						</div>
					</CardHeader>
					<CardContent class="space-y-5">
						{#if world.world_image_url}
							<div class="overflow-hidden rounded-md border border-border bg-muted">
								<img
									src={world.world_image_url}
									alt={world.world_image_alt_text || world.title || 'World cover image'}
									class="h-56 w-full object-cover"
								/>
							</div>
						{/if}

						<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
							<div class="rounded-md border border-border p-3">
								<p class="text-xs text-muted-foreground">Loaded Nodes</p>
								<p class="mt-1 font-medium text-foreground">{formatNumber(nodeCount)}</p>
							</div>
							<div class="rounded-md border border-border p-3">
								<p class="text-xs text-muted-foreground">Status</p>
								<p class="mt-1 font-medium text-foreground">{world.generation_status}</p>
							</div>
							<div class="rounded-md border border-border p-3">
								<p class="text-xs text-muted-foreground">Updated</p>
								<p class="mt-1 font-medium text-foreground">{formatDateTime(world.updated_at)}</p>
							</div>
							<div class="rounded-md border border-border p-3">
								<p class="text-xs text-muted-foreground">Author</p>
								{#if world.author_id}
									<div class="mt-1 flex items-center gap-1">
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
									<p class="mt-1 font-medium text-foreground">N/A</p>
								{/if}
							</div>
							<div class="rounded-md border border-border p-3">
								<p class="text-xs text-muted-foreground">Created</p>
								<p class="mt-1 font-medium text-foreground">{formatDateTime(world.created_at)}</p>
							</div>
							<div class="rounded-md border border-border p-3">
								<p class="text-xs text-muted-foreground">Root Node</p>
								<p class="mt-1 flex items-center gap-1 font-mono text-xs break-all text-foreground">
									{shortId(world.root_node_id)}
									<CopyButton
										value={world.root_node_id}
										label="Copy root node ID"
										successLabel="Root node ID copied"
										class="h-6 w-6 text-muted-foreground"
									/>
								</p>
							</div>
							<div class="rounded-md border border-border p-3">
								<p class="text-xs text-muted-foreground">Length</p>
								<p class="mt-1 font-medium text-foreground">{world.world_length || 'N/A'}</p>
							</div>
							<div class="rounded-md border border-border p-3">
								<p class="text-xs text-muted-foreground">Vocab</p>
								<p class="mt-1 font-medium text-foreground">{world.vocab_level || 'N/A'}</p>
							</div>
							<div class="rounded-md border border-border p-3">
								<p class="text-xs text-muted-foreground">Content Filter</p>
								<p class="mt-1 font-medium text-foreground">{world.content_filter || 'N/A'}</p>
							</div>
							<div class="rounded-md border border-border p-3">
								<p class="text-xs text-muted-foreground">Image</p>
								<p class="mt-1 font-medium text-foreground">
									{world.image_generation_status || 'N/A'}
								</p>
							</div>
						</div>

						<div class="space-y-2">
							<p class="text-sm font-medium text-foreground">Prompt</p>
							<p
								class="max-h-40 overflow-y-auto rounded-md border border-border p-3 text-sm text-muted-foreground"
							>
								{world.world_prompt || 'N/A'}
							</p>
						</div>

						<div class="grid gap-4 lg:grid-cols-2">
							<div class="space-y-2">
								<p class="text-sm font-medium text-foreground">Story Configuration</p>
								<div class="space-y-2 rounded-md border border-border p-3 text-sm">
									<div class="flex justify-between gap-3">
										<span class="text-muted-foreground">Genre</span>
										<span class="font-medium text-foreground">{world.genre || 'N/A'}</span>
									</div>
									<div class="flex justify-between gap-3">
										<span class="text-muted-foreground">Score</span>
										<span class="font-medium text-foreground">{world.score || 'N/A'}</span>
									</div>
									<div class="flex justify-between gap-3">
										<span class="text-muted-foreground">Max branch depth</span>
										<span class="font-medium text-foreground">
											{world.story_max_nodes ?? 'N/A'}
										</span>
									</div>
									<div class="flex justify-between gap-3">
										<span class="text-muted-foreground">Words per node</span>
										<span class="font-medium text-foreground">
											{world.node_text_length ?? 'N/A'}
										</span>
									</div>
									<div class="flex justify-between gap-3">
										<span class="text-muted-foreground">Max choices</span>
										<span class="font-medium text-foreground">{world.max_choices ?? 'N/A'}</span>
									</div>
								</div>
							</div>

							<div class="space-y-2">
								<p class="text-sm font-medium text-foreground">Media</p>
								<div class="space-y-2 rounded-md border border-border p-3 text-sm">
									<div class="flex justify-between gap-3">
										<span class="text-muted-foreground">Dimensions</span>
										<span class="font-medium text-foreground">{imageDimensions}</span>
									</div>
									<div class="flex justify-between gap-3">
										<span class="text-muted-foreground">Size</span>
										<span class="font-medium text-foreground">
											{formatFileSize(world.world_image_size)}
										</span>
									</div>
									<div class="flex justify-between gap-3">
										<span class="text-muted-foreground">Alt text</span>
										<span class="max-w-[12rem] truncate font-medium text-foreground">
											{world.world_image_alt_text || 'N/A'}
										</span>
									</div>
									{#if world.world_image_url}
										<Button href={world.world_image_url} variant="outline" size="sm" class="w-full">
											<ExternalLink class="h-4 w-4" />
											Open Cover Image
										</Button>
									{/if}
								</div>
							</div>
						</div>

						<div class="grid gap-4 lg:grid-cols-2">
							<div class="space-y-2">
								<p class="text-sm font-medium text-foreground">Setting</p>
								<p
									class="max-h-40 overflow-y-auto rounded-md border border-border p-3 text-sm text-muted-foreground"
								>
									{world.setting || 'N/A'}
								</p>
							</div>
							<div class="space-y-2">
								<p class="text-sm font-medium text-foreground">Narrator Profile</p>
								<p
									class="max-h-40 overflow-y-auto rounded-md border border-border p-3 text-sm text-muted-foreground"
								>
									{world.narrator_profile || 'N/A'}
								</p>
							</div>
						</div>

						<div class="space-y-2">
							<p class="text-sm font-medium text-foreground">Narrative Context</p>
							<p
								class="max-h-44 overflow-y-auto rounded-md border border-border p-3 text-sm text-muted-foreground"
							>
								{world.narrative_context || 'N/A'}
							</p>
						</div>

						<div class="grid gap-4 lg:grid-cols-3">
							<div class="space-y-2">
								<p class="text-sm font-medium text-foreground">Characters</p>
								<div
									class="max-h-48 overflow-y-auto rounded-md border border-border p-3 text-sm text-muted-foreground"
								>
									{#if world.characters?.length}
										<ul class="space-y-2">
											{#each world.characters as character, index (`${character.name ?? 'character'}-${index}`)}
												<li>
													<span class="font-medium text-foreground"
														>{character.name || 'Unnamed'}</span
													>
													{#if character.description}
														<span> - {character.description}</span>
													{/if}
												</li>
											{/each}
										</ul>
									{:else}
										N/A
									{/if}
								</div>
							</div>
							<div class="space-y-2">
								<p class="text-sm font-medium text-foreground">Locations</p>
								<div
									class="max-h-48 overflow-y-auto rounded-md border border-border p-3 text-sm text-muted-foreground"
								>
									{#if world.locations?.length}
										<ul class="space-y-2">
											{#each world.locations as location, index (`${location.name ?? 'location'}-${index}`)}
												<li>
													<span class="font-medium text-foreground"
														>{location.name || 'Unnamed'}</span
													>
													{#if location.description}
														<span> - {location.description}</span>
													{/if}
												</li>
											{/each}
										</ul>
									{:else}
										N/A
									{/if}
								</div>
							</div>
							<div class="space-y-2">
								<p class="text-sm font-medium text-foreground">Potential Endings</p>
								<div
									class="max-h-48 overflow-y-auto rounded-md border border-border p-3 text-sm text-muted-foreground"
								>
									{#if world.potential_endings?.length}
										<ul class="list-disc space-y-1 pl-4">
											{#each world.potential_endings as ending, index (`${ending}-${index}`)}
												<li>{ending}</li>
											{/each}
										</ul>
									{:else}
										N/A
									{/if}
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card class="min-w-0">
					<CardHeader>
						<div class="flex items-center justify-between gap-3">
							<CardTitle>Nodes</CardTitle>
							<span class="text-sm text-muted-foreground">
								Loaded {formatNumber(nodes.length)}
							</span>
						</div>
					</CardHeader>
					<CardContent>
						<div class="space-y-3">
							{#each nodes as node (node.id)}
								<div class="rounded-md border border-border p-3">
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0">
											<p class="truncate text-sm font-medium text-foreground">
												{node.title || node.id}
											</p>
											<p
												class="mt-1 flex items-center gap-1 font-mono text-xs text-muted-foreground"
											>
												{shortId(node.id)}
												<CopyButton
													value={node.id}
													label="Copy node ID"
													successLabel="Node ID copied"
													class="h-6 w-6 text-muted-foreground"
												/>
											</p>
										</div>
										<div class="flex flex-wrap justify-end gap-2">
											<Badge variant="outline">{node.generation_status}</Badge>
											<Badge variant="outline">{node.processing_status}</Badge>
										</div>
									</div>
									<p class="mt-2 line-clamp-2 text-xs text-muted-foreground">
										{node.text || node.story_summary || 'No text yet'}
									</p>
									<div class="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
										<span>Choices: {node.choices?.length ?? 0}</span>
										<span>Parent: {shortId(node.parent_id)}</span>
										<span>Updated: {formatDateTime(node.updated_at)}</span>
									</div>
								</div>
							{/each}
							{#if nodes.length === 0}
								<p class="text-sm text-muted-foreground">No nodes found for this world.</p>
							{/if}
						</div>
						{#if nodesCursor}
							<div class="mt-4 flex justify-end">
								<Button variant="outline" size="sm" disabled={nodesLoading} onclick={loadMoreNodes}>
									{#if nodesLoading}
										<Spinner class="h-4 w-4" />
									{/if}
									Load More Nodes
								</Button>
							</div>
						{/if}
					</CardContent>
				</Card>
			</div>

			<Card class="min-w-0 self-start">
				<CardHeader>
					<CardTitle>Actions</CardTitle>
				</CardHeader>
				<CardContent class="grid gap-2">
					<Button href={storyUrl} variant="outline">
						<ExternalLink class="h-4 w-4" />
						Open Story
					</Button>
					<div class="rounded-md border border-border p-3">
						<p class="text-xs text-muted-foreground">Shareable URL</p>
						<div class="mt-1 flex items-center gap-1">
							<p class="min-w-0 truncate font-mono text-xs text-foreground">{storyUrl}</p>
							<CopyButton
								value={storyUrl}
								label="Copy story path"
								successLabel="Story path copied"
								class="h-6 w-6 text-muted-foreground"
							/>
						</div>
					</div>
					{#if world.featured_order == null}
						<Button disabled={isMutating} onclick={featureWorld}>
							<Crown class="h-4 w-4" />
							Feature World
						</Button>
					{:else}
						<Button variant="outline" disabled={isMutating} onclick={unfeatureWorld}>
							Remove From Featured
						</Button>
					{/if}
					<Button variant="destructive" disabled={isMutating} onclick={deleteWorld}>
						<Trash2 class="h-4 w-4" />
						Delete World
					</Button>
					{#if world.visibility !== 'public' || world.generation_status !== 'completed'}
						<div
							class="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200"
						>
							{#if world.visibility !== 'public'}
								<p>This world is {world.visibility || 'not public'} but can still be featured.</p>
							{/if}
							{#if world.generation_status !== 'completed'}
								<p>Generation is {world.generation_status}; review before promoting.</p>
							{/if}
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>
	{/if}
</section>
