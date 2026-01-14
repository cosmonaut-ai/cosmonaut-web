<script lang="ts">
	import type { Snippet } from 'svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	interface Props {
		key: string;
		direction: 'forward' | 'back';
		children: Snippet;
	}

	let { key, direction, children }: Props = $props();

	// Transition parameters based on direction
	// Forward: slide in from right, slide out to left
	// Back: slide in from left, slide out to right
	const inX = $derived(direction === 'forward' ? 300 : -300);
	const outX = $derived(direction === 'forward' ? -300 : 300);
</script>

<div class="relative overflow-hidden">
	{#key key}
		<div
			in:fly={{ x: inX, duration: 400, delay: 200, easing: cubicOut }}
			out:fly={{ x: outX, duration: 200, easing: cubicOut }}
		>
			{@render children()}
		</div>
	{/key}
</div>
