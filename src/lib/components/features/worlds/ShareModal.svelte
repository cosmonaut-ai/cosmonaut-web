<script lang="ts">
	import type { World, WorldVisibility, InviteToken } from '$lib/types/api';
	import {
		useUpdateWorldSharing,
		useInviteToken,
		useCreateInviteToken,
		useDeleteInviteToken
	} from '$lib/queries';
	import { batchLookupUsers, type UserInfo } from '$lib/api/worlds';
	import { showError, showSuccess } from '$lib/utils/toast';
	import { browser } from '$app/environment';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Label } from '$lib/components/ui/label';
	import { Share2, X, Globe, Lock, EyeOff, Link, Copy, Check, Plus, Trash2 } from '@lucide/svelte';
	import { trackEvent } from '$lib/utils/analytics';

	interface Props {
		world: World;
		open: boolean;
		onOpenChange: (open: boolean) => void;
		onWorldUpdate?: (world: World) => void;
		isOwner?: boolean;
	}

	let { world, open, onOpenChange, onWorldUpdate, isOwner = true }: Props = $props();

	const worldId = $derived(world.id);

	let visibility = $state<WorldVisibility>('private');
	let sharedWith = $state<string[]>([]);
	let justSaved = $state(false);
	let saveTimeout: ReturnType<typeof setTimeout> | undefined;
	let savedTimeout: ReturnType<typeof setTimeout> | undefined;
	let showPrivateConfirm = $state(false);
	let pendingVisibility = $state<WorldVisibility | null>(null);
	let userToRemove = $state<string | null>(null);
	let resolvedUsers = $state<UserInfo[]>([]);

	$effect(() => {
		if (open) {
			visibility = world.visibility || 'private';
			sharedWith = [...(world.shared_with || [])];
			justSaved = false;
			clearTimeout(saveTimeout);
			clearTimeout(savedTimeout);
			resolveUsers();
		}
	});

	async function resolveUsers() {
		const ids = world.shared_with || [];
		if (ids.length === 0) {
			resolvedUsers = [];
			return;
		}
		try {
			resolvedUsers = await batchLookupUsers(ids);
		} catch {
			resolvedUsers = ids.map((id) => ({ id, display_name: id.slice(0, 8) }));
		}
	}

	const updateMutation = $derived.by(() => useUpdateWorldSharing(worldId));
	const saving = $derived(updateMutation.isPending);

	const isPrivate = $derived(visibility === 'private');

	const inviteTokenQuery = $derived.by(() =>
		useInviteToken(
			() => worldId,
			() => open && isOwner && isPrivate
		)
	);
	const createTokenMutation = $derived.by(() => useCreateInviteToken(worldId));
	const deleteTokenMutation = $derived.by(() => useDeleteInviteToken(worldId));
	const activeToken = $derived(inviteTokenQuery.data as InviteToken | null | undefined);
	const isLoadingInviteToken = $derived(inviteTokenQuery.isLoading && !inviteTokenQuery.data);
	let isCreatingToken = $state(false);
	let isDeletingToken = $state(false);

	async function handleCreateToken() {
		isCreatingToken = true;
		try {
			await createTokenMutation.mutateAsync();
		} catch {
			/* handled by mutation onError */
		} finally {
			isCreatingToken = false;
		}
	}

	async function handleDeleteToken() {
		isDeletingToken = true;
		try {
			await deleteTokenMutation.mutateAsync();
		} catch {
			/* handled by mutation onError */
		} finally {
			isDeletingToken = false;
		}
	}

	function hasUnsavedChanges(): boolean {
		const currentVisibility = world.visibility || 'private';
		const currentSharedWith = world.shared_with || [];
		if (visibility !== currentVisibility) return true;
		if (sharedWith.length !== currentSharedWith.length) return true;
		return !sharedWith.every((v, i) => v === currentSharedWith[i]);
	}

	function scheduleSave() {
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			if (!hasUnsavedChanges()) return;
			triggerSave();
		}, 500);
	}

	function triggerSave() {
		updateMutation.mutate(
			{ visibility, shared_with: sharedWith },
			{
				onSuccess: (updatedWorld) => {
					trackEvent('share_settings_saved', {
						visibility,
						shared_count: sharedWith.length
					});
					onWorldUpdate?.(updatedWorld);
					justSaved = true;
					clearTimeout(savedTimeout);
					savedTimeout = setTimeout(() => {
						justSaved = false;
					}, 2000);
				}
			}
		);
	}

	function handleVisibilityChange(v: string | undefined) {
		if (!v || !isOwner) return;
		const newVis = v as WorldVisibility;
		if (newVis === 'private' && visibility !== 'private') {
			pendingVisibility = newVis;
			showPrivateConfirm = true;
		} else {
			visibility = newVis;
			scheduleSave();
		}
	}

	function confirmPrivateSwitch() {
		if (pendingVisibility) {
			visibility = pendingVisibility;
			pendingVisibility = null;
			showPrivateConfirm = false;
			scheduleSave();
		}
	}

	function cancelPrivateSwitch() {
		pendingVisibility = null;
		showPrivateConfirm = false;
	}

	function confirmRemoveUser(userId: string) {
		userToRemove = userId;
	}

	function executeRemoveUser() {
		if (!userToRemove) return;
		sharedWith = sharedWith.filter((id) => id !== userToRemove);
		resolvedUsers = resolvedUsers.filter((u) => u.id !== userToRemove);
		userToRemove = null;
		scheduleSave();
	}

	function getWorldLink() {
		if (!browser) return '';
		return `${window.location.origin}/worlds/${worldId}`;
	}

	async function copyLink(link: string) {
		try {
			if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
			await navigator.clipboard.writeText(link);
			trackEvent('share_link_copied');
			showSuccess('Link copied');
		} catch {
			showError('Failed to copy link');
		}
	}

	function getExpiryText(token: InviteToken): string {
		const expires = new Date(token.expires_at);
		const now = new Date();
		const hoursLeft = Math.max(0, Math.round((expires.getTime() - now.getTime()) / 3_600_000));
		if (hoursLeft <= 1) return 'Expires in less than an hour';
		return `Expires in ${hoursLeft} hours`;
	}

	function getUserDisplayName(userId: string): string {
		const user = resolvedUsers.find((u) => u.id === userId);
		return user?.display_name || userId.slice(0, 8);
	}
