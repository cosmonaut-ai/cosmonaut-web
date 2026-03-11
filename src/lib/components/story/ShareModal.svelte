<script lang="ts">
	import type { World, WorldVisibility } from '$lib/types/api';
	import { useUpdateWorldSharing } from '$lib/queries';
	import { showError, showSuccess } from '$lib/utils/toast';
	import { browser } from '$app/environment';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Share2, X, Plus, Globe, Lock, Link, Copy, Check } from '@lucide/svelte';
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
	let newEmail = $state('');
	let emailTouched = $state(false);
	let emailToRemove = $state<string | null>(null);
	let justSaved = $state(false);
	let saveTimeout: ReturnType<typeof setTimeout> | undefined;
	let savedTimeout: ReturnType<typeof setTimeout> | undefined;

	// Re-initialize local state when dialog opens
	$effect(() => {
		if (open) {
			visibility = world.visibility || 'private';
			sharedWith = [...(world.shared_with || [])];
			justSaved = false;
			clearTimeout(saveTimeout);
			clearTimeout(savedTimeout);
		}
	});

	const updateMutation = $derived.by(() => useUpdateWorldSharing(worldId));
	const saving = $derived(updateMutation.isPending);

	function isValidEmail(email: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}

	const emailError = $derived.by(() => {
		const trimmed = newEmail.trim();
		if (!emailTouched || !trimmed) return '';
		if (!isValidEmail(trimmed)) return 'Please enter a valid email address.';
		if (sharedWith.includes(trimmed.toLowerCase())) return 'This email is already added.';
		return '';
	});

	function areEmailListsEqual(a: string[], b: string[]) {
		if (a.length !== b.length) return false;
		return a.every((value, index) => value === b[index]);
	}

	function hasUnsavedChanges(): boolean {
		const currentVisibility = world.visibility || 'private';
		const currentSharedWith = world.shared_with || [];
		return visibility !== currentVisibility || !areEmailListsEqual(sharedWith, currentSharedWith);
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

	function addEmail() {
		emailTouched = true;
		const email = newEmail.trim().toLowerCase();
		if (!email) return;
		if (!isValidEmail(email)) return;
		if (sharedWith.includes(email)) return;

		sharedWith = [...sharedWith, email];
		newEmail = '';
		emailTouched = false;
		scheduleSave();
	}

	function confirmRemove(email: string) {
		emailToRemove = email;
	}

	function executeRemove() {
		if (!emailToRemove) return;
		sharedWith = sharedWith.filter((e) => e !== emailToRemove);
		emailToRemove = null;
		scheduleSave();
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addEmail();
		}
	}

	function getWorldLink() {
		if (!browser) return '';
		return `${window.location.origin}/worlds/${world.id}`;
	}

	async function copyWorldLink() {
		const link = getWorldLink();
		if (!link) {
			showError('Link not available');
			return;
		}

		try {
			if (!navigator.clipboard?.writeText) {
				throw new Error('Clipboard unavailable');
			}
			await navigator.clipboard.writeText(link);
			trackEvent('share_link_copied');
			showSuccess('Link copied');
		} catch {
			showError('Failed to copy link');
		}
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
			<!-- General access -->
			<div class="space-y-3">
				<Label class="text-sm font-medium">General access</Label>
				<Select.Root
					type="single"
					value={visibility}
					onValueChange={(v) => {
						if (v && isOwner) {
							visibility = v as WorldVisibility;
							scheduleSave();
						}
					}}
					disabled={!isOwner}
				>
					<Select.Trigger class="w-full">
						<div class="flex items-center gap-2">
							{#if visibility === 'public'}
								<Globe class="h-4 w-4 text-primary" />
								<span>Public</span>
							{:else}
								<Lock class="h-4 w-4 text-muted-foreground" />
								<span>Private</span>
							{/if}
						</div>
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="private">
							<div class="flex items-center gap-2">
								<Lock class="h-4 w-4" />
								<div>
									<div class="font-medium">Private</div>
									<div class="text-xs text-muted-foreground">
										Only you and people you invite can access
									</div>
								</div>
							</div>
						</Select.Item>
						<Select.Item value="public">
							<div class="flex items-center gap-2">
								<Globe class="h-4 w-4" />
								<div>
									<div class="font-medium">Public</div>
									<div class="text-xs text-muted-foreground">
										Anyone on the internet with the link can view
									</div>
								</div>
							</div>
						</Select.Item>
					</Select.Content>
				</Select.Root>
				<p class="text-xs text-muted-foreground">
					{#if visibility === 'public'}
						Anyone on the internet with the link can view this world. People you invite can also
						view it.
					{:else}
						Only you and people you invite below can access this world.
					{/if}
				</p>
			</div>

			<!-- Copy link -->
			<button
				onclick={copyWorldLink}
				class="flex w-full items-center gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-left transition-colors hover:bg-muted"
			>
				<div
					class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full {visibility ===
					'public'
						? 'bg-primary/15 text-primary'
						: 'bg-muted-foreground/15 text-muted-foreground'}"
				>
					<Link class="h-4 w-4" />
				</div>
				<div class="min-w-0 flex-1">
					<p class="truncate text-sm font-medium text-foreground">Copy link</p>
					<p class="truncate text-xs text-muted-foreground">
						{#if visibility === 'public'}
							Anyone with this link can view
						{:else}
							Only people with access can open
						{/if}
					</p>
				</div>
				<Copy class="h-4 w-4 shrink-0 text-muted-foreground" />
			</button>

			{#if isOwner}
				<!-- Add people -->
				<div class="space-y-2">
					<Label>Invite others</Label>
					<div class="flex gap-2">
						<Input
							type="email"
							placeholder="Enter email address"
							bind:value={newEmail}
							onkeydown={handleKeyDown}
							oninput={() => {
								emailTouched = true;
							}}
							disabled={saving}
							aria-invalid={emailError ? 'true' : undefined}
							aria-describedby={emailError ? 'email-error' : undefined}
							class="flex-1 {emailError ? 'border-destructive focus-visible:ring-destructive' : ''}"
						/>
						<Button
							variant="outline"
							size="icon"
							onclick={addEmail}
							disabled={saving || !newEmail.trim()}
							aria-label="Add email"
						>
							<Plus class="h-4 w-4" />
						</Button>
					</div>
					{#if emailError}
						<p id="email-error" class="text-xs text-destructive">{emailError}</p>
					{/if}
				</div>
			{:else}
				<div class="rounded-lg border border-border bg-muted/30 px-4 py-3">
					<p class="text-sm text-muted-foreground">
						Only the owner of this world can invite others by email. You can still share the link
						above if the world is public.
					</p>
				</div>
			{/if}

			<!-- Shared users as badges -->
			{#if isOwner && sharedWith.length > 0}
				<div class="space-y-2">
					<Label class="text-muted-foreground">People with access ({sharedWith.length})</Label>
					<div class="flex flex-wrap gap-1.5">
						{#each sharedWith as email (email)}
							<Badge variant="secondary" class="gap-1 py-1 pr-1 pl-2.5">
								<span class="max-w-[200px] truncate">{email}</span>
								<button
									onclick={() => confirmRemove(email)}
									disabled={saving}
									class="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-destructive/20 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
									aria-label="Remove {email}"
								>
									<X class="h-3 w-3" />
								</button>
							</Badge>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>

<!-- Removal confirmation -->
<AlertDialog.Root
	open={emailToRemove !== null}
	onOpenChange={(o) => {
		if (!o) emailToRemove = null;
	}}
>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Remove access?</AlertDialog.Title>
			<AlertDialog.Description>
				<span class="font-medium">{emailToRemove}</span> will no longer be able to view this world.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				class="bg-destructive text-white hover:bg-destructive/90"
				onclick={executeRemove}
			>
				Remove
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
