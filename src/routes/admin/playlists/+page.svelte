<script lang="ts">
	import { afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { getAdminPlaylist } from '$lib/api/admin';
	import { contentRatingClass, formatDateTime, formatDuration, shortId } from '$lib/admin/format';
	import { queryValue, routeWithQuery } from '$lib/admin/url';
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
	import { Input } from '$lib/components/ui/input';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Disc3, ExternalLink, ListMusic, Music2, RefreshCw, Search } from '@lucide/svelte';

	let playlistIdInput = $state('');
	let currentPlaylistId = $state('');
	let playlist = $state<Playlist | null>(null);
	let loading = $state(false);
	let error = $state('');
	let requestId = 0;

	const trackCount = $derived(playlist?.tracks.length ?? 0);
	const playableCount = $derived(playlist?.tracks.filter((track) => !!track.audio_url).length ?? 0);
	const previewTracks = $derived(playlist?.tracks.slice(0, 5) ?? []);

	afterNavigate(() => {
		syncLookupFromUrl();
	});

	async function loadPlaylist(targetPlaylistId: string, currentRequest = ++requestId) {
		const cleaned = targetPlaylistId.trim();
		if (!cleaned) return;

		loading = true;
		error = '';
		try {
			const fresh = await getAdminPlaylist(cleaned);
			if (currentRequest !== requestId) return;
			playlist = fresh;
		} catch (caught) {
			if (currentRequest !== requestId) return;
			playlist = null;
			error = caught instanceof Error ? caught.message : 'Failed to load playlist';
		} finally {
			if (currentRequest === requestId) loading = false;
		}
	}

	function submitLookup() {
		const cleaned = playlistIdInput.trim();
		currentPlaylistId = cleaned;
		goto(routeWithQuery(page.url, { playlist_id: cleaned || null }), { replaceState: false });
		if (cleaned) {
			void loadPlaylist(cleaned);
		} else {
			clearResult();
		}
	}

	function clearLookup() {
		playlistIdInput = '';
		currentPlaylistId = '';
		clearResult();
		goto(routeWithQuery(page.url, { playlist_id: null }), { replaceState: false });
	}

	function clearResult() {
		++requestId;
		playlist = null;
		error = '';
		loading = false;
	}

	function syncLookupFromUrl() {
		const nextPlaylistId = queryValue(page.url, 'playlist_id');
		if (nextPlaylistId === currentPlaylistId) return;

		playlistIdInput = nextPlaylistId;
		currentPlaylistId = nextPlaylistId;

		if (!nextPlaylistId) {
			clearResult();
			return;
		}

		void loadPlaylist(nextPlaylistId);
	}
</script>

