<script lang="ts">
	import { fade } from 'svelte/transition';
	import { untrack } from 'svelte';

	/**
	 * Component that displays text word-by-word with a smooth fade-in effect.
	 * It handles paragraph breaks and maintains formatting.
	 */
	let {
		text,
		done,
		onComplete
	}: {
		text: string;
		done: boolean;
		onComplete?: () => void;
	} = $props();

	// Split by whitespace but keep the tokens.
	let tokens = $derived(text.split(/(\s+)/).filter(Boolean));
	let displayedCount = $state(0);
	let completed = $state(false);

	// Initialize displayedCount based on done state
	$effect(() => {
		if (done && displayedCount === 0 && tokens.length > 0) {
			displayedCount = tokens.length;
		}
	});

	// Detect if the first piece of text we got was already marked as done
	// (i.e. it wasn't really a stream, but a full response)
	let isFirstUpdate = true;

	$effect(() => {
		// If already done and all tokens displayed, just signal completion
		if (done && displayedCount >= tokens.length) {
			if (!completed) {
				untrack(() => {
					completed = true;
					onComplete?.();
				});
			}
			return;
		}

		// If we just got the first real chunk and it's already marked as done,
		// bypass the typewriter animation entirely.
		if (isFirstUpdate && tokens.length > 0 && done) {
			displayedCount = tokens.length;
			isFirstUpdate = false;
			return;
		}

		if (tokens.length > 0) {
			isFirstUpdate = false;
		}

		const interval = setInterval(() => {
			untrack(() => {
				const readyCount = done ? tokens.length : Math.max(0, tokens.length - 1);

				if (displayedCount < readyCount) {
					displayedCount++;
				} else if (done && !completed) {
					completed = true;
					onComplete?.();
				}
			});
		}, 30);

		return () => clearInterval(interval);
	});

	// Group tokens into paragraphs for proper prose rendering.
	// We split paragraphs by \n\n but don't include the separator in the visible text
	// to avoid double-spacing (margin + newlines).
	let paragraphs = $derived.by(() => {
		const result: string[][] = [];
		let currentPara: string[] = [];
		const visibleTokens = tokens.slice(0, displayedCount);

		for (const token of visibleTokens) {
			if (token.includes('\n\n')) {
				// Finish current paragraph
				if (currentPara.length > 0) {
					result.push(currentPara);
				}
				currentPara = [];

				// If there's content after \n\n in the same token (unlikely but possible),
				// we'd handle it here. For now, we assume \n\n is a separator.
				const cleanToken = token.replace('\n\n', '').trim();
				if (cleanToken) {
					currentPara.push(cleanToken);
				}
			} else {
				currentPara.push(token);
			}
		}

		if (currentPara.length > 0) {
			result.push(currentPara);
		}

		return result;
	});
</script>

{#each paragraphs as para, paraIndex (paraIndex)}
	<p class="whitespace-pre-wrap">
		{#each para as token, tokenIndex (tokenIndex)}
			<span in:fade={{ duration: 200 }} class="inline">{token}</span>
		{/each}
	</p>
{/each}
