import { onDestroy } from 'svelte';

interface UseAutosaveOptions {
	/** Milliseconds to debounce before saving (default: 500) */
	debounceMs?: number;
	/** Milliseconds to show "saved" feedback (default: 2000) */
	feedbackMs?: number;
}

/**
 * Manages debounced autosave with "just saved" feedback state.
 */
export function useAutosave(options: UseAutosaveOptions = {}) {
	const { debounceMs = 500, feedbackMs = 2000 } = options;

	let saveTimeout: ReturnType<typeof setTimeout> | undefined;
	let feedbackTimeout: ReturnType<typeof setTimeout> | undefined;
	let justSaved = $state(false);

	function schedule(saveFn: () => void) {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(saveFn, debounceMs);
	}

	function markSaved() {
		justSaved = true;
		clearTimeout(feedbackTimeout);
		feedbackTimeout = setTimeout(() => {
			justSaved = false;
		}, feedbackMs);
	}

	function reset() {
		justSaved = false;
		clearTimeout(saveTimeout);
		clearTimeout(feedbackTimeout);
	}

	onDestroy(() => {
		clearTimeout(saveTimeout);
		clearTimeout(feedbackTimeout);
	});

	return {
		get justSaved() {
			return justSaved;
		},
		schedule,
		markSaved,
		reset
	};
}
