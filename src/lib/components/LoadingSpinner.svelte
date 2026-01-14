<script lang="ts">
	type Size = 'sm' | 'md' | 'lg';

	interface Props {
		size?: Size;
	}

	let { size = 'md' }: Props = $props();

	const sizeClasses: Record<Size, string> = {
		sm: 'w-4 h-4',
		md: 'w-8 h-8',
		lg: 'w-12 h-12'
	};

	const sizeClass = $derived(sizeClasses[size]);
</script>

<div class="flex items-center justify-center">
	<div
		class="animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 {sizeClass}"
		role="status"
		aria-label="Loading"
	>
		<span class="sr-only">Loading...</span>
	</div>
</div>
