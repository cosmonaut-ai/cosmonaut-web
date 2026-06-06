<script lang="ts">
	import { page } from '$app/state';
	import { getPlaylist } from '$lib/api/playlists';
	import { contentRatingClass, formatDateTime, formatDuration, shortId } from '$lib/admin/format';
	import type { Playlist } from '$lib/types/api';
	import CopyButton from '$lib/components/admin/CopyButton.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Spinner } from '$lib/components/ui/spinner';
	import { ChevronLeft, ExternalLink, Music2, RefreshCw } from '@lucide/svelte';

	const playlistId = $derived(page.params.playlistId ?? '');

	let playlist = $state<Playlist | null>(null);
	let loading = $state(false);
	let error = $state('');
	let requestId = 0;

	const trackCount = $derived(playlist?.tracks.length ?? 0);

	$effect(() => {
		if (!playlistId) return;
		const currentRequest = ++requestId;
		void loadPlaylist(playlistId, currentRequest, true);
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
			const fresh = await getPlaylist(targetPlaylistId);
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
</script>

<section class="space-y-6">
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<Button href="/admin/worlds" variant="ghost" size="sm" class="mb-2 px-0">
				<ChevronLeft class="h-4 w-4" />
				Worlds
			</Button>
			<h2 class="text-xl font-semibold text-foreground">Playlist Detail</h2>
			<p class="mt-1 flex items-center gap-1 font-mono text-sm break-all text-muted-foreground">
				{playlistId}
				<CopyButton
					value={playlistId}
					label="Copy playlist ID"
					successLabel="Playlist ID copied"
					class="h-7 w-7 text-muted-foreground"
				/>
			</p>
		</div>
		<Button
			variant="outline"
			size="sm"
			disabled={loading}
			onclick={() => loadPlaylist(playlistId, ++requestId, false)}
		>
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
	{:else if loading && !playlist}
		<div class="flex h-52 items-center justify-center">
			<Spinner class="h-6 w-6" />
		</div>
	{:else if playlist}
		<div class="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
			<div class="min-w-0 space-y-6">
				<Card class="min-w-0">
					<CardHeader>
						<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
							<div class="min-w-0">
								<CardTitle class="flex items-center gap-2">
									<Music2 class="h-5 w-5 text-muted-foreground" />
									Songs
								</CardTitle>
								<p class="mt-1 text-sm text-muted-foreground">
									{trackCount} song{trackCount === 1 ? '' : 's'}
								</p>
							</div>
							<Badge variant="outline">{shortId(playlist.id)}</Badge>
						</div>
					</CardHeader>
					<CardContent>
						<div class="divide-y divide-border">
							{#each playlist.tracks as track, index (`${track.soundtrack_id}-${index}`)}
								<article
									class="grid min-w-0 gap-4 py-5 first:pt-0 last:pb-0 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.9fr)_9rem] lg:items-center"
								>
									<div class="min-w-0 space-y-2">
										<a
											href={`/admin/soundtracks/${track.soundtrack_id}`}
											class="line-clamp-2 text-base font-medium text-foreground hover:text-primary hover:underline"
										>
											{track.title || 'Untitled soundtrack'}
										</a>
										<p class="line-clamp-3 text-sm text-muted-foreground">
											{track.description || 'No description'}
										</p>
										<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
											<div class="flex items-center gap-1 font-mono">
												<span>{shortId(track.soundtrack_id)}</span>
												<CopyButton
													value={track.soundtrack_id}
													label="Copy soundtrack ID"
													successLabel="Soundtrack ID copied"
													class="h-6 w-6 text-muted-foreground"
												/>
											</div>
											<span>{formatDuration(track.duration_seconds)}</span>
											<span>{loopStrategyLabel(track.loop_strategy)}</span>
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
												class="flex h-10 items-center rounded-md border border-border px-3 text-sm text-muted-foreground"
											>
												No audio
											</div>
										{/if}
									</div>

									<div class="flex flex-wrap gap-2 lg:flex-col lg:items-stretch">
										{#if track.content_rating}
											<Badge class={contentRatingClass(track.content_rating)}>
												{track.content_rating}
											</Badge>
										{/if}
										<Button
											href={`/admin/soundtracks/${track.soundtrack_id}`}
											variant="outline"
											size="sm"
										>
											Open
										</Button>
										{#if track.audio_url}
											<Button href={track.audio_url} variant="outline" size="sm">
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
			</div>

			<div class="min-w-0 space-y-6">
				<Card class="min-w-0 self-start">
					<CardHeader>
						<CardTitle>Playlist Metadata</CardTitle>
					</CardHeader>
					<CardContent class="space-y-3 text-sm">
						<div class="space-y-1">
							<p class="text-muted-foreground">Playlist ID</p>
							<div class="flex items-center gap-1">
								<p class="min-w-0 truncate font-mono text-xs text-foreground">{playlist.id}</p>
								<CopyButton
									value={playlist.id}
									label="Copy playlist ID"
									successLabel="Playlist ID copied"
									class="h-6 w-6 text-muted-foreground"
								/>
							</div>
						</div>
						<div class="flex justify-between gap-3">
							<span class="text-muted-foreground">Generated</span>
							<span class="text-right text-foreground">{formatDateTime(playlist.generated_at)}</span
							>
						</div>
						<div class="flex justify-between gap-3">
							<span class="text-muted-foreground">Created</span>
							<span class="text-right text-foreground">{formatDateTime(playlist.created_at)}</span>
						</div>
						<div class="flex justify-between gap-3">
							<span class="text-muted-foreground">Songs</span>
							<span class="text-right text-foreground">{trackCount}</span>
						</div>
						<div class="space-y-1">
							<p class="text-muted-foreground">Description</p>
							<p class="text-foreground">{playlist.description || 'N/A'}</p>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	{/if}
</section>
