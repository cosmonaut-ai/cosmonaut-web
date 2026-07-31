<script lang="ts">
	import { onMount } from 'svelte';
	import {
		listAdminFeaturedWorlds,
		listAdminSoundtracks,
		listAdminUsers,
		listAdminWorlds,
		type AdminCognitoUser,
		type Soundtrack
	} from '$lib/api/admin';
	import type { World } from '$lib/types/api';
	import {
		formatDate,
		formatDateTime,
		formatDuration,
		formatNumber,
		shortId,
		soundtrackStatusClass,
		statusClass,
		tierClass,
		visibilityClass
	} from '$lib/admin/format';
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
		AlertTriangle,
		ArrowRight,
		Ban,
		CheckCircle2,
		Clock3,
		Crown,
		ExternalLink,
		Globe2,
		ListChecks,
		ListMusic,
		Music2,
		RefreshCw,
		ShieldAlert,
		Sparkles,
		Users,
		Wrench,
		XCircle
	} from '@lucide/svelte';

	type DashboardSeverity = 'critical' | 'warning' | 'info' | 'success';

	let users = $state<AdminCognitoUser[]>([]);
	let worlds = $state<World[]>([]);
	let featuredWorlds = $state<World[]>([]);
	let draftSoundtracks = $state<Soundtrack[]>([]);
	let activeSoundtracks = $state<Soundtrack[]>([]);
	let disabledSoundtracks = $state<Soundtrack[]>([]);
	let rejectedSoundtracks = $state<Soundtrack[]>([]);
	let loading = $state(false);
	let error = $state('');
	let lastRefreshedAt = $state<string | null>(null);

	const allSoundtracks = $derived([
		...draftSoundtracks,
		...activeSoundtracks,
		...disabledSoundtracks,
		...rejectedSoundtracks
	]);
	const hasLoadedData = $derived(
		users.length > 0 || worlds.length > 0 || featuredWorlds.length > 0 || allSoundtracks.length > 0
	);
	const initialLoading = $derived(loading && !hasLoadedData);
	const lastRefreshedLabel = $derived(
		lastRefreshedAt ? formatDateTime(lastRefreshedAt) : 'Not loaded yet'
	);

	const disabledUsers = $derived(users.filter((user) => user.enabled === false));
	const unverifiedUsers = $derived(users.filter((user) => user.email_verified === false));
	const usersWithoutEmail = $derived(users.filter((user) => !user.email));
	const premiumUsers = $derived(
		users.filter((user) => user.tier === 'EXPLORER' || user.tier === 'COSMONAUT')
	);

	const failedWorlds = $derived(worlds.filter((world) => world.generation_status === 'failed'));
	const inProgressWorlds = $derived(
		worlds.filter(
			(world) =>
				world.generation_status === 'initialized' ||
				world.generation_status === 'generating_lore' ||
				world.generation_status === 'generating_narrator_profile'
		)
	);
	const completedWorlds = $derived(
		worlds.filter((world) => world.generation_status === 'completed')
	);
	const worldsMissingPlaylist = $derived(
		completedWorlds.filter((world) => !world.default_playlist_id)
	);
	const worldsWithPlaylist = $derived(worlds.filter((world) => !!world.default_playlist_id));
	const worldsWithImageIssues = $derived(
		worlds.filter((world) => world.image_generation_status === 'failed')
	);
	const publicWorlds = $derived(worlds.filter((world) => world.visibility === 'public'));
	const privateWorlds = $derived(worlds.filter((world) => world.visibility === 'private'));
	const unlistedWorlds = $derived(worlds.filter((world) => world.visibility === 'unlisted'));

	const featuredVisibilityIssues = $derived(
		featuredWorlds.filter((world) => world.visibility !== 'public')
	);
	const draftsMissingRequirements = $derived(
		draftSoundtracks.filter((soundtrack) => !soundtrack.audio_url || !soundtrack.description)
	);
	const activeMissingVector = $derived(
		activeSoundtracks.filter((soundtrack) => !soundtrack.pinecone_record_id)
	);

	const attentionItems = $derived.by(() => {
		const items = [];

		for (const world of failedWorlds.slice(0, 3)) {
			items.push({
				id: `failed-world-${world.id}`,
				title: world.title || 'Untitled failed world',
				detail: `World generation failed. Updated ${formatDateTime(world.updated_at)}.`,
				href: `/admin/worlds/${world.id}`,
				label: 'World failure',
				severity: 'critical' as const,
				icon: XCircle
			});
		}

		for (const world of featuredVisibilityIssues.slice(0, 2)) {
			items.push({
				id: `featured-visibility-${world.id}`,
				title: world.title || 'Untitled featured world',
				detail: `Featured shelf item is ${world.visibility || 'unknown'}, not public.`,
				href: '/admin/featured',
				label: 'Featured visibility',
				severity: 'warning' as const,
				icon: Crown
			});
		}

		for (const soundtrack of draftsMissingRequirements.slice(0, 3)) {
			items.push({
				id: `draft-soundtrack-${soundtrack.id}`,
				title: soundtrack.title || 'Untitled soundtrack',
				detail: soundtrackRequirementLabel(soundtrack),
				href: soundtrack.id
					? `/admin/soundtracks/${soundtrack.id}`
					: '/admin/soundtracks?status=draft',
				label: 'Draft soundtrack',
				severity: 'warning' as const,
				icon: Music2
			});
		}

		for (const world of worldsMissingPlaylist.slice(0, 2)) {
			items.push({
				id: `missing-playlist-${world.id}`,
				title: world.title || 'Untitled world',
				detail: 'Completed world has no default playlist attached.',
				href: `/admin/worlds/${world.id}`,
				label: 'No playlist',
				severity: 'info' as const,
				icon: ListChecks
			});
		}

		for (const soundtrack of activeMissingVector.slice(0, 2)) {
			items.push({
				id: `active-vector-${soundtrack.id}`,
				title: soundtrack.title || 'Untitled soundtrack',
				detail: 'Active soundtrack is missing a Pinecone record id.',
				href: soundtrack.id
					? `/admin/soundtracks/${soundtrack.id}`
					: '/admin/soundtracks?status=active',
				label: 'Matching metadata',
				severity: 'info' as const,
				icon: Sparkles
			});
		}

		for (const user of disabledUsers.slice(0, 2)) {
			items.push({
				id: `disabled-user-${user.sub}`,
				title: user.email || user.username || shortId(user.sub),
				detail: `Account is disabled. Created ${formatDate(user.created_at)}.`,
				href: `/admin/users/${user.sub}`,
				label: 'Disabled user',
				severity: 'info' as const,
				icon: Ban
			});
		}

		return items.slice(0, 8);
	});

	const metricCards = $derived.by(() => [
		{
			label: 'Needs attention',
			value: formatNumber(attentionItems.length),
			detail:
				attentionItems.length === 0
					? 'No sampled issues'
					: `${formatNumber(failedWorlds.length)} failed worlds, ${formatNumber(draftsMissingRequirements.length)} draft gaps`,
			href: '#attention-queue',
			tone: 'warning' as const,
			icon: AlertTriangle
		},
		{
			label: 'World sample',
			value: formatNumber(worlds.length),
			detail: `${formatNumber(completedWorlds.length)} completed, ${formatNumber(inProgressWorlds.length)} generating`,
			href: '/admin/worlds',
			tone: 'primary' as const,
			icon: Globe2
		},
		{
			label: 'Soundtrack queue',
			value: formatNumber(draftSoundtracks.length),
			detail: `${formatNumber(activeSoundtracks.length)} active, ${formatNumber(disabledSoundtracks.length + rejectedSoundtracks.length)} inactive`,
			href: '/admin/soundtracks?status=draft',
			tone: 'success' as const,
			icon: Music2
		},
		{
			label: 'User sample',
			value: formatNumber(users.length),
			detail: `${formatNumber(premiumUsers.length)} paid tiers, ${formatNumber(disabledUsers.length)} disabled`,
			href: '/admin/users',
			tone: 'info' as const,
			icon: Users
		}
	]);

	const workspaceCards = $derived.by(() => [
		{
			title: 'Users',
			detail: `${formatNumber(unverifiedUsers.length)} unverified, ${formatNumber(usersWithoutEmail.length)} missing email`,
			href: '/admin/users',
			icon: Users
		},
		{
			title: 'Worlds',
			detail: `${formatNumber(publicWorlds.length)} public, ${formatNumber(unlistedWorlds.length)} unlisted, ${formatNumber(privateWorlds.length)} private`,
			href: '/admin/worlds',
			icon: Globe2
		},
		{
			title: 'Sessions',
			detail: 'Inspect playthroughs by session, user, or world',
			href: '/admin/sessions',
			icon: Activity
		},
		{
			title: 'Soundtracks',
			detail: `${formatNumber(draftSoundtracks.length)} drafts, ${formatNumber(activeMissingVector.length)} matching gaps`,
			href: '/admin/soundtracks?status=draft',
			icon: Music2
		},
		{
			title: 'Playlists',
			detail: `${formatNumber(worldsWithPlaylist.length)} worlds linked, ${formatNumber(worldsMissingPlaylist.length)} missing`,
			href: '/admin/playlists',
			icon: ListMusic
		},
		{
			title: 'Diagnostics',
			detail: 'Test playlist matching and world context retrieval',
			href: '/admin/diagnostics',
			icon: Wrench
		},
		{
			title: 'Featured',
			detail: `${formatNumber(featuredWorlds.length)} live slots, ${formatNumber(featuredVisibilityIssues.length)} visibility issues`,
			href: '/admin/featured',
			icon: Crown
		}
	]);

	onMount(() => {
		void loadDashboard();
	});

	async function loadDashboard() {
		if (loading) return;
		loading = true;
		error = '';
		try {
			const [
				userResponse,
				worldResponse,
				featuredResponse,
				draftResponse,
				activeResponse,
				disabledResponse,
				rejectedResponse
			] = await Promise.all([
				listAdminUsers({ limit: 25 }),
				listAdminWorlds({ limit: 50 }),
				listAdminFeaturedWorlds({ limit: 50 }),
				listAdminSoundtracks({ status: 'draft', limit: 25 }),
				listAdminSoundtracks({ status: 'active', limit: 25 }),
				listAdminSoundtracks({ status: 'disabled', limit: 25 }),
				listAdminSoundtracks({ status: 'rejected', limit: 25 })
			]);
			users = userResponse.items;
			worlds = worldResponse.items;
			featuredWorlds = featuredResponse.items;
			draftSoundtracks = draftResponse.items;
			activeSoundtracks = activeResponse.items;
			disabledSoundtracks = disabledResponse.items;
			rejectedSoundtracks = rejectedResponse.items;
			lastRefreshedAt = new Date().toISOString();
		} catch (caught) {
			error = caught instanceof Error ? caught.message : 'Failed to load admin dashboard';
		} finally {
			loading = false;
		}
	}

	function severityClass(severity: DashboardSeverity): string {
		if (severity === 'critical') return 'border-destructive/30 bg-destructive/10 text-destructive';
		if (severity === 'warning') return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
		if (severity === 'success') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
		return 'border-sky-500/30 bg-sky-500/10 text-sky-300';
	}

	function metricIconClass(tone: 'primary' | 'success' | 'warning' | 'info'): string {
		if (tone === 'warning') return 'bg-amber-500/10 text-amber-300';
		if (tone === 'success') return 'bg-emerald-500/10 text-emerald-300';
		if (tone === 'info') return 'bg-sky-500/10 text-sky-300';
		return 'bg-primary/10 text-primary';
	}

	function soundtrackRequirementLabel(soundtrack: Soundtrack): string {
		if (!soundtrack.audio_url && !soundtrack.description) {
			return 'Draft is missing audio and description.';
		}
		if (!soundtrack.audio_url) return 'Draft is missing audio.';
		if (!soundtrack.description) return 'Draft is missing description.';
		return 'Draft is ready for review.';
	}
