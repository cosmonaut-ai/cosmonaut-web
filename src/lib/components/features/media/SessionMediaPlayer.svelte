<script lang="ts">
	import { untrack } from 'svelte';
	import { usePlaylist } from '$lib/queries';
	import { getSessionMediaContext } from '$lib/contexts/sessionMedia.svelte';
	import { getImmersiveStoryContext } from '$lib/contexts/immersiveStory.svelte';
	import {
		applyMediaVolume,
		mediaGain,
		NARRATION_GAIN_BASELINE,
		resumeMediaVolumeContext
	} from '$lib/utils/mediaVolume';
	import { useSoundtrackPlayer } from './useSoundtrackPlayer.svelte';
	import SessionMediaBar from './SessionMediaBar.svelte';

	const media = getSessionMediaContext();
	const immersiveStory = getImmersiveStoryContext();
	const soundtrack = useSoundtrackPlayer();

	// ── Narration audio element ──
	let narrationElement = $state<HTMLAudioElement | null>(null);
	let narrationCurrentTime = $state(0);
	let narrationDuration = $state(0);
	let narrationPaused = $state(true);
	let narrationEnded = $state(false);
	let playRequestId = 0;
	let lastNarrationUrl: string | null = null;
	let lastStartedPlaylistId: string | null = null;
	let soundtrackPlaybackRequested = false;

	// ── Soundtrack audio elements ──
	let soundtrackA = $state<HTMLAudioElement | null>(null);
	let soundtrackB = $state<HTMLAudioElement | null>(null);

	// ── Playlist fetch (disabled until soundtrack is started) ──
	const playlistQuery = usePlaylist(() => media.soundtrackPlaylistId, {
		enabled: () => media.soundtrackStarted && !!media.soundtrackPlaylistId
	});
	const narrationGain = $derived(mediaGain(media.narrationVolume, NARRATION_GAIN_BASELINE));
	const soundtrackReady = $derived(media.soundtrackStarted && soundtrack.tracks.length > 0);
	const soundtrackShouldPlay = $derived(
		media.barVisible && media.soundtrackEnabled && soundtrackReady
	);

	// Sync narration playback state → context
	$effect(() => {
		media.narrationCurrentTime = narrationCurrentTime;
	});
	$effect(() => {
		media.narrationDuration = narrationDuration;
	});
	$effect(() => {
		media.narrationPaused = narrationPaused;
	});
	$effect(() => {
		media.narrationEnded = narrationEnded;
	});

	// Keep shared slider state wired to the actual media element, not just the bar UI.
	$effect(() => {
		const element = narrationElement;
		const volume = narrationGain;
		const playbackRate = media.narrationPlaybackRate;

		if (!element) return;

		applyMediaVolume(element, volume);
		if (Number.isFinite(playbackRate) && element.playbackRate !== playbackRate) {
			element.playbackRate = playbackRate;
		}
	});

	// Auto-play when narration URL changes
	$effect(() => {
		const url = media.narrationUrl;
		if (url && url !== lastNarrationUrl) {
			lastNarrationUrl = url;
			waitAndPlay();
		} else if (!url && lastNarrationUrl) {
			lastNarrationUrl = null;
		}
	});

	// Register seek callback on context
	$effect(() => {
		media.seekNarration = seekToTime;
		return () => {
			media.seekNarration = null;
		};
	});

	// ── Soundtrack: bind elements and start when playlist loads ──
	$effect(() => {
		const a = soundtrackA;
		const b = soundtrackB;

		if (a && b) {
			untrack(() => soundtrack.bindElements(a, b));
			return () => {
				untrack(() => soundtrack.unbindElements());
			};
		}
	});

	// Sync soundtrack volume/muted from context
	$effect(() => {
		const volume = media.soundtrackVolume;
		untrack(() => soundtrack.setVolume(volume));
	});
	$effect(() => {
		const muted = media.soundtrackMuted || !media.soundtrackEnabled;
		untrack(() => soundtrack.setMuted(muted));
	});

	// Start soundtrack playback when playlist data arrives
	$effect(() => {
		const data = playlistQuery.data;
		const id = media.soundtrackPlaylistId;
		if (
			data &&
			data.tracks.length > 0 &&
			media.soundtrackStarted &&
			media.soundtrackEnabled &&
			id !== lastStartedPlaylistId
		) {
			const autoplay = soundtrackShouldPlay;
			lastStartedPlaylistId = id;
			soundtrackPlaybackRequested = autoplay;
			untrack(() => soundtrack.start(data.tracks, { autoplay }));
		}
	});

	// Soundtrack ambience follows the audio tray, not narration play/pause.
	$effect(() => {
		const shouldPlay = soundtrackShouldPlay;
		if (shouldPlay === soundtrackPlaybackRequested) return;

		soundtrackPlaybackRequested = shouldPlay;
		if (shouldPlay) {
			untrack(() => soundtrack.resume());
		} else {
			untrack(() => soundtrack.pause());
		}
	});

	// ── Narration playback helpers ──

	function waitForPlayable(element: HTMLAudioElement, requestId: number): Promise<boolean> {
		if (element.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
			return Promise.resolve(true);
		}

		return new Promise((resolve) => {
			let settled = false;
			let timeoutId: ReturnType<typeof setTimeout> | null = null;

			const cleanup = () => {
				element.removeEventListener('canplay', handleReady);
				element.removeEventListener('loadeddata', handleReady);
				element.removeEventListener('error', handleError);
				if (timeoutId) clearTimeout(timeoutId);
			};

			const settle = (ready: boolean) => {
				if (settled) return;
				settled = true;
				cleanup();
				resolve(requestId === playRequestId && element === narrationElement && ready);
			};

			const handleReady = () => settle(true);
			const handleError = () => settle(false);

			element.addEventListener('canplay', handleReady, { once: true });
			element.addEventListener('loadeddata', handleReady, { once: true });
			element.addEventListener('error', handleError, { once: true });

			timeoutId = setTimeout(() => settle(true), 2500);
		});
	}

	async function waitAndPlay(): Promise<boolean> {
		const requestId = ++playRequestId;
		await new Promise((r) => requestAnimationFrame(r));
		await new Promise((r) => requestAnimationFrame(r));

		const element = narrationElement;
		if (!element) return false;

		const ready = await waitForPlayable(element, requestId);
		if (!ready || requestId !== playRequestId || element !== narrationElement) return false;

		try {
			resumeMediaVolumeContext();
			await element.play();
			return true;
		} catch {
			return false;
		}
	}

	function togglePlayPause() {
		if (!narrationElement) return;
		if (narrationPaused) {
			if (narrationEnded) narrationElement.currentTime = 0;
			resumeMediaVolumeContext();
			narrationElement.play().catch(() => {});
		} else {
			narrationElement.pause();
		}
	}

	function handleSeek(e: Event) {
		if (!narrationElement) return;
		const target = e.target as HTMLInputElement;
		const nextTime = (parseFloat(target.value) / 100) * narrationDuration;
		narrationElement.currentTime = nextTime;
		narrationCurrentTime = nextTime;
		narrationEnded = false;
	}

	function seekToTime(time: number) {
		if (!Number.isFinite(time)) return;
		if (!media.narrationUrl || media.narrationIsGenerating) return;

		const element = narrationElement;
		if (!element) return;

		if (element.readyState < HTMLMediaElement.HAVE_METADATA) return;

		const duration =
			Number.isFinite(narrationDuration) && narrationDuration > 0
				? narrationDuration
				: Number.isFinite(element.duration) && element.duration > 0
					? element.duration
					: time;
		const nextTime = Math.min(Math.max(time, 0), duration);

		try {
			element.currentTime = nextTime;
		} catch {
			return;
		}

		narrationCurrentTime = nextTime;
		narrationEnded = false;
	}

	function handleNarrationPlay() {
		media.narrationHasStartedPlayback = true;
	}

	function handleNarrationError() {
		media.narrationPaused = true;
		media.narrationHasStartedPlayback = false;
	}

	function handleClose() {
		immersiveStory.setActive(false);
		if (narrationElement) {
			narrationElement.pause();
		}
		soundtrackPlaybackRequested = false;
		untrack(() => soundtrack.stop());
		media.clearNarration();
		media.soundtrackStarted = false;
		lastStartedPlaylistId = null;
		media.hideBar();
	}

	// ── Computed ──
	const shouldShowBar = $derived(
		media.barVisible &&
			(!!media.narrationUrl || media.narrationIsGenerating || media.soundtrackStarted)
	);
</script>

<!-- Narration audio element -->
{#if media.narrationUrl}
	<audio
		bind:this={narrationElement}
		bind:currentTime={narrationCurrentTime}
		bind:duration={narrationDuration}
		bind:paused={narrationPaused}
		bind:ended={narrationEnded}
		src={media.narrationUrl}
		crossorigin="anonymous"
		preload="auto"
		onplay={handleNarrationPlay}
		onerror={handleNarrationError}
	></audio>
{/if}

<!-- Soundtrack A/B elements -->
<audio bind:this={soundtrackA} crossorigin="anonymous" preload="none"></audio>
<audio bind:this={soundtrackB} crossorigin="anonymous" preload="none"></audio>

{#if shouldShowBar}
	<SessionMediaBar onTogglePlayPause={togglePlayPause} onSeek={handleSeek} onClose={handleClose} />
{/if}
