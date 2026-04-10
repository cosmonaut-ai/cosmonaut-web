<script lang="ts">
	import type { WorldVisibility } from '$lib/types/api';
	import * as Select from '$lib/components/ui/select';
	import { Globe, Lock, EyeOff } from '@lucide/svelte';

	interface Props {
		value: WorldVisibility;
		onValueChange: (value: WorldVisibility) => void;
		disabled?: boolean;
		showHelp?: boolean;
		id?: string;
	}

	let { value, onValueChange, disabled = false, showHelp = true, id }: Props = $props();
</script>

<Select.Root
	type="single"
	{value}
	onValueChange={(v) => {
		if (v) onValueChange(v as WorldVisibility);
	}}
>
	<Select.Trigger {id} class="w-full" {disabled}>
		<div class="flex items-center gap-2">
			{#if value === 'public'}
				<Globe class="h-4 w-4 text-primary" />
				<span>Public</span>
			{:else if value === 'unlisted'}
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

{#if showHelp}
	<p class="text-xs text-muted-foreground">
		{#if value === 'public'}
			Anyone on the internet can discover and play this world.
		{:else if value === 'unlisted'}
			Anyone with the link can play, but the world won't appear in search or trending.
		{:else}
			Only you and people you invite can access this world.
		{/if}
	</p>
{/if}
