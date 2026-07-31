<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { getAdminSession, listAdminSessionNodes, type AdminSession } from '$lib/api/admin';
	import { formatDateTime, formatNumber, shortId } from '$lib/admin/format';
	import type { StoryNode } from '$lib/types/api';
	import { showError } from '$lib/utils/toast';
	import CopyButton from '$lib/components/admin/CopyButton.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Spinner } from '$lib/components/ui/spinner';
	import {
		Activity,
		ArrowRight,
		ChevronLeft,
		Clock3,
		ExternalLink,
		Globe2,
		ListMusic,
		RefreshCw,
		User,
		Users
	} from '@lucide/svelte';

	const sessionId = $derived(page.params.sessionId ?? '');

	let session = $state<AdminSession | null>(null);
	let currentSessionId = $state('');
	let nodes = $state<StoryNode[]>([]);
	let nodesCursor = $state<string | null>(null);
	let nodesLoading = $state(false);
	let loading = $state(false);
	let error = $state('');
	let requestId = 0;

	const memberCount = $derived(session?.members.length ?? 0);
	const nodeOverlayCount = $derived(nodes.length);
	const worldTitle = $derived(session?.world?.title || session?.root_world_id || 'Unknown world');
	const storyUrl = $derived(session ? `/worlds/${session.root_world_id}` : '');
	const lastActivity = $derived.by(() => {
		if (!session) return null;
		const memberDates = session.member_details
			.map((member) => member.last_accessed_at)
			.filter((value): value is string => !!value)
			.sort();
		return memberDates.at(-1) ?? session.updated_at ?? session.created_at;
	});

	afterNavigate(() => {
		syncSessionFromRoute();
	});

	async function loadSession(
		targetSessionId = sessionId,
		currentRequest = ++requestId,
		clear = false
	) {
		if (!targetSessionId) return;
		if (clear) {
			session = null;
			nodes = [];
			nodesCursor = null;
		}
		loading = true;
		error = '';
		try {
			const [freshSession, nodeResponse] = await Promise.all([
				getAdminSession(targetSessionId),
				listAdminSessionNodes(targetSessionId)
			]);
			if (currentRequest !== requestId) return;
			session = freshSession;
			nodes = nodeResponse.items;
			nodesCursor = nodeResponse.next_cursor;
		} catch (caught) {
			if (currentRequest !== requestId) return;
			error = caught instanceof Error ? caught.message : 'Failed to load session details';
		} finally {
			if (currentRequest === requestId) loading = false;
		}
	}

	async function loadMoreNodes() {
		if (!sessionId || !nodesCursor || nodesLoading) return;
		const targetSessionId = sessionId;
		nodesLoading = true;
		try {
			const response = await listAdminSessionNodes(targetSessionId, { cursor: nodesCursor });
			if (targetSessionId !== sessionId) return;
			nodes = [...nodes, ...response.items];
			nodesCursor = response.next_cursor;
		} catch (caught) {
			showError(
				'Failed to load more session nodes',
				caught instanceof Error ? caught.message : undefined
			);
		} finally {
			nodesLoading = false;
		}
	}

	function refreshSession() {
		void loadSession(sessionId, ++requestId, false);
	}

	function syncSessionFromRoute() {
		const nextSessionId = sessionId;
		if (nextSessionId === currentSessionId) return;

		currentSessionId = nextSessionId;
		if (!nextSessionId) {
			clearResult();
			return;
		}

		void loadSession(nextSessionId, ++requestId, true);
	}

	function clearResult() {
		++requestId;
		session = null;
		nodes = [];
		nodesCursor = null;
		error = '';
		loading = false;
		nodesLoading = false;
	}
</script>