<section class="space-y-6">
	<div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
		<div>
			<div class="flex flex-wrap items-center gap-2">
				<Badge variant="outline">
					<ListMusic class="mr-1 h-3.5 w-3.5" />
					Playlists
				</Badge>
			</div>
			<h2 class="mt-3 text-xl font-semibold text-foreground">Playlist Lookup</h2>
		</div>
		<Button href="/admin/worlds" variant="outline" size="sm">Worlds</Button>
	</div>

	<Card class="min-w-0">
		<CardHeader>
			<CardTitle>Find Playlist</CardTitle>
		</CardHeader>
		<CardContent>
			<form
				class="flex min-w-0 flex-col gap-3 sm:flex-row"
				onsubmit={(event) => {
					event.preventDefault();
					submitLookup();
				}}
			>
				<Input
					bind:value={playlistIdInput}
					placeholder="Playlist ID"
					aria-label="Playlist ID"
					class="min-w-0"
				/>
				<div class="flex gap-2">
					<Button type="submit" disabled={loading || !playlistIdInput.trim()}>
						<Search class="h-4 w-4" />
						Lookup
					</Button>
					{#if currentPlaylistId}
						<Button type="button" variant="outline" disabled={loading} onclick={clearLookup}>
							Clear
						</Button>
					{/if}
				</div>
			</form>
		</CardContent>
	</Card>

	{#if loading}
		<div class="grid gap-4 md:grid-cols-[minmax(0,1fr)_18rem]">
			<Skeleton class="h-72 w-full" />
			<Skeleton class="h-72 w-full" />
		</div>
	{:else if error}
		<Card class="border-destructive/30 bg-destructive/10">
			<CardHeader>
				<CardTitle class="text-destructive">Playlist unavailable</CardTitle>
				<CardDescription class="text-destructive/80">{error}</CardDescription>
			</CardHeader>
			<CardContent>
				<Button
					variant="outline"
					size="sm"
					disabled={!currentPlaylistId}
					onclick={() => loadPlaylist(currentPlaylistId)}
				>
					<RefreshCw class="h-4 w-4" />
					Try Again
				</Button>
			</CardContent>
		</Card>
	{:else if playlist}
		<div class="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
			<Card class="min-w-0">
				<CardHeader>
					<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
						<div class="min-w-0">
							<CardTitle class="flex items-center gap-2">
								<Music2 class="h-5 w-5 text-muted-foreground" />
								{shortId(playlist.id)}
							</CardTitle>
							<CardDescription>
								{playableCount} playable of {trackCount} total
							</CardDescription>
						</div>
						<Button href={`/admin/playlists/${playlist.id}`} size="sm">Open Detail</Button>
					</div>
				</CardHeader>
				<CardContent>
					<div class="divide-y divide-border">
						{#each previewTracks as track, index (`${track.soundtrack_id}-${index}`)}
							<article
								class="grid gap-4 py-4 first:pt-0 last:pb-0 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-center"
							>
								<div class="min-w-0 space-y-2">
									<a
										href={`/admin/soundtracks/${track.soundtrack_id}`}
										class="line-clamp-1 font-medium text-foreground hover:text-primary hover:underline"
									>
										{track.title || 'Untitled soundtrack'}
									</a>
									<p class="line-clamp-2 text-sm leading-6 text-muted-foreground">
										{track.description || 'No description'}
									</p>
									<div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
										<span class="flex items-center gap-1 font-mono">
											{shortId(track.soundtrack_id)}
											<CopyButton
												value={track.soundtrack_id}
												label="Copy soundtrack ID"
												successLabel="Soundtrack ID copied"
												class="h-6 w-6 text-muted-foreground"
											/>
										</span>
										<span>{formatDuration(track.duration_seconds)}</span>
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
							</article>
						{:else}
							<p class="text-sm text-muted-foreground">No songs found for this playlist.</p>
						{/each}
					</div>
					{#if trackCount > previewTracks.length}
						<div class="mt-4 flex justify-end">
							<Button href={`/admin/playlists/${playlist.id}`} variant="outline" size="sm">
								Open All Songs
							</Button>
						</div>
					{/if}
				</CardContent>
			</Card>

			<Card class="min-w-0 self-start">
				<CardHeader>
					<CardTitle>Summary</CardTitle>
					<CardDescription>{formatDateTime(playlist.created_at)}</CardDescription>
				</CardHeader>
				<CardContent class="space-y-4 text-sm">
					<div class="flex items-center gap-1">
						<p class="min-w-0 truncate font-mono text-xs text-foreground">{playlist.id}</p>
						<CopyButton
							value={playlist.id}
							label="Copy playlist ID"
							successLabel="Playlist ID copied"
							class="h-6 w-6 shrink-0 text-muted-foreground"
						/>
					</div>
					<div class="grid grid-cols-2 gap-3">
						<div class="rounded-lg border border-border p-3">
							<p class="text-xs text-muted-foreground">Songs</p>
							<p class="mt-1 text-lg font-semibold text-foreground">{trackCount}</p>
						</div>
						<div class="rounded-lg border border-border p-3">
							<p class="text-xs text-muted-foreground">Playable</p>
							<p class="mt-1 text-lg font-semibold text-foreground">{playableCount}</p>
						</div>
					</div>
					<div class="space-y-1">
						<p class="text-xs font-medium text-muted-foreground uppercase">Description</p>
						<p class="max-h-44 overflow-y-auto leading-6 text-foreground">
							{playlist.description || 'N/A'}
						</p>
					</div>
					<Button href={`/admin/playlists/${playlist.id}`} class="w-full">
						<Disc3 class="h-4 w-4" />
						Open Detail
					</Button>
					{#if playlist.tracks[0]?.audio_url}
						<Button
							href={playlist.tracks[0].audio_url}
							variant="outline"
							class="w-full"
							target="_blank"
							rel="noreferrer"
						>
							<ExternalLink class="h-4 w-4" />
							First Audio
						</Button>
					{/if}
				</CardContent>
			</Card>
		</div>
	{:else}
		<Card class="min-w-0">
			<CardHeader>
				<CardTitle>No Playlist Selected</CardTitle>
				<CardDescription>World soundtrack links open here by playlist ID.</CardDescription>
			</CardHeader>
		</Card>
	{/if}
</section>
