<script lang="ts">
	import { goto } from '$app/navigation';
	import { useAuth } from '$lib/auth/auth.svelte';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Spinner } from '$lib/components/ui/spinner';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Trash2 } from '@lucide/svelte';
	import { trackEvent } from '$lib/utils/analytics';

	const auth = useAuth();

	let deleteDialogOpen = $state(false);
	let deleteConfirmText = $state('');
	let isDeleting = $state(false);
	let deleteError = $state('');
	const canDelete = $derived(deleteConfirmText === 'DELETE');

	async function handleDeleteAccount() {
		if (!canDelete || isDeleting) return;
		deleteError = '';
		isDeleting = true;
		try {
			await auth.deleteAccount();
			trackEvent('account_deleted');
			goto('/');
		} catch (error) {
			deleteError = error instanceof Error ? error.message : 'Account deletion failed.';
		} finally {
			isDeleting = false;
		}
	}
</script>

<Card class="border-destructive/30">
	<CardHeader>
		<div class="flex items-center gap-2">
			<Trash2 class="h-5 w-5 text-destructive" />
			<CardTitle>Danger Zone</CardTitle>
		</div>
		<CardDescription>Irreversible actions for your account</CardDescription>
	</CardHeader>
	<CardContent>
		<div class="flex items-center justify-between gap-4">
			<div>
				<p class="text-sm font-medium text-foreground">Delete account</p>
				<p class="text-sm text-muted-foreground">
					Permanently delete your account, worlds, and all data. This cannot be undone.
				</p>
			</div>
			<Dialog.Root bind:open={deleteDialogOpen}>
				<Dialog.Trigger>
					{#snippet child({ props })}
						<Button variant="destructive" size="sm" {...props}>Delete Account</Button>
					{/snippet}
				</Dialog.Trigger>
				<Dialog.Content class="sm:max-w-md">
					<Dialog.Header>
						<Dialog.Title class="flex items-center gap-2 text-destructive">
							<Trash2 class="h-5 w-5" />
							Delete Account
						</Dialog.Title>
						<Dialog.Description>
							This will permanently delete your account, all your worlds, story nodes, and all
							associated data. Any active subscriptions will be cancelled. This action cannot be
							undone.
						</Dialog.Description>
					</Dialog.Header>
					<div class="space-y-4 py-4">
						{#if deleteError}
							<div
								class="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
							>
								{deleteError}
							</div>
						{/if}
						<div class="space-y-2">
							<Label for="delete-confirm">
								Type <strong>DELETE</strong> to confirm
							</Label>
							<Input
								id="delete-confirm"
								type="text"
								placeholder="DELETE"
								bind:value={deleteConfirmText}
								disabled={isDeleting}
								class="font-mono"
							/>
						</div>
					</div>
					<Dialog.Footer>
						<Button
							variant="outline"
							onclick={() => {
								deleteDialogOpen = false;
								deleteConfirmText = '';
								deleteError = '';
							}}
							disabled={isDeleting}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onclick={handleDeleteAccount}
							disabled={!canDelete || isDeleting}
						>
							{#if isDeleting}
								<Spinner class="mr-2" />
								Deleting...
							{:else}
								Delete My Account
							{/if}
						</Button>
					</Dialog.Footer>
				</Dialog.Content>
			</Dialog.Root>
		</div>
	</CardContent>
</Card>
