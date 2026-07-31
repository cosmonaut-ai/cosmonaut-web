<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { getAdminPlaylist } from '$lib/api/admin';
	import { contentRatingClass, formatDateTime, formatDuration, shortId } from '$lib/admin/format';
	import type { Playlist } from '$lib/types/api';
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
		ChevronLeft,
		Clock3,
		Disc3,
		ExternalLink,
		Hash,
		ListMusic,
		Music2,
		RefreshCw
	} from '@lucide/svelte';

	const playlistId = $derived(page.params.playlistId ?? '');

	let playlist = $state<Playlist | null>(null);
	let currentPlaylistId = $state('');
	let loading = $state(false);
	let error = $state('');
	let requestId = 0;

	const trackCount = $derived(playlist?.tracks.length ?? 0);
	const playableCount = $derived(playlist?.tracks.filter((track) => !!track.audio_url).length ?? 0);
	const totalDuration = $derived(
		playlist?.tracks.reduce((total, track) => total + (track.duration_seconds ?? 0), 0) ?? 0
	);
	const contentRatings = $derived.by(() => {
		const ratings: string[] = [];
		for (const track of playlist?.tracks ?? []) {
			if (track.content_rating && !ratings.includes(track.content_rating)) {
				ratings.push(track.content_rating);
			}
		}
		return ratings;
	});

	afterNavigate(() => {
		syncPlaylistFromRoute();
	});

	async function loadPlaylist(
		targetPlaylistId = playlistId,
		currentRequest = ++requestId,
		clear = false
	) {
		if (!targetPlaylistId) return;
		if (clear) playlist = null;
		loading = true;
		error = '';
		try {
			const fresh = await getAdminPlaylist(targetPlaylistId);
			if (currentRequest !== requestId) return;
			playlist = fresh;
		} catch (caught) {
			if (currentRequest !== requestId) return;
			error = caught instanceof Error ? caught.message : 'Failed to load playlist';
		} finally {
			if (currentRequest === requestId) loading = false;
		}
	}

	function loopStrategyLabel(value: string | null): string {
		if (value === 'fade_restart') return 'Fade restart';
		if (value === 'crossfade') return 'Crossfade';
		if (value === 'none') return 'None';
		return value || 'N/A';
	}

	function clearResult() {
		++requestId;
		playlist = null;
		error = '';
		loading = false;
	}

	function syncPlaylistFromRoute() {
		const nextPlaylistId = playlistId;
		if (nextPlaylistId === currentPlaylistId) return;

		currentPlaylistId = nextPlaylistId;

		if (!nextPlaylistId) {
			clearResult();
			return;
		}

		void loadPlaylist(nextPlaylistId, ++requestId, true);
	}
</script>

