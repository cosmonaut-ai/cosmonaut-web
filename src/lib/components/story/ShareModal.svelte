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
	import { Share2, X, Plus, Globe, Lock, Link } from '@lucide/svelte';

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

	function areEmailListsEqual(a: string[], b: string[]) {
		if (a.length !== b.length) return false;
		return a.every((value, index) => value === b[index]);
	}

	function addEmail() {
		const email = newEmail.trim().toLowerCase();
		if (!email) return;

		if (!isValidEmail(email)) {
			showError('Please enter a valid email address');
			return;
		}

		if (sharedWith.includes(email)) {
			showError('This email is already added');
			return;
		}

		sharedWith = [...sharedWith, email];
		newEmail = '';
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
				Share World
			</Dialog.Title>
			<Dialog.Description>
				Control who can access "{world.title || 'Untitled World'}"
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-6 py-4">
			<!-- Visibility -->
			<div class="space-y-2">
				<Label>Visibility</Label>
				<Select.Root
					type="single"
					value={visibility}
					onValueChange={(v) => {
						if (v) visibility = v as WorldVisibility;
					}}
				>
					<div class="flex items-center gap-2">
						<Select.Trigger class="flex-1">
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
						<Button
							variant="outline"
							size="icon"
							onclick={copyWorldLink}
							aria-label="Copy world link"
						>
							<Link class="h-4 w-4" />
						</Button>
					</div>
					<Select.Content>
						<Select.Item value="private">
							<div class="flex items-center gap-2">
								<Lock class="h-4 w-4" />
								<div>
									<div class="font-medium">Private</div>
									<div class="text-xs text-muted-foreground">
										Only you and added users can access
									</div>
								</div>
							</div>
						</Select.Item>
						<Select.Item value="public">
							<div class="flex items-center gap-2">
								<Globe class="h-4 w-4" />
								<div>
									<div class="font-medium">Public</div>
									<div class="text-xs text-muted-foreground">Anyone with the link can view</div>
								</div>
							</div>
						</Select.Item>
					</Select.Content>
				</Select.Root>
				<p class="text-xs text-muted-foreground">
					{visibility === 'public'
						? 'Anyone with the link can view'
						: 'Only invited users can view'}
				</p>
			</div>

			<!-- Add users -->
			<div class="space-y-2">
				<Label>Share with specific people</Label>
				<div class="flex gap-2">
					<Input
						type="email"
						placeholder="Enter email address"
						bind:value={newEmail}
						onkeydown={handleKeyDown}
						disabled={saving}
						class="flex-1"
					/>
					<Button
						variant="outline"
						size="icon"
						onclick={addEmail}
						disabled={saving || !newEmail.trim()}
					>
						<Plus class="h-4 w-4" />
					</Button>
				</div>
			</div>

			<!-- Shared users list -->
			{#if sharedWith.length > 0}
				<div class="space-y-2">
					<Label class="text-muted-foreground">Shared with ({sharedWith.length})</Label>
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
									class="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
								>
									<X class="h-3 w-3" />
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
