<script lang="ts">
	interface Props {
		class?: string;
	}

	let { class: className = '' }: Props = $props();
</script>

<div class="flex items-center justify-center py-6 {className}" aria-hidden="true">
	<div class="h-px w-24 bg-border"></div>
	<div class="mx-3 h-1.5 w-1.5 rounded-full border border-border bg-background"></div>
	<div class="h-px w-24 bg-border"></div>
</div>
