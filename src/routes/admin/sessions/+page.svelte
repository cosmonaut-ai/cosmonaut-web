<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		getAdminSession,
		listAdminUserSessions,
		listAdminWorldSessions,
		type AdminSession
	} from '$lib/api/admin';
	import { formatDateTime, formatNumber, shortId } from '$lib/admin/format';
	import { queryValue, routeWithQuery } from '$lib/admin/url';
	import type { WorldSessionSummary } from '$lib/types/api';
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
	import { Input } from '$lib/components/ui/input';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Spinner } from '$lib/components/ui/spinner';
	import {
		Activity,
		ArrowRight,
		Clock3,
		Globe2,
		ListMusic,
		RefreshCw,
		Search,
		User,
		Users
	} from '@lucide/svelte';

	type LookupMode = 'session' | 'user' | 'world';

	const lookupModes = [
		{ value: 'session' as const, label: 'Session', icon: Activity },
		{ value: 'user' as const, label: 'User', icon: User },
		{ value: 'world' as const, label: 'World', icon: Globe2 }
	];

	let selectedMode = $state<LookupMode>('session');
	let queryInput = $state('');
	let currentMode = $state<LookupMode>('session');
	let currentQuery = $state('');
	let sessionResult = $state<AdminSession | null>(null);
	let userSessions = $state<WorldSessionSummary[]>([]);
	let worldSessions = $state<AdminSession[]>([]);
	let userCursor = $state<string | null>(null);
	let worldCursor = $state<string | null>(null);
	let loading = $state(false);
	let loadingMore = $state(false);
	let error = $state('');
	let requestId = 0;

	const hasQuery = $derived(currentQuery.trim().length > 0);
	const resultCount = $derived.by(() => {
		if (!hasQuery) return 0;
		if (currentMode === 'session') return sessionResult ? 1 : 0;
		if (currentMode === 'user') return userSessions.length;
		return worldSessions.length;
	});
	const hasMore = $derived(
		(currentMode === 'user' && !!userCursor) || (currentMode === 'world' && !!worldCursor)
	);
	const inputPlaceholder = $derived.by(() => {
		if (selectedMode === 'user') return 'User ID';
		if (selectedMode === 'world') return 'World ID';
		return 'Session ID';
	});
	const uniqueUserWorldCount = $derived(
		new Set(userSessions.map((session) => session.root_world_id)).size
	);
	const loadedMemberCount = $derived(
		worldSessions.reduce((total, session) => total + session.members.length, 0)
	);
	const loadedVisitedNodes = $derived.by(() => {
		if (currentMode === 'user') {
			return userSessions.reduce((total, session) => total + session.visited_node_count, 0);
		}
		if (currentMode === 'world') {
			return worldSessions.reduce((total, session) => total + session.visited_node_count, 0);
		}
		return sessionResult?.visited_node_count ?? 0;
	});

	afterNavigate(() => {
		syncLookupFromUrl();
	});

	async function loadLookup(
		mode: LookupMode,
		query: string,
		currentRequest = ++requestId,
		clear = true
	) {
		const cleaned = query.trim();
		if (!cleaned) return;
		if (clear) clearResultsOnly();
		loading = true;
		error = '';
		try {
			if (mode === 'session') {
				const freshSession = await getAdminSession(cleaned);
				if (currentRequest !== requestId) return;
				sessionResult = freshSession;
			} else if (mode === 'user') {
				const response = await listAdminUserSessions(cleaned);
				if (currentRequest !== requestId) return;
				userSessions = response.items;
				userCursor = response.next_cursor;
			} else {
				const response = await listAdminWorldSessions(cleaned);
				if (currentRequest !== requestId) return;
				worldSessions = response.items;
				worldCursor = response.next_cursor;
			}
		} catch (caught) {
			if (currentRequest !== requestId) return;
			error = caught instanceof Error ? caught.message : 'Failed to load sessions';
		} finally {
			if (currentRequest === requestId) loading = false;
		}
	}

	function submitLookup() {
		const cleaned = queryInput.trim();
		currentMode = selectedMode;
		currentQuery = cleaned;
		goto(routeWithQuery(page.url, { mode: selectedMode, q: cleaned || null }), {
			replaceState: false
		});
		if (cleaned) {
			void loadLookup(selectedMode, cleaned);
		} else {
			clearAll();
		}
	}

	function clearLookup() {
		selectedMode = 'session';
		currentMode = 'session';
		queryInput = '';
		currentQuery = '';
		clearAll();
		goto(routeWithQuery(page.url, { mode: null, q: null }), { replaceState: false });
	}

	async function loadMore() {
		if (loadingMore || !hasMore || !currentQuery) return;
		loadingMore = true;
		try {
			if (currentMode === 'user' && userCursor) {
				const response = await listAdminUserSessions(currentQuery, { cursor: userCursor });
				userSessions = [...userSessions, ...response.items];
				userCursor = response.next_cursor;
			}
			if (currentMode === 'world' && worldCursor) {
				const response = await listAdminWorldSessions(currentQuery, { cursor: worldCursor });
				worldSessions = [...worldSessions, ...response.items];
				worldCursor = response.next_cursor;
			}
		} catch (caught) {
			error = caught instanceof Error ? caught.message : 'Failed to load more sessions';
		} finally {
			loadingMore = false;
		}
	}

	function syncLookupFromUrl() {
		const nextMode = normalizeMode(queryValue(page.url, 'mode'));
		const nextQuery = queryValue(page.url, 'q');
		if (nextMode === currentMode && nextQuery === currentQuery) return;

		selectedMode = nextMode;
		queryInput = nextQuery;
		currentMode = nextMode;
		currentQuery = nextQuery;

		if (!nextQuery) {
			clearAll();
			return;
		}

		void loadLookup(nextMode, nextQuery, ++requestId, true);
	}

	function clearResultsOnly() {
		sessionResult = null;
		userSessions = [];
		worldSessions = [];
		userCursor = null;
		worldCursor = null;
	}

	function clearAll() {
		++requestId;
		clearResultsOnly();
		error = '';
		loading = false;
		loadingMore = false;
	}

	function normalizeMode(value: string): LookupMode {
		if (value === 'user' || value === 'world') return value;
		return 'session';
	}

	function sessionActivity(session: AdminSession): string | null {
		const memberDates = session.member_details
			.map((member) => member.last_accessed_at)
			.filter((value): value is string => !!value)
			.sort();
		return memberDates.at(-1) ?? session.updated_at ?? session.created_at;
	}

	function summaryActivity(session: WorldSessionSummary): string | null {
		return (
			session.last_accessed_at ?? session.updated_at ?? session.created_at ?? session.joined_at
		);
	}

	function sessionWorldTitle(session: AdminSession): string {
		return session.world?.title || session.root_world_id;
	}

	function summaryWorldTitle(session: WorldSessionSummary): string {
		return session.world?.title || session.root_world_id;
	}