<section class="space-y-6">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
		<div class="min-w-0">
			<Button href="/admin/sessions" variant="ghost" size="sm" class="mb-2 px-0">
				<ChevronLeft class="h-4 w-4" />
				Sessions
			</Button>
			<div class="flex flex-wrap items-center gap-2">
				<Badge variant="outline">
					<Activity class="mr-1 h-3.5 w-3.5" />
					Playthrough
				</Badge>
				{#if loading && session}
					<Badge variant="outline">
						<Spinner class="mr-1 h-3.5 w-3.5" />
						Refreshing
					</Badge>
				{/if}
			</div>
			<h2 class="mt-3 text-xl font-semibold text-foreground">Session Detail</h2>
			<p
				class="mt-1 flex min-w-0 items-center gap-1 font-mono text-sm break-all text-muted-foreground"
			>
				{sessionId}
				<CopyButton
					value={sessionId}
					label="Copy session ID"
					successLabel="Session ID copied"
					class="h-7 w-7 shrink-0 text-muted-foreground"
				/>
			</p>
		</div>
		<div class="flex flex-wrap gap-2 lg:justify-end">
			{#if session}
				<Button
					href={`/admin/sessions?mode=world&q=${encodeURIComponent(session.root_world_id)}`}
					variant="outline"
					size="sm"
				>
					World Sessions
				</Button>
			{/if}
			<Button variant="outline" size="sm" disabled={loading} onclick={refreshSession}>
				{#if loading}
					<Spinner class="h-4 w-4" />
				{:else}
					<RefreshCw class="h-4 w-4" />
				{/if}
				Refresh
			</Button>
		</div>
	</div>

	{#if error && !session}
		<Card class="border-destructive/30 bg-destructive/10">
			<CardHeader>
				<CardTitle class="text-destructive">Session unavailable</CardTitle>
				<CardDescription class="text-destructive/80">{error}</CardDescription>
			</CardHeader>
			<CardContent>
				<Button variant="outline" size="sm" disabled={loading} onclick={refreshSession}>
					<RefreshCw class="h-4 w-4" />
					Try Again
				</Button>
			</CardContent>
		</Card>
	{:else if loading && !session}
		<div class="grid gap-3 md:grid-cols-4">
			{#each { length: 4 }, index (index)}
				<Skeleton class="h-24 w-full" />
			{/each}
		</div>
		<Skeleton class="h-96 w-full" />
	{:else if session}
		<div class="grid gap-3 md:grid-cols-4">
			<div class="rounded-lg border border-border bg-card p-4">
				<div class="flex items-center justify-between gap-3">
					<span class="text-xs font-medium text-muted-foreground uppercase">Members</span>
					<Users class="h-4 w-4 text-muted-foreground" />
				</div>
				<p class="mt-2 text-2xl font-semibold text-foreground">{formatNumber(memberCount)}</p>
			</div>
			<div class="rounded-lg border border-border bg-card p-4">
				<div class="flex items-center justify-between gap-3">
					<span class="text-xs font-medium text-muted-foreground uppercase">Visited Nodes</span>
					<Activity class="h-4 w-4 text-muted-foreground" />
				</div>
				<p class="mt-2 text-2xl font-semibold text-foreground">
					{formatNumber(session.visited_node_count)}
				</p>
			</div>
			<div class="rounded-lg border border-border bg-card p-4">
				<div class="flex items-center justify-between gap-3">
					<span class="text-xs font-medium text-muted-foreground uppercase">Node Overlays</span>
					<Globe2 class="h-4 w-4 text-muted-foreground" />
				</div>
				<p class="mt-2 text-2xl font-semibold text-foreground">{formatNumber(nodeOverlayCount)}</p>
			</div>
			<div class="rounded-lg border border-border bg-card p-4">
				<div class="flex items-center justify-between gap-3">
					<span class="text-xs font-medium text-muted-foreground uppercase">Last Activity</span>
					<Clock3 class="h-4 w-4 text-muted-foreground" />
				</div>
				<p class="mt-2 truncate text-2xl font-semibold text-foreground">
					{formatDateTime(lastActivity)}
				</p>
			</div>
		</div>

		<div class="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
			<div class="min-w-0 space-y-6">
				<Card class="min-w-0">
					<CardHeader>
						<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
							<div class="min-w-0">
								<CardTitle class="flex items-center gap-2">
									<Globe2 class="h-5 w-5 text-muted-foreground" />
									{worldTitle}
								</CardTitle>
								<CardDescription>
									Created {formatDateTime(session.created_at)} / Updated {formatDateTime(
										session.updated_at
									)}
								</CardDescription>
							</div>
							<Button href={`/admin/worlds/${session.root_world_id}`} variant="outline" size="sm">
								Open World
							</Button>
						</div>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
							<div class="rounded-md border border-border p-3">
								<p class="text-xs text-muted-foreground">World ID</p>
								<div class="mt-1 flex items-center gap-1">
									<a
										href={`/admin/worlds/${session.root_world_id}`}
										class="min-w-0 truncate font-mono text-xs text-primary hover:underline"
									>
										{shortId(session.root_world_id)}
									</a>
									<CopyButton
										value={session.root_world_id}
										label="Copy world ID"
										successLabel="World ID copied"
										class="h-6 w-6 text-muted-foreground"
									/>
								</div>
							</div>
							<div class="rounded-md border border-border p-3">
								<p class="text-xs text-muted-foreground">Creator</p>
								{#if session.created_by}
									<div class="mt-1 flex items-center gap-1">
										<a
											href={`/admin/users/${session.created_by}`}
											class="min-w-0 truncate font-mono text-xs text-primary hover:underline"
										>
											{shortId(session.created_by)}
										</a>
										<CopyButton
											value={session.created_by}
											label="Copy creator ID"
											successLabel="Creator ID copied"
											class="h-6 w-6 text-muted-foreground"
										/>
									</div>
								{:else}
									<p class="mt-1 text-sm font-medium text-foreground">N/A</p>
								{/if}
							</div>
							<div class="rounded-md border border-border p-3">
								<p class="text-xs text-muted-foreground">Playlist</p>
								{#if session.soundtrack_playlist_id}
									<div class="mt-1 flex items-center gap-1">
										<a
											href={`/admin/playlists/${session.soundtrack_playlist_id}`}
											class="min-w-0 truncate font-mono text-xs text-primary hover:underline"
										>
											{shortId(session.soundtrack_playlist_id)}
										</a>
										<CopyButton
											value={session.soundtrack_playlist_id}
											label="Copy playlist ID"
											successLabel="Playlist ID copied"
											class="h-6 w-6 text-muted-foreground"
										/>
									</div>
								{:else}
									<p class="mt-1 text-sm font-medium text-foreground">N/A</p>
								{/if}
							</div>
							<div class="rounded-md border border-border p-3">
								<p class="text-xs text-muted-foreground">Session ID</p>
								<div class="mt-1 flex items-center gap-1">
									<p class="min-w-0 truncate font-mono text-xs text-foreground">
										{shortId(session.id)}
									</p>
									<CopyButton
										value={session.id}
										label="Copy session ID"
										successLabel="Session ID copied"
										class="h-6 w-6 text-muted-foreground"
									/>
								</div>
							</div>
						</div>

						{#if session.world?.description}
							<p
								class="rounded-md border border-border p-3 text-sm leading-6 text-muted-foreground"
							>
								{session.world.description}
							</p>
						{/if}
					</CardContent>
				</Card>

				<Card class="min-w-0">
					<CardHeader>
						<CardTitle>Member Progress</CardTitle>
						<CardDescription>{formatNumber(memberCount)} session members</CardDescription>
					</CardHeader>
					<CardContent>
						<div class="divide-y divide-border">
							{#each session.member_details as member (member.user_id)}
								<article
									class="grid gap-3 py-4 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
								>
									<div class="min-w-0">
										<div class="flex flex-wrap items-center gap-2">
											<a
												href={`/admin/users/${member.user_id}`}
												class="font-mono text-sm font-medium text-primary hover:underline"
											>
												{shortId(member.user_id)}
											</a>
											<Badge variant="outline">{member.role || 'member'}</Badge>
											<CopyButton
												value={member.user_id}
												label="Copy user ID"
												successLabel="User ID copied"
												class="h-6 w-6 text-muted-foreground"
											/>
										</div>
										<p class="mt-1 text-xs text-muted-foreground">
											Joined {formatDateTime(member.joined_at)} / Last accessed {formatDateTime(
												member.last_accessed_at
											)}
										</p>
									</div>
									<div class="flex flex-wrap gap-2 md:justify-end">
										<Badge variant="outline">{formatNumber(member.visited_node_count)} nodes</Badge>
										{#if member.last_visited_node_id}
											<Button
												href={`/admin/worlds/${session.root_world_id}#node-${member.last_visited_node_id}`}
												variant="outline"
												size="sm"
											>
												Last Node
											</Button>
										{/if}
										<Button href={`/admin/users/${member.user_id}`} size="sm">
											User
											<ArrowRight class="h-4 w-4" />
										</Button>
									</div>
								</article>
							{/each}
						</div>
					</CardContent>
				</Card>

				<Card class="min-w-0">
					<CardHeader>
						<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
							<div>
								<CardTitle>Node Overlays</CardTitle>
								<CardDescription
									>{formatNumber(nodes.length)} loaded for this session</CardDescription
								>
							</div>
							{#if nodesCursor}
								<Button variant="outline" size="sm" disabled={nodesLoading} onclick={loadMoreNodes}>
									{#if nodesLoading}
										<Spinner class="h-4 w-4" />
									{/if}
									Load More
								</Button>
							{/if}
						</div>
					</CardHeader>
					<CardContent>
						<div class="space-y-3">
							{#each nodes as node (node.id)}
								<article class="rounded-md border border-border p-3">
									<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
										<div class="min-w-0">
											<a
												href={`/admin/worlds/${session.root_world_id}#node-${node.id}`}
												class="font-medium text-foreground hover:text-primary hover:underline"
											>
												{node.title || node.id}
											</a>
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
										<div class="flex flex-wrap gap-2 sm:justify-end">
											<Badge variant="outline">{node.generation_status}</Badge>
											<Badge variant="outline">{node.processing_status}</Badge>
										</div>
									</div>
									<div class="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
										<span>Choices: {formatNumber(node.choices?.length ?? 0)}</span>
										<span>Parent: {shortId(node.parent_id)}</span>
										{#if node.choices?.some((choice) => choice.is_custom)}
											<span>Custom choices present</span>
										{/if}
									</div>
								</article>
							{:else}
								<p class="text-sm text-muted-foreground">
									No node overlays found for this session.
								</p>
							{/each}
						</div>
					</CardContent>
				</Card>
			</div>

			<div class="min-w-0 space-y-6">
				<Card class="min-w-0 self-start">
					<CardHeader>
						<CardTitle>Actions</CardTitle>
						<CardDescription>Session pivots</CardDescription>
					</CardHeader>
					<CardContent class="grid gap-2">
						<Button href={`/admin/worlds/${session.root_world_id}`} variant="outline">
							<Globe2 class="h-4 w-4" />
							Open World
						</Button>
						<Button href={storyUrl} variant="outline">
							<ExternalLink class="h-4 w-4" />
							Open Story
						</Button>
						{#if session.created_by}
							<Button href={`/admin/users/${session.created_by}`} variant="outline">
								<User class="h-4 w-4" />
								Open Creator
							</Button>
						{/if}
						{#if session.soundtrack_playlist_id}
							<Button href={`/admin/playlists/${session.soundtrack_playlist_id}`} variant="outline">
								<ListMusic class="h-4 w-4" />
								Open Playlist
							</Button>
						{/if}
						<Button
							href={`/admin/sessions?mode=session&q=${encodeURIComponent(session.id)}`}
							variant="outline"
						>
							<Activity class="h-4 w-4" />
							Lookup Session
						</Button>
					</CardContent>
				</Card>

				<Card class="min-w-0">
					<CardHeader>
						<CardTitle>Progress Map</CardTitle>
						<CardDescription>Current node by member</CardDescription>
					</CardHeader>
					<CardContent>
						<div class="space-y-2">
							{#each Object.entries(session.per_member_progress) as [userId, nodeId] (userId)}
								<div class="rounded-md border border-border p-3 text-sm">
									<a
										href={`/admin/users/${userId}`}
										class="font-mono text-xs text-primary hover:underline"
									>
										{shortId(userId)}
									</a>
									<div class="mt-1 flex items-center gap-1">
										<a
											href={`/admin/worlds/${session.root_world_id}#node-${nodeId}`}
											class="min-w-0 truncate font-mono text-xs text-muted-foreground hover:text-primary"
										>
											{shortId(nodeId)}
										</a>
										<CopyButton
											value={nodeId}
											label="Copy node ID"
											successLabel="Node ID copied"
											class="h-6 w-6 text-muted-foreground"
										/>
									</div>
								</div>
							{:else}
								<p class="text-sm text-muted-foreground">No per-member progress recorded.</p>
							{/each}
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	{/if}
</section>
