<script lang="ts">
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Trash2 } from '@lucide/svelte';

	interface Props {
		open: boolean;
		title?: string;
		description: string;
		loading?: boolean;
		disabled?: boolean;
		onConfirm: () => void;
		onOpenChange: (open: boolean) => void;
	}

	let {
		open,
		title = 'Confirm deletion',
		description,
		loading = false,
		disabled = false,
		onConfirm,
		onOpenChange
	}: Props = $props();
</script>

<AlertDialog.Root {open} {onOpenChange}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>{title}</AlertDialog.Title>
			<AlertDialog.Description>
				{@html description}
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={loading}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				variant="destructive"
				disabled={loading || disabled}
				onclick={(event) => {
					event.preventDefault();
					onConfirm();
				}}
			>
				{#if loading}
					<Spinner class="h-4 w-4" />
				{:else}
					<Trash2 class="h-4 w-4" />
				{/if}
				Delete
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