<section class="space-y-6">
	<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
		<div class="min-w-0">
			<Button href="/admin/playlists" variant="ghost" size="sm" class="mb-2 px-0">
				<ChevronLeft class="h-4 w-4" />
				Playlists
			</Button>
			<div class="flex flex-wrap items-center gap-2">
				<Badge variant="outline">
					<ListMusic class="mr-1 h-3.5 w-3.5" />
					Generated playlist
				</Badge>
				{#if loading && playlist}
					<Badge variant="outline">
						<Spinner class="mr-1 h-3.5 w-3.5" />
						Refreshing
					</Badge>
				{/if}
			</div>
			<h2 class="mt-3 text-xl font-semibold text-foreground">Playlist Detail</h2>
			<p
				class="mt-1 flex min-w-0 items-center gap-1 font-mono text-sm break-all text-muted-foreground"
			>
				{playlistId}
				<CopyButton
					value={playlistId}
					label="Copy playlist ID"
					successLabel="Playlist ID copied"
					class="h-7 w-7 shrink-0 text-muted-foreground"
				/>
			</p>
		</div>
		<div class="flex flex-wrap gap-2 md:justify-end">
			<Button href="/admin/worlds" variant="outline" size="sm">Worlds</Button>
			<Button
				variant="outline"
				size="sm"
				disabled={loading}
				onclick={() => loadPlaylist(playlistId, ++requestId, false)}
			>
				{#if loading}
					<Spinner class="h-4 w-4" />
				{:else}
					<RefreshCw class="h-4 w-4" />
				{/if}
				Refresh
			</Button>
		</div>
	</div>

	{#if error && !playlist}
		<Card class="border-destructive/30 bg-destructive/10">
			<CardHeader>
				<CardTitle class="text-destructive">Playlist unavailable</CardTitle>
				<CardDescription class="text-destructive/80">{error}</CardDescription>
			</CardHeader>
			<CardContent>
				<Button
					variant="outline"
					size="sm"
					disabled={loading}
					onclick={() => loadPlaylist(playlistId, ++requestId, false)}
				>
					<RefreshCw class="h-4 w-4" />
					Try Again
				</Button>
			</CardContent>
		</Card>
	{:else if loading && !playlist}
		<div class="grid gap-4 md:grid-cols-4">
			{#each Array(4) as _, index (index)}
				<Skeleton class="h-24 w-full" />
			{/each}
		</div>
		<Skeleton class="h-96 w-full" />
	{:else if playlist}
		<div class="grid gap-3 md:grid-cols-4">
			<div class="rounded-lg border border-border bg-card p-4">
				<div class="flex items-center justify-between gap-3">
					<span class="text-xs font-medium text-muted-foreground uppercase">Songs</span>
					<ListMusic class="h-4 w-4 text-muted-foreground" />
				</div>
				<p class="mt-2 text-2xl font-semibold text-foreground">{trackCount}</p>
			</div>
			<div class="rounded-lg border border-border bg-card p-4">
				<div class="flex items-center justify-between gap-3">
					<span class="text-xs font-medium text-muted-foreground uppercase">Playable</span>
					<Disc3 class="h-4 w-4 text-muted-foreground" />
				</div>
				<p class="mt-2 text-2xl font-semibold text-foreground">{playableCount}</p>
			</div>
			<div class="rounded-lg border border-border bg-card p-4">
				<div class="flex items-center justify-between gap-3">
					<span class="text-xs font-medium text-muted-foreground uppercase">Duration</span>
					<Clock3 class="h-4 w-4 text-muted-foreground" />
				</div>
				<p class="mt-2 text-2xl font-semibold text-foreground">
					{trackCount ? formatDuration(totalDuration) : 'N/A'}
				</p>
			</div>
			<div class="rounded-lg border border-border bg-card p-4">
				<div class="flex items-center justify-between gap-3">
					<span class="text-xs font-medium text-muted-foreground uppercase">Ratings</span>
					<Hash class="h-4 w-4 text-muted-foreground" />
				</div>
				<p class="mt-2 truncate text-2xl font-semibold text-foreground">
					{contentRatings.length ? contentRatings.join(', ') : 'N/A'}
				</p>
			</div>
		</div>

		<div class="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
			<Card class="min-w-0">
				<CardHeader>
					<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
						<div class="min-w-0">
							<CardTitle class="flex items-center gap-2">
								<Music2 class="h-5 w-5 text-muted-foreground" />
								Songs
							</CardTitle>
							<CardDescription>
								{playableCount} playable of {trackCount} total
							</CardDescription>
						</div>
						<Badge variant="outline">{shortId(playlist.id)}</Badge>
					</div>
				</CardHeader>
				<CardContent>
					<div class="divide-y divide-border">
						{#each playlist.tracks as track, index (`${track.soundtrack_id}-${index}`)}
							<article
								class="grid min-w-0 gap-4 py-4 first:pt-0 last:pb-0 xl:grid-cols-[2.75rem_minmax(0,1fr)_minmax(15rem,0.75fr)_7rem] xl:items-center"
							>
								<div
									class="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-muted/50 font-mono text-xs text-muted-foreground"
									aria-label={`Track ${index + 1}`}
								>
									{index + 1}
								</div>

								<div class="min-w-0 space-y-2">
									<div class="min-w-0">
										<a
											href={`/admin/soundtracks/${track.soundtrack_id}`}
											class="line-clamp-2 text-base font-medium text-foreground hover:text-primary hover:underline"
										>
											{track.title || 'Untitled soundtrack'}
										</a>
										<p class="mt-1 line-clamp-3 text-sm leading-6 text-muted-foreground">
											{track.description || 'No description'}
										</p>
									</div>
									<div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
										<span class="flex min-w-0 items-center gap-1 font-mono">
											<span>{shortId(track.soundtrack_id)}</span>
											<CopyButton
												value={track.soundtrack_id}
												label="Copy soundtrack ID"
												successLabel="Soundtrack ID copied"
												class="h-6 w-6 shrink-0 text-muted-foreground"
											/>
										</span>
										<span>{formatDuration(track.duration_seconds)}</span>
										<span>{loopStrategyLabel(track.loop_strategy)}</span>
										{#if track.content_rating}
											<Badge class={contentRatingClass(track.content_rating)}>
												{track.content_rating}
											</Badge>
										{/if}
									</div>
								</div>

								<div class="min-w-0">
									{#if track.audio_url}
										<audio
											controls
											preload="none"
											src={track.audio_url}
											class="h-10 w-full min-w-0"
											aria-label={`Preview ${track.title || track.soundtrack_id}`}
										></audio>
									{:else}
										<div
											class="flex h-10 items-center rounded-lg border border-border bg-muted/30 px-3 text-sm text-muted-foreground"
										>
											No audio
										</div>
									{/if}
								</div>

								<div class="flex flex-wrap gap-2 xl:flex-col xl:items-stretch">
									<Button
										href={`/admin/soundtracks/${track.soundtrack_id}`}
										variant="outline"
										size="sm"
									>
										Soundtrack
									</Button>
									{#if track.audio_url}
										<Button
											href={track.audio_url}
											variant="outline"
											size="sm"
											target="_blank"
											rel="noreferrer"
										>
											<ExternalLink class="h-4 w-4" />
											Audio
										</Button>
									{/if}
								</div>
							</article>
						{:else}
							<p class="text-sm text-muted-foreground">No songs found for this playlist.</p>
						{/each}
					</div>
				</CardContent>
			</Card>

			<div class="min-w-0 space-y-6">
				<Card class="min-w-0 self-start">
					<CardHeader>
						<CardTitle>Metadata</CardTitle>
						<CardDescription>Generated soundtrack bundle</CardDescription>
					</CardHeader>
					<CardContent class="space-y-4 text-sm">
						<div class="space-y-1">
							<p class="text-xs font-medium text-muted-foreground uppercase">Playlist ID</p>
							<div class="flex items-center gap-1">
								<p class="min-w-0 truncate font-mono text-xs text-foreground">{playlist.id}</p>
								<CopyButton
									value={playlist.id}
									label="Copy playlist ID"
									successLabel="Playlist ID copied"
									class="h-6 w-6 shrink-0 text-muted-foreground"
								/>
							</div>
						</div>
						<div class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3">
							<span class="text-muted-foreground">Generated</span>
							<span class="truncate text-right text-foreground">
								{formatDateTime(playlist.generated_at)}
							</span>
							<span class="text-muted-foreground">Created</span>
							<span class="truncate text-right text-foreground">
								{formatDateTime(playlist.created_at)}
							</span>
							<span class="text-muted-foreground">Songs</span>
							<span class="text-right text-foreground">{trackCount}</span>
							<span class="text-muted-foreground">Playable</span>
							<span class="text-right text-foreground">{playableCount}</span>
						</div>
						<div class="space-y-1">
							<p class="text-xs font-medium text-muted-foreground uppercase">Description</p>
							<p class="max-h-48 overflow-y-auto text-sm leading-6 text-foreground">
								{playlist.description || 'N/A'}
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	{/if}
</section>
