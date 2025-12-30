<script lang="ts">
	let { size = 'md' } = $props<{ size?: 'sm' | 'md' | 'lg' }>();

	const sizeClasses = {
		sm: 'w-4 h-4',
		md: 'w-8 h-8',
		lg: 'w-12 h-12'
	};
</script>

<div class="flex items-center justify-center">
	<div
		class="animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 {sizeClasses[size]}"
		role="status"
		aria-label="Loading"
	>
		<!--  -->
		<span class="sr-only">Loading...</span>
	</div>
</div>