</script>

<section class="space-y-6">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
		<div class="min-w-0">
			<div class="flex flex-wrap items-center gap-2">
				<Badge variant="outline">
					<Activity class="mr-1 h-3.5 w-3.5" />
					Sessions
				</Badge>
				{#if loading && hasQuery}
					<Badge variant="outline">
						<Spinner class="mr-1 h-3.5 w-3.5" />
						Loading
					</Badge>
				{/if}
			</div>
			<h2 class="mt-3 text-xl font-semibold text-foreground">Session Explorer</h2>
			<p class="mt-1 max-w-3xl text-sm text-muted-foreground">
				Playthrough lookup across session, user, and world indexes.
			</p>
		</div>
		<div class="flex flex-wrap gap-2 lg:justify-end">
			<Button href="/admin/worlds" variant="outline" size="sm">Worlds</Button>
			<Button href="/admin/users" variant="outline" size="sm">Users</Button>
		</div>
	</div>

	<Card class="min-w-0">
		<CardContent class="p-4 sm:p-5">
			<form
				class="grid min-w-0 gap-3 lg:grid-cols-[auto_minmax(16rem,1fr)_auto]"
				onsubmit={(event) => {
					event.preventDefault();
					submitLookup();
				}}
			>
				<div
					class="grid grid-cols-3 gap-1 rounded-lg border border-border bg-muted/45 p-1"
					aria-label="Lookup mode"
				>
					{#each lookupModes as mode (mode.value)}
						{@const ModeIcon = mode.icon}
						<button
							type="button"
							class={`inline-flex h-9 min-w-0 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors ${
								selectedMode === mode.value
									? 'bg-background text-foreground shadow-xs'
									: 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
							}`}
							aria-pressed={selectedMode === mode.value}
							onclick={() => {
								selectedMode = mode.value;
							}}
						>
							<ModeIcon class="h-4 w-4 shrink-0" />
							<span class="truncate">{mode.label}</span>
						</button>
					{/each}
				</div>

				<Input
					bind:value={queryInput}
					placeholder={inputPlaceholder}
					aria-label={inputPlaceholder}
					class="min-w-0"
				/>

				<div class="flex gap-2">
					<Button type="submit" disabled={loading || !queryInput.trim()}>
						<Search class="h-4 w-4" />
						Lookup
					</Button>
					{#if hasQuery || queryInput}
						<Button type="button" variant="outline" disabled={loading} onclick={clearLookup}>
							Clear
						</Button>
					{/if}
				</div>
			</form>
		</CardContent>
	</Card>

	{#if hasQuery}
		<div class="grid gap-3 sm:grid-cols-3">
			<div class="rounded-lg border border-border bg-card p-4">
				<div class="flex items-center justify-between gap-3">
					<span class="text-xs font-medium text-muted-foreground uppercase">Loaded</span>
					<Activity class="h-4 w-4 text-muted-foreground" />
				</div>
				<p class="mt-2 text-2xl font-semibold text-foreground">{formatNumber(resultCount)}</p>
			</div>
			<div class="rounded-lg border border-border bg-card p-4">
				<div class="flex items-center justify-between gap-3">
					<span class="text-xs font-medium text-muted-foreground uppercase">
						{currentMode === 'world' ? 'Members' : 'Worlds'}
					</span>
					{#if currentMode === 'world'}
						<Users class="h-4 w-4 text-muted-foreground" />
					{:else}
						<Globe2 class="h-4 w-4 text-muted-foreground" />
					{/if}
				</div>
				<p class="mt-2 text-2xl font-semibold text-foreground">
					{#if currentMode === 'session'}
						{formatNumber(sessionResult?.members.length)}
					{:else if currentMode === 'user'}
						{formatNumber(uniqueUserWorldCount)}
					{:else}
						{formatNumber(loadedMemberCount)}
					{/if}
				</p>
			</div>
			<div class="rounded-lg border border-border bg-card p-4">
				<div class="flex items-center justify-between gap-3">
					<span class="text-xs font-medium text-muted-foreground uppercase">Visited Nodes</span>
					<Clock3 class="h-4 w-4 text-muted-foreground" />
				</div>
				<p class="mt-2 text-2xl font-semibold text-foreground">
					{formatNumber(loadedVisitedNodes)}
				</p>
			</div>
		</div>
	{/if}

	{#if loading}
		<div class="grid gap-4">
			{#each { length: 3 }, index (index)}
				<Skeleton class="h-32 w-full" />
			{/each}
		</div>
	{:else if error}
		<Card class="border-destructive/30 bg-destructive/10">
			<CardHeader>
				<CardTitle class="text-destructive">Sessions unavailable</CardTitle>
				<CardDescription class="text-destructive/80">{error}</CardDescription>
			</CardHeader>
			<CardContent>
				<Button
					variant="outline"
					size="sm"
					disabled={!currentQuery}
					onclick={() => loadLookup(currentMode, currentQuery, ++requestId, true)}
				>
					<RefreshCw class="h-4 w-4" />
					Try Again
				</Button>
			</CardContent>
		</Card>
	{:else if currentMode === 'session' && sessionResult}
		<Card class="min-w-0">
			<CardHeader>
				<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
					<div class="min-w-0">
						<CardTitle class="flex items-center gap-2">
							<Activity class="h-5 w-5 text-muted-foreground" />
							{shortId(sessionResult.id)}
						</CardTitle>
						<CardDescription>
							Updated {formatDateTime(sessionResult.updated_at)} / {formatNumber(
								sessionResult.members.length
							)}
							members
						</CardDescription>
					</div>
					<Button href={`/admin/sessions/${sessionResult.id}`} size="sm">
						Open Detail
						<ArrowRight class="h-4 w-4" />
					</Button>
				</div>
			</CardHeader>
			<CardContent class="space-y-4">
				<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
					<div class="rounded-md border border-border p-3">
						<p class="text-xs text-muted-foreground">World</p>
						<a
							href={`/admin/worlds/${sessionResult.root_world_id}`}
							class="mt-1 block truncate text-sm font-medium text-primary hover:underline"
						>
							{sessionWorldTitle(sessionResult)}
						</a>
					</div>
					<div class="rounded-md border border-border p-3">
						<p class="text-xs text-muted-foreground">Creator</p>
						{#if sessionResult.created_by}
							<a
								href={`/admin/users/${sessionResult.created_by}`}
								class="mt-1 block font-mono text-xs text-primary hover:underline"
							>
								{shortId(sessionResult.created_by)}
							</a>
						{:else}
							<p class="mt-1 text-sm font-medium text-foreground">N/A</p>
						{/if}
					</div>
					<div class="rounded-md border border-border p-3">
						<p class="text-xs text-muted-foreground">Playlist</p>
						{#if sessionResult.soundtrack_playlist_id}
							<a
								href={`/admin/playlists/${sessionResult.soundtrack_playlist_id}`}
								class="mt-1 block font-mono text-xs text-primary hover:underline"
							>
								{shortId(sessionResult.soundtrack_playlist_id)}
							</a>
						{:else}
							<p class="mt-1 text-sm font-medium text-foreground">N/A</p>
						{/if}
					</div>
					<div class="rounded-md border border-border p-3">
						<p class="text-xs text-muted-foreground">Last Activity</p>
						<p class="mt-1 text-sm font-medium text-foreground">
							{formatDateTime(sessionActivity(sessionResult))}
						</p>
					</div>
				</div>

				<div class="divide-y divide-border rounded-lg border border-border">
					{#each sessionResult.member_details as member (member.user_id)}
						<div class="grid gap-3 p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
							<div class="min-w-0">
								<a
									href={`/admin/users/${member.user_id}`}
									class="font-mono text-sm text-primary hover:underline"
								>
									{shortId(member.user_id)}
								</a>
								<p class="mt-1 text-xs text-muted-foreground">
									{member.role || 'member'} / Last accessed {formatDateTime(
										member.last_accessed_at
									)}
								</p>
							</div>
							<div class="flex flex-wrap items-center gap-2 md:justify-end">
								<Badge variant="outline">{formatNumber(member.visited_node_count)} nodes</Badge>
								{#if member.last_visited_node_id}
									<span class="flex items-center gap-1 font-mono text-xs text-muted-foreground">
										{shortId(member.last_visited_node_id)}
										<CopyButton
											value={member.last_visited_node_id}
											label="Copy node ID"
											successLabel="Node ID copied"
											class="h-6 w-6 text-muted-foreground"
										/>
									</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</CardContent>
		</Card>
	{:else if currentMode === 'user' && hasQuery}
		<Card class="min-w-0">
			<CardHeader>
				<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<CardTitle>User Sessions</CardTitle>
						<CardDescription
							>{formatNumber(userSessions.length)} loaded playthroughs</CardDescription
						>
					</div>
					<Button href={`/admin/users/${currentQuery}`} variant="outline" size="sm"
						>Open User</Button
					>
				</div>
			</CardHeader>
			<CardContent>
				<div class="divide-y divide-border">
					{#each userSessions as session (session.id)}
						<article class="grid gap-3 py-4 first:pt-0 last:pb-0 lg:grid-cols-[minmax(0,1fr)_auto]">
							<div class="min-w-0">
								<a
									href={`/admin/sessions/${session.id}`}
									class="font-medium text-foreground hover:text-primary hover:underline"
								>
									{summaryWorldTitle(session)}
								</a>
								<div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
									<span class="flex items-center gap-1 font-mono">
										{shortId(session.id)}
										<CopyButton
											value={session.id}
											label="Copy session ID"
											successLabel="Session ID copied"
											class="h-6 w-6 text-muted-foreground"
										/>
									</span>
									<span>{session.role}</span>
									<span>Last activity {formatDateTime(summaryActivity(session))}</span>
								</div>
								<p class="mt-2 line-clamp-2 text-sm text-muted-foreground">
									{session.world?.description || 'No world description'}
								</p>
							</div>
							<div class="flex flex-wrap gap-2 lg:justify-end">
								<Badge variant="outline">{formatNumber(session.visited_node_count)} nodes</Badge>
								<Button href={`/admin/worlds/${session.root_world_id}`} variant="outline" size="sm">
									World
								</Button>
								<Button href={`/admin/sessions/${session.id}`} size="sm">
									Open
									<ArrowRight class="h-4 w-4" />
								</Button>
							</div>
						</article>
					{:else}
						<p class="text-sm text-muted-foreground">No sessions found for this user.</p>
					{/each}
				</div>
			</CardContent>
		</Card>
	{:else if currentMode === 'world' && hasQuery}
		<Card class="min-w-0">
			<CardHeader>
				<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<CardTitle>World Sessions</CardTitle>
						<CardDescription
							>{formatNumber(worldSessions.length)} loaded playthroughs</CardDescription
						>
					</div>
					<Button href={`/admin/worlds/${currentQuery}`} variant="outline" size="sm"
						>Open World</Button
					>
				</div>
			</CardHeader>
			<CardContent>
				<div class="divide-y divide-border">
					{#each worldSessions as session (session.id)}
						<article class="grid gap-3 py-4 first:pt-0 last:pb-0 lg:grid-cols-[minmax(0,1fr)_auto]">
							<div class="min-w-0">
								<a
									href={`/admin/sessions/${session.id}`}
									class="font-medium text-foreground hover:text-primary hover:underline"
								>
									{shortId(session.id)}
								</a>
								<div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
									<span>{formatNumber(session.members.length)} members</span>
									<span>Created {formatDateTime(session.created_at)}</span>
									<span>Updated {formatDateTime(session.updated_at)}</span>
								</div>
								<div class="mt-2 flex flex-wrap items-center gap-2">
									{#each session.member_details.slice(0, 4) as member (member.user_id)}
										<a
											href={`/admin/users/${member.user_id}`}
											class="rounded-md border border-border bg-muted/40 px-2 py-1 font-mono text-xs text-muted-foreground hover:text-primary"
										>
											{shortId(member.user_id)}
										</a>
									{/each}
									{#if session.member_details.length > 4}
										<Badge variant="outline">+{session.member_details.length - 4}</Badge>
									{/if}
								</div>
							</div>
							<div class="flex flex-wrap gap-2 lg:justify-end">
								<Badge variant="outline">{formatNumber(session.visited_node_count)} nodes</Badge>
								{#if session.soundtrack_playlist_id}
									<Button
										href={`/admin/playlists/${session.soundtrack_playlist_id}`}
										variant="outline"
										size="sm"
									>
										<ListMusic class="h-4 w-4" />
										Playlist
									</Button>
								{/if}
								<Button href={`/admin/sessions/${session.id}`} size="sm">
									Open
									<ArrowRight class="h-4 w-4" />
								</Button>
							</div>
						</article>
					{:else}
						<p class="text-sm text-muted-foreground">No sessions found for this world.</p>
					{/each}
				</div>
			</CardContent>
		</Card>
	{:else}
		<Card class="min-w-0">
			<CardHeader>
				<CardTitle>No Session Selected</CardTitle>
				<CardDescription>Choose a lookup mode and enter an exact ID.</CardDescription>
			</CardHeader>
		</Card>
	{/if}

	{#if hasMore && !loading}
		<div class="flex justify-end">
			<Button variant="outline" size="sm" disabled={loadingMore} onclick={loadMore}>
				{#if loadingMore}
					<Spinner class="h-4 w-4" />
				{/if}
				Load More
			</Button>
		</div>
	{/if}
</section>
