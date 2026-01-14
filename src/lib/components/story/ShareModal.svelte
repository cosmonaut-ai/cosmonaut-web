<script lang="ts">
	import type { World, WorldVisibility } from '$lib/types/api';
	import { updateWorldSharing } from '$lib/api/client';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Share2, X, Plus, Globe, Lock } from '@lucide/svelte';

	interface Props {
		world: World;
		open: boolean;
		onOpenChange: (open: boolean) => void;
		onWorldUpdate?: (world: World) => void;
	}

	let { world, open, onOpenChange, onWorldUpdate }: Props = $props();

	let visibility = $state<WorldVisibility>('private');
	let sharedWith = $state<string[]>([]);
	let newEmail = $state('');
	let saving = $state(false);
	let error = $state<string | null>(null);

	// Sync state with world prop changes
	$effect(() => {
		visibility = world.visibility || 'private';
		sharedWith = [...(world.shared_with || [])];
	});

	function isValidEmail(email: string): boolean {
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}

	function addEmail() {
		const email = newEmail.trim().toLowerCase();
		if (!email) return;

		if (!isValidEmail(email)) {
			error = 'Please enter a valid email address';
			return;
		}

		if (sharedWith.includes(email)) {
			error = 'This email is already added';
			return;
		}

		sharedWith = [...sharedWith, email];
		newEmail = '';
		error = null;
	}

	function removeEmail(email: string) {
		sharedWith = sharedWith.filter((e) => e !== email);
	}

	async function handleSave() {
		saving = true;
		error = null;

		try {
			const updatedWorld = await updateWorldSharing(world.id, {
				visibility,
				shared_with: sharedWith
			});

			onWorldUpdate?.(updatedWorld);
			onOpenChange(false);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to update sharing settings';
			console.error('Error updating sharing:', err);
		} finally {
			saving = false;
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			addEmail();
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

			<!-- Error message -->
			{#if error}
				<p class="text-sm text-destructive">{error}</p>
			{/if}
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => onOpenChange(false)} disabled={saving}>
				Cancel
			</Button>
			<Button onclick={handleSave} disabled={saving}>
				{saving ? 'Saving...' : 'Save Changes'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
