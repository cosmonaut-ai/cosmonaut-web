<script lang="ts">
	import { goto } from '$app/navigation';
	import type { World } from '$lib/types/api';

	interface Props {
		world: World;
		onDelete: (worldId: string) => Promise<void>;
	}

	let { world, onDelete }: Props = $props();

	let showDeleteConfirm = $state(false);
	let deleting = $state(false);

	function handleClick() {
		if (world.root_node_id) {
			goto(`/worlds/${world.id}`);
		} else {
			goto(`/worlds/${world.id}`);
		}
	}

	async function handleDelete() {
		if (!showDeleteConfirm) {
			showDeleteConfirm = true;
			return;
		}

		try {
			deleting = true;
			await onDelete(world.id);
		} catch (err) {
			console.error('Error deleting world:', err);
		} finally {
			deleting = false;
			showDeleteConfirm = false;
		}
	}

	function handleCancelDelete() {
		showDeleteConfirm = false;
	}

	function getStatusBadge(status: string) {
		switch (status) {
			case 'completed':
				return 'bg-green-100 text-green-700';
			case 'generating_lore':
				return 'bg-yellow-100 text-yellow-700';
			case 'generating_narrator_profile':
				return 'bg-purple-100 text-purple-700';
			case 'generating_start_node':
				return 'bg-blue-100 text-blue-700';
			case 'initialized':
				return 'bg-gray-100 text-gray-600';
			case 'failed':
				return 'bg-red-100 text-red-700';
			default:
				return 'bg-gray-100 text-gray-600';
		}
	}

	function getStatusText(status: string) {
		switch (status) {
			case 'completed':
				return 'Ready';
			case 'generating_lore':
				return 'Generating Lore';
			case 'generating_narrator_profile':
				return 'Creating Narrator';
			case 'generating_start_node':
				return 'Generating Story';
			case 'initialized':
				return 'Initialized';
			case 'failed':
				return 'Failed';
			default:
				return status;
		}
	}
</script>

<div
	class="group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-all hover:border-gray-300 hover:shadow-lg"
	onclick={handleClick}
	role="button"
	tabindex="0"
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick();
		}
	}}
>
	<!-- Image or Gradient Header -->
	{#if world.world_image_url}
		<div class="h-48 w-full overflow-hidden bg-gray-100">
			<img
				src={world.world_image_url}
				alt={world.world_image_alt_text || world.title || 'World image'}
				class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
			/>
		</div>
	{:else}
		<div class="h-48 w-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600"></div>
	{/if}

	<!-- Content -->
	<div class="flex flex-1 flex-col p-5">
		<!-- Title and Status -->
		<div class="mb-3 flex items-start justify-between gap-3">
			<h3 class="flex-1 text-lg leading-tight font-bold text-gray-900">
				{world.title || 'Untitled World'}
			</h3>
			<span
				class={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadge(world.generation_status)}`}
			>
				{getStatusText(world.generation_status)}
			</span>
		</div>

		<!-- Genre Badge -->
		{#if world.genre}
			<div class="mb-3">
				<span
					class="inline-block rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
				>
					{world.genre}
				</span>
			</div>
		{/if}

		<!-- Description -->
		{#if world.description}
			<p class="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-600">
				{world.description}
			</p>
		{:else}
			<p class="mb-4 flex-1 text-sm text-gray-400 italic">No description available</p>
		{/if}

		<!-- Footer -->
		<div class="mt-auto flex items-center justify-between border-t border-gray-100 pt-3">
			<span class="text-xs text-gray-500">
				{new Date(world.created_at).toLocaleDateString()}
			</span>

			{#if showDeleteConfirm}
				<div class="flex gap-2">
					<button
						onclick={(e) => {
							e.stopPropagation();
							handleCancelDelete();
						}}
						disabled={deleting}
						class="rounded bg-gray-200 px-3 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Cancel
					</button>
					<button
						onclick={(e) => {
							e.stopPropagation();
							handleDelete();
						}}
						disabled={deleting}
						class="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{deleting ? 'Deleting...' : 'Confirm'}
					</button>
				</div>
			{:else}
				<button
					onclick={(e) => {
						e.stopPropagation();
						handleDelete();
					}}
					class="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
					aria-label="Delete world"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-4 w-4"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
						/>
					</svg>
				</button>
			{/if}
		</div>
	</div>
</div>