</script>

<div class="space-y-6">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
		<div>
			<h2 class="text-xl font-semibold text-foreground">Dashboard</h2>
			<p class="mt-1 max-w-3xl text-sm text-muted-foreground">
				Operational snapshot for support, moderation, curation, and featured story work.
			</p>
			<p class="mt-2 text-xs text-muted-foreground">Last refreshed: {lastRefreshedLabel}</p>
		</div>
		<div class="flex flex-wrap items-center gap-2">
			{#if loading && hasLoadedData}
				<Badge variant="outline" class="gap-1.5">
					<Spinner class="h-3.5 w-3.5" />
					Refreshing
				</Badge>
			{/if}
			<Button variant="outline" size="sm" disabled={loading} onclick={loadDashboard}>
				<RefreshCw class="h-4 w-4" />
				Refresh
			</Button>
		</div>
	</div>

	{#if error}
		<div
			class="flex flex-col gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
			role="alert"
		>
			<div class="flex items-start gap-2">
				<ShieldAlert class="mt-0.5 h-4 w-4 shrink-0" />
				<p>{error}</p>
			</div>
			<Button variant="outline" size="sm" disabled={loading} onclick={loadDashboard}>Retry</Button>
		</div>
	{/if}

	{#if initialLoading}
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Dashboard loading">
			{#each { length: 4 }, index (index)}
				<Card class="min-w-0">
					<CardContent class="space-y-3 p-4">
						<Skeleton class="h-4 w-24" />
						<Skeleton class="h-8 w-16" />
						<Skeleton class="h-3 w-36" />
					</CardContent>
				</Card>
			{/each}
		</div>
		<div class="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]">
			<Card class="min-w-0">
				<CardHeader>
					<Skeleton class="h-5 w-36" />
					<Skeleton class="h-4 w-56" />
				</CardHeader>
				<CardContent class="space-y-3">
					{#each { length: 5 }, index (index)}
						<Skeleton class="h-20 w-full" />
					{/each}
				</CardContent>
			</Card>
			<Card class="min-w-0">
				<CardHeader>
					<Skeleton class="h-5 w-28" />
					<Skeleton class="h-4 w-48" />
				</CardHeader>
				<CardContent class="space-y-3">
					{#each { length: 4 }, index (index)}
						<Skeleton class="h-16 w-full" />
					{/each}
				</CardContent>
			</Card>
		</div>
	{:else}
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
			{#each metricCards as metric (metric.label)}
				{@const MetricIcon = metric.icon}
				<a
					href={metric.href}
					class="block rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
				>
					<Card class="min-w-0 transition-colors hover:bg-muted/35">
						<CardContent class="flex items-start justify-between gap-4 p-4">
							<div class="min-w-0">
								<p class="text-xs font-medium tracking-wide text-muted-foreground uppercase">
									{metric.label}
								</p>
								<p class="mt-1 text-2xl font-semibold text-foreground">{metric.value}</p>
								<p class="mt-1 truncate text-xs text-muted-foreground">{metric.detail}</p>
							</div>
							<span class={`rounded-md p-2 ${metricIconClass(metric.tone)}`}>
								<MetricIcon class="h-5 w-5" />
							</span>
						</CardContent>
					</Card>
				</a>
			{/each}
		</div>

		<div class="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]">
			<Card id="attention-queue" class="min-w-0">
				<CardHeader class="flex-row items-start justify-between gap-4">
					<div>
						<CardTitle class="flex items-center gap-2">
							<ListChecks class="h-5 w-5 text-muted-foreground" />
							Attention Queue
						</CardTitle>
						<CardDescription
							>Issues inferred from the currently loaded admin samples.</CardDescription
						>
					</div>
					<Button href="/admin/worlds" variant="outline" size="sm">Worlds</Button>
				</CardHeader>
				<CardContent>
					<div class="divide-y divide-border">
						{#each attentionItems as item (item.id)}
							{@const ItemIcon = item.icon}
							<a
								href={item.href}
								class="grid gap-3 py-4 first:pt-0 last:pb-0 hover:bg-muted/30 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
							>
								<span class={`rounded-md border p-2 ${severityClass(item.severity)}`}>
									<ItemIcon class="h-4 w-4" />
								</span>
								<span class="min-w-0">
									<span class="flex flex-wrap items-center gap-2">
										<span class="font-medium text-foreground">{item.title}</span>
										<Badge class={severityClass(item.severity)}>{item.label}</Badge>
									</span>
									<span class="mt-1 block text-sm text-muted-foreground">{item.detail}</span>
								</span>
								<span class="flex items-center gap-1 text-sm text-primary">
									Open
									<ArrowRight class="h-4 w-4" />
								</span>
							</a>
						{:else}
							<div
								class="flex items-start gap-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-4"
							>
								<CheckCircle2 class="mt-0.5 h-5 w-5 text-emerald-300" />
								<div>
									<p class="text-sm font-medium text-foreground">No sampled issues need action.</p>
									<p class="mt-1 text-sm text-muted-foreground">
										Recent worlds, featured slots, users, and soundtrack queues look clear.
									</p>
								</div>
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>

			<Card class="min-w-0">
				<CardHeader>
					<CardTitle>Workspaces</CardTitle>
					<CardDescription>Primary admin surfaces and their current sample state.</CardDescription>
				</CardHeader>
				<CardContent class="space-y-3">
					{#each workspaceCards as workspace (workspace.title)}
						{@const WorkspaceIcon = workspace.icon}
						<a
							href={workspace.href}
							class="flex items-center justify-between gap-3 rounded-md border border-border p-3 transition-colors hover:bg-muted/40"
						>
							<span class="flex min-w-0 items-center gap-3">
								<span class="rounded-md bg-muted p-2 text-muted-foreground">
									<WorkspaceIcon class="h-4 w-4" />
								</span>
								<span class="min-w-0">
									<span class="block text-sm font-medium text-foreground">{workspace.title}</span>
									<span class="mt-0.5 block truncate text-xs text-muted-foreground">
										{workspace.detail}
									</span>
								</span>
							</span>
							<ArrowRight class="h-4 w-4 shrink-0 text-muted-foreground" />
						</a>
					{/each}
				</CardContent>
			</Card>
		</div>

		<div class="grid min-w-0 gap-6 xl:grid-cols-2">
			<Card class="min-w-0">
				<CardHeader class="flex-row items-start justify-between gap-4">
					<div>
						<CardTitle>Recent Worlds</CardTitle>
						<CardDescription>Generation state, visibility, and playlist coverage.</CardDescription>
					</div>
					<Button href="/admin/worlds" variant="outline" size="sm">View All</Button>
				</CardHeader>
				<CardContent>
					<div class="divide-y divide-border">
						{#each worlds.slice(0, 6) as world (world.id)}
							<div class="grid gap-3 py-4 first:pt-0 last:pb-0 lg:grid-cols-[minmax(0,1fr)_auto]">
								<div class="min-w-0">
									<a
										href={`/admin/worlds/${world.id}`}
										class="font-medium text-foreground hover:text-primary hover:underline"
									>
										{world.title || 'Untitled world'}
									</a>
									<div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
										<span class="font-mono">{shortId(world.id)}</span>
										<span>{formatDateTime(world.updated_at)}</span>
										{#if world.author_id}
											<a
												href={`/admin/users/${world.author_id}`}
												class="hover:text-primary hover:underline"
											>
												Author {shortId(world.author_id)}
											</a>
										{/if}
									</div>
									<p class="mt-2 line-clamp-2 text-sm text-muted-foreground">
										{world.description || world.soundtrack_description || 'No description'}
									</p>
								</div>
								<div class="flex flex-wrap items-start gap-2 lg:justify-end">
									<Badge class={visibilityClass(world.visibility)}
										>{world.visibility || 'unknown'}</Badge
									>
									<Badge variant="outline">{world.generation_status}</Badge>
									{#if world.default_playlist_id}
										<Button
											href={`/admin/playlists/${world.default_playlist_id}`}
											variant="outline"
											size="sm"
										>
											Playlist
										</Button>
									{:else}
										<Badge class="border-amber-500/30 bg-amber-500/10 text-amber-300"
											>No playlist</Badge
										>
									{/if}
								</div>
							</div>
						{:else}
							<p class="text-sm text-muted-foreground">No worlds loaded.</p>
						{/each}
					</div>
				</CardContent>
			</Card>

			<Card class="min-w-0">
				<CardHeader class="flex-row items-start justify-between gap-4">
					<div>
						<CardTitle>Soundtrack Review</CardTitle>
						<CardDescription>Drafts first, with activation blockers called out.</CardDescription>
					</div>
					<Button href="/admin/soundtracks?status=draft" variant="outline" size="sm">Drafts</Button>
				</CardHeader>
				<CardContent>
					<div class="divide-y divide-border">
						{#each draftSoundtracks.slice(0, 6) as soundtrack (soundtrack.id)}
							<div class="grid gap-3 py-4 first:pt-0 last:pb-0 lg:grid-cols-[minmax(0,1fr)_auto]">
								<div class="min-w-0">
									{#if soundtrack.id}
										<a
											href={`/admin/soundtracks/${soundtrack.id}`}
											class="font-medium text-foreground hover:text-primary hover:underline"
										>
											{soundtrack.title || 'Untitled soundtrack'}
										</a>
									{:else}
										<p class="font-medium text-foreground">
											{soundtrack.title || 'Untitled soundtrack'}
										</p>
									{/if}
									<div class="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
										<span class="font-mono">{shortId(soundtrack.id)}</span>
										<span>{formatDuration(soundtrack.duration_seconds)}</span>
										<span>{formatDateTime(soundtrack.created_at)}</span>
									</div>
									<p class="mt-2 line-clamp-2 text-sm text-muted-foreground">
										{soundtrack.description || 'No description'}
									</p>
								</div>
								<div class="flex flex-wrap items-start gap-2 lg:justify-end">
									<Badge class={soundtrackStatusClass(soundtrack.status)}>{soundtrack.status}</Badge
									>
									<Badge
										class={severityClass(
											soundtrack.audio_url && soundtrack.description ? 'success' : 'warning'
										)}
									>
										{soundtrack.audio_url && soundtrack.description ? 'Ready' : 'Blocked'}
									</Badge>
									{#if soundtrack.id}
										<Button
											href={`/admin/soundtracks/${soundtrack.id}`}
											variant="outline"
											size="sm"
										>
											Open
										</Button>
									{/if}
								</div>
							</div>
						{:else}
							<p class="text-sm text-muted-foreground">No draft soundtracks loaded.</p>
						{/each}
					</div>
				</CardContent>
			</Card>

			<Card class="min-w-0">
				<CardHeader class="flex-row items-start justify-between gap-4">
					<div>
						<CardTitle>Recent Users</CardTitle>
						<CardDescription>Account state, tier, and signup recency.</CardDescription>
					</div>
					<Button href="/admin/users" variant="outline" size="sm">View All</Button>
				</CardHeader>
				<CardContent>
					<div class="divide-y divide-border">
						{#each users.slice(0, 6) as user (user.sub)}
							<a
								href={`/admin/users/${user.sub}`}
								class="grid gap-3 py-4 first:pt-0 last:pb-0 hover:bg-muted/30 sm:grid-cols-[minmax(0,1fr)_auto]"
							>
								<span class="min-w-0">
									<span class="block truncate font-medium text-foreground"
										>{user.email || 'No email'}</span
									>
									<span class="mt-1 block truncate text-xs text-muted-foreground">
										{user.username ? `@${user.username}` : shortId(user.sub)} / {formatDate(
											user.created_at
										)}
									</span>
								</span>
								<span class="flex flex-wrap items-start gap-2 sm:justify-end">
									<Badge class={tierClass(user.tier)}>{user.tier}</Badge>
									<Badge class={statusClass(user.enabled)}
										>{user.enabled === false ? 'disabled' : 'enabled'}</Badge
									>
								</span>
							</a>
						{:else}
							<p class="text-sm text-muted-foreground">No users loaded.</p>
						{/each}
					</div>
				</CardContent>
			</Card>

			<Card class="min-w-0">
				<CardHeader class="flex-row items-start justify-between gap-4">
					<div>
						<CardTitle>Featured Shelf</CardTitle>
						<CardDescription>Ordering and public visibility for featured worlds.</CardDescription>
					</div>
					<Button href="/admin/featured" variant="outline" size="sm">Manage</Button>
				</CardHeader>
				<CardContent>
					<div class="divide-y divide-border">
						{#each featuredWorlds.slice(0, 6) as world (world.id)}
							<div
								class="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
							>
								<Badge variant="outline">#{world.featured_order ?? '-'}</Badge>
								<div class="min-w-0">
									<a
										href={`/admin/worlds/${world.id}`}
										class="font-medium text-foreground hover:text-primary hover:underline"
									>
										{world.title || 'Untitled world'}
									</a>
									<p class="mt-1 truncate text-xs text-muted-foreground">
										{shortId(world.id)} / Updated {formatDateTime(world.updated_at)}
									</p>
								</div>
								<div class="flex flex-wrap items-center gap-2 sm:justify-end">
									<Badge class={visibilityClass(world.visibility)}
										>{world.visibility || 'unknown'}</Badge
									>
									<Button href={`/worlds/${world.id}`} variant="outline" size="sm">
										<ExternalLink class="h-4 w-4" />
										Story
									</Button>
								</div>
							</div>
						{:else}
							<p class="text-sm text-muted-foreground">No featured worlds loaded.</p>
						{/each}
					</div>
				</CardContent>
			</Card>
		</div>

		<div class="grid gap-3 sm:grid-cols-3">
			<div class="rounded-lg border border-border bg-muted/20 p-4">
				<div class="flex items-center gap-2 text-sm font-medium text-foreground">
					<Clock3 class="h-4 w-4 text-muted-foreground" />
					Generation
				</div>
				<p class="mt-2 text-sm text-muted-foreground">
					{formatNumber(inProgressWorlds.length)} worlds are still generating in the loaded sample.
				</p>
			</div>
			<div class="rounded-lg border border-border bg-muted/20 p-4">
				<div class="flex items-center gap-2 text-sm font-medium text-foreground">
					<Sparkles class="h-4 w-4 text-muted-foreground" />
					Matching
				</div>
				<p class="mt-2 text-sm text-muted-foreground">
					{formatNumber(activeMissingVector.length)} active tracks are missing vector metadata.
				</p>
			</div>
			<div class="rounded-lg border border-border bg-muted/20 p-4">
				<div class="flex items-center gap-2 text-sm font-medium text-foreground">
					<AlertTriangle class="h-4 w-4 text-muted-foreground" />
					Images
				</div>
				<p class="mt-2 text-sm text-muted-foreground">
					{formatNumber(worldsWithImageIssues.length)} worlds report failed image generation.
				</p>
			</div>
		</div>
	{/if}
</div>
