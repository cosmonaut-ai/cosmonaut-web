<script lang="ts">
	import type { World, WorldVisibility } from '$lib/types/api';
	import { useUpdateWorldSharing } from '$lib/queries';
	import { showError, showSuccess } from '$lib/utils/toast';
	import { browser } from '$app/environment';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Share2, X, Plus, Globe, Lock, Link, Copy } from '@lucide/svelte';

	interface Props {
		world: World;
		open: boolean;
		onOpenChange: (open: boolean) => void;
		onWorldUpdate?: (world: World) => void;
	}

	let { world, open, onOpenChange, onWorldUpdate }: Props = $props();

	const worldId = $derived(world.id);

	let visibility = $derived<WorldVisibility>(world.visibility || 'private');
	let sharedWith = $derived<string[]>([...(world.shared_with || [])]);
	let newEmail = $state('');
	let emailTouched = $state(false);

	// Use mutation for updating sharing settings
	const updateMutation = $derived.by(() => useUpdateWorldSharing(worldId));
	const saving = $derived(updateMutation.isPending);
	const hasChanges = $derived.by(() => {
		const currentVisibility = world.visibility || 'private';
		const currentSharedWith = world.shared_with || [];
		return visibility !== currentVisibility || !areEmailListsEqual(sharedWith, currentSharedWith);
	});

	function isValidEmail(email: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}

	// Inline email validation
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

	function addEmail() {
		emailTouched = true;
		const email = newEmail.trim().toLowerCase();
		if (!email) return;

		if (!isValidEmail(email)) {
			return; // Inline error message will display
		}

		if (sharedWith.includes(email)) {
			return; // Inline error message will display
		}

		sharedWith = [...sharedWith, email];
		newEmail = '';
		emailTouched = false;
	}

	function removeEmail(email: string) {
		sharedWith = sharedWith.filter((e) => e !== email);
	}

	function handleSave() {
		updateMutation.mutate(
			{
				visibility,
				shared_with: sharedWith
			},
			{
				onSuccess: (updatedWorld) => {
					onWorldUpdate?.(updatedWorld);
					onOpenChange(false);
				}
			}
		);
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
			showSuccess('Link copied');
		} catch {
			showError('Failed to copy link');
		}
	}
</script>

<Dialog.Root {open} {onOpenChange}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Share2 class="h-5 w-5 text-primary" />
				Share "{world.title || 'Untitled World'}"
			</Dialog.Title>
		</Dialog.Header>

		<div class="space-y-6 py-4">
			<!-- General access -->
			<div class="space-y-3">
				<Label class="text-sm font-medium">General access</Label>
				<Select.Root
					type="single"
					value={visibility}
					onValueChange={(v) => {
						if (v) visibility = v as WorldVisibility;
					}}
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

			<!-- Shared users list -->
			{#if sharedWith.length > 0}
				<div class="space-y-2">
					<Label class="text-muted-foreground">People with access ({sharedWith.length})</Label>
					<div class="max-h-40 space-y-2 overflow-y-auto rounded-lg border border-border p-2">
						{#each sharedWith as email (email)}
							<div
								class="flex items-center justify-between rounded-md bg-secondary/50 px-3 py-2 text-sm"
							>
								<span class="truncate">{email}</span>
								<Button
									variant="ghost"
									size="icon"
									onclick={() => removeEmail(email)}
									disabled={saving}
									class="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
									aria-label="Remove {email}"
								>
									<X class="h-3.5 w-3.5" />
								</Button>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => onOpenChange(false)} disabled={saving}>
				Cancel
			</Button>
			<Button onclick={handleSave} disabled={saving || !hasChanges}>
				{#if saving}
					<Spinner class="mr-2" />
					Saving...
				{:else}
					Save Changes
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