</script>

<Dialog.Root {open} {onOpenChange}>
	<Dialog.Content class="overflow-hidden sm:max-w-md">
		<Dialog.Header class="min-w-0">
			<Dialog.Title class="flex items-center gap-2 overflow-hidden">
				<Share2 class="h-5 w-5 text-primary" />
				<span class="truncate overflow-hidden">Share "{world.title || 'Untitled World'}"</span>
				{#if saving}
					<span
						class="ml-auto flex shrink-0 items-center gap-1.5 text-xs font-normal text-muted-foreground"
					>
						<Spinner class="h-3 w-3" />
						Saving…
					</span>
				{:else if justSaved}
					<span
						class="ml-auto flex shrink-0 items-center gap-1.5 text-xs font-normal text-green-600 dark:text-green-400"
					>
						<Check class="h-3 w-3" />
						Saved
					</span>
				{/if}
			</Dialog.Title>
		</Dialog.Header>

		<div class="min-w-0 space-y-6 py-4">
			<!-- Visibility selector -->
			<div class="space-y-3">
				<Label class="text-sm font-medium">General access</Label>
				<Select.Root
					type="single"
					value={visibility}
					onValueChange={handleVisibilityChange}
					disabled={!isOwner}
				>
					<Select.Trigger class="w-full">
						<div class="flex items-center gap-2">
							{#if visibility === 'public'}
								<Globe class="h-4 w-4 text-primary" />
								<span>Public</span>
							{:else if visibility === 'unlisted'}
								<EyeOff class="h-4 w-4 text-muted-foreground" />
								<span>Unlisted</span>
							{:else}
								<Lock class="h-4 w-4 text-muted-foreground" />
								<span>Private</span>
							{/if}
						</div>
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="public">
							<div class="flex items-center gap-2">
								<Globe class="h-4 w-4" />
								<div>
									<div class="font-medium">Public</div>
									<div class="text-xs text-muted-foreground">
										Discoverable by anyone. Anyone with the link can play.
									</div>
								</div>
							</div>
						</Select.Item>
						<Select.Item value="unlisted">
							<div class="flex items-center gap-2">
								<EyeOff class="h-4 w-4" />
								<div>
									<div class="font-medium">Unlisted</div>
									<div class="text-xs text-muted-foreground">
										Not discoverable. Anyone with the link can play.
									</div>
								</div>
							</div>
						</Select.Item>
						<Select.Item value="private">
							<div class="flex items-center gap-2">
								<Lock class="h-4 w-4" />
								<div>
									<div class="font-medium">Private</div>
									<div class="text-xs text-muted-foreground">
										Invite only. Only people you invite can play.
									</div>
								</div>
							</div>
						</Select.Item>
					</Select.Content>
				</Select.Root>
				<p class="text-xs text-muted-foreground">
					{#if visibility === 'public'}
						Anyone on the internet can discover and play this world.
					{:else if visibility === 'unlisted'}
						Anyone with the link can play, but the world won't appear in search or trending.
					{:else}
						Only you and people you invite can access this world.
					{/if}
				</p>
			</div>

			<!-- Link sharing -->
			{#if visibility === 'public' || visibility === 'unlisted'}
				<button
					onclick={() => copyLink(getWorldLink())}
					class="flex w-full items-center gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-left transition-colors hover:bg-muted"
				>
					<div
						class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
					>
						<Link class="h-4 w-4" />
					</div>
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium text-foreground">Copy link</p>
						<p class="truncate text-xs text-muted-foreground">
							Anyone with this link can play this world
						</p>
					</div>
					<Copy class="h-4 w-4 shrink-0 text-muted-foreground" />
				</button>
			{:else if isOwner}
				<!-- Private world invite link -->
				<div class="space-y-3">
					<Label class="text-sm font-medium">Invite link</Label>
					{#if isLoadingInviteToken}
						<div class="space-y-2 rounded-lg border border-border bg-muted/50 px-3 py-2.5">
							<Skeleton class="h-3.5 w-3/4" />
							<Skeleton class="h-3 w-1/3" />
						</div>
					{:else if activeToken}
						<div
							class="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2.5"
						>
							<div class="min-w-0 flex-1">
								<p class="truncate font-mono text-xs text-muted-foreground">
									{activeToken.invite_url}
								</p>
								<p class="mt-1 text-xs text-muted-foreground">
									{getExpiryText(activeToken)}
								</p>
							</div>
							<Button
								variant="ghost"
								size="sm"
								onclick={() => copyLink(activeToken.invite_url)}
								class="shrink-0"
							>
								<Copy class="mr-1 h-3.5 w-3.5" />
								Copy
							</Button>
						</div>
						<Button
							variant="outline"
							size="sm"
							class="w-full text-destructive hover:text-destructive"
							onclick={handleDeleteToken}
							disabled={isDeletingToken}
						>
							{#if isDeletingToken}
								<Spinner class="mr-2 h-3.5 w-3.5" />
							{:else}
								<Trash2 class="mr-2 h-3.5 w-3.5" />
							{/if}
							Delete Invite Link
						</Button>
					{:else}
						<Button
							variant="outline"
							class="w-full"
							onclick={handleCreateToken}
							disabled={isCreatingToken}
						>
							{#if isCreatingToken}
								<Spinner class="mr-2 h-3.5 w-3.5" />
							{:else}
								<Plus class="mr-2 h-3.5 w-3.5" />
							{/if}
							Create Invite Link
						</Button>
						<p class="text-xs text-muted-foreground">
							Invite links are valid for 24 hours. Anyone with the link can join this world.
						</p>
					{/if}
				</div>
			{/if}

			<!-- Shared users (private worlds, owner only) -->
			{#if isOwner && isPrivate && sharedWith.length > 0}
				<div class="space-y-2">
					<Label class="text-muted-foreground">People with access ({sharedWith.length})</Label>
					<div class="flex flex-wrap gap-1.5">
						{#each sharedWith as userId (userId)}
							<Badge variant="secondary" class="gap-1 py-1 pr-1 pl-2.5">
								<span class="max-w-[200px] truncate"
									><span class="text-muted-foreground/70">@</span>{getUserDisplayName(userId)}</span
								>
								<button
									onclick={() => confirmRemoveUser(userId)}
									disabled={saving}
									class="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-destructive/20 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
									aria-label="Remove {getUserDisplayName(userId)}"
								>
									<X class="h-3 w-3" />
								</button>
							</Badge>
						{/each}
					</div>
				</div>
			{/if}

			{#if !isOwner}
				<div class="rounded-lg border border-border bg-muted/30 px-4 py-3">
					<p class="text-sm text-muted-foreground">
						Only the owner of this world can manage sharing settings.
					</p>
				</div>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>

<!-- Private visibility confirmation -->
<AlertDialog.Root
	open={showPrivateConfirm}
	onOpenChange={(o) => {
		if (!o) cancelPrivateSwitch();
	}}
>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Switch to private?</AlertDialog.Title>
			<AlertDialog.Description>
				Switching to private will remove access for all users who haven't been explicitly invited.
				This cannot be undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={cancelPrivateSwitch}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action variant="destructive" onclick={confirmPrivateSwitch}>
				Switch to Private
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<!-- User removal confirmation -->
<AlertDialog.Root
	open={userToRemove !== null}
	onOpenChange={(o) => {
		if (!o) userToRemove = null;
	}}
>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Remove access?</AlertDialog.Title>
			<AlertDialog.Description>
				<span class="font-medium">{userToRemove ? getUserDisplayName(userToRemove) : ''}</span> will no
				longer be able to view this world.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action variant="destructive" onclick={executeRemoveUser}>
				Remove
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
