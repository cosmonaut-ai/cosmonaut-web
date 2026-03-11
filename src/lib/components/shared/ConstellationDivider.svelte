<script lang="ts">
	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();
</script>

<div
	class="constellation-divider flex items-center justify-center gap-3 py-4 {className}"
	aria-hidden="true"
>
	<span class="twinkle twinkle-1 text-sm text-primary/40">✦</span>
	<div class="h-px w-12 bg-primary/20"></div>
	<div class="h-1.5 w-1.5 rounded-full bg-primary/30"></div>
	<div class="h-px w-24 bg-primary/20"></div>
	<div class="h-1.5 w-1.5 rounded-full bg-primary/30"></div>
	<div class="h-px w-12 bg-primary/20"></div>
	<span class="twinkle twinkle-2 text-sm text-primary/40">✦</span>
</div>

<style>
	.twinkle {
		display: inline-block;
		animation: twinkle 3s ease-in-out infinite;
	}
	.twinkle-1 {
		animation-delay: 0s;
	}
	.twinkle-2 {
		animation-delay: 1.5s;
	}

	@keyframes twinkle {
		0%,
		100% {
			opacity: 0.4;
			transform: scale(1) rotate(0deg);
		}
		50% {
			opacity: 1;
			transform: scale(1.25) rotate(15deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.twinkle {
			animation: none;
			opacity: 0.6;
		}
	}
</style>
