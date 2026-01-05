<script lang="ts">
	import { goto } from '$app/navigation';
	import { createWorld, pollWorldCompletion } from '$lib/api/client';
	import type { World, GenerationStatus } from '$lib/types/api';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	let loading = $state(false);
	let error = $state<string | null>(null);
	let world = $state<World | null>(null);
	let generationStatus = $state<GenerationStatus | null>(null);

	// Form state
	let worldPrompt = $state('');
	let narratorProfile = $state('');
	let nodeTextLength = $state<number | undefined>(300);
	let visibility = $state('private');
	let prompts = $state<string[]>([]);
	let promptsLoaded = $state(false);
	let promptsLoading = $state(false);

	// Whether we're in the generation phase (polling for completion)
	let isGenerating = $state(false);

	// Status steps for the progress display
	const generationStatuses: GenerationStatus[] = [
		'initialized',
		'generating_lore',
		'generating_narrator_profile',
		'generating_start_node',
		'completed'
	];

	function getStatusMessage(status: GenerationStatus): string {
		switch (status) {
			case 'initialized':
				return 'Initializing world...';
			case 'generating_lore':
				return 'Generating world lore and setting...';
			case 'generating_narrator_profile':
				return 'Creating narrative voice...';
			case 'generating_start_node':
				return 'Writing the opening scene...';
			case 'completed':
				return 'World created successfully!';
			case 'failed':
				return 'World generation failed';
			default:
				return 'Processing...';
		}
	}

	function getStatusProgress(status: GenerationStatus): number {
		switch (status) {
			case 'initialized':
				return 10;
			case 'generating_lore':
				return 35;
			case 'generating_narrator_profile':
				return 55;
			case 'generating_start_node':
				return 80;
			case 'completed':
				return 100;
			case 'failed':
				return 100;
			default:
				return 0;
		}
	}

	function getRandomPrompt(list: string[]): string | null {
		if (!list.length) return null;
		const index = Math.floor(Math.random() * list.length);
		return list[index] ?? null;
	}

	async function loadPrompts(): Promise<string[]> {
		if (promptsLoaded || promptsLoading) return prompts;

		promptsLoading = true;

		try {
			const response = await fetch('/story-prompts.txt');

			if (!response.ok) {
				throw new Error(`Failed to load prompts (${response.status})`);
			}

			const text = await response.text();
			prompts = text
				.split('\n')
				.map((line) => line.trim())
				.filter(Boolean);

			promptsLoaded = true;
		} catch (err) {
			console.error('Error loading prompts:', err);
		} finally {
			promptsLoading = false;
		}

		return prompts;
	}

	async function useRandomPrompt() {
		if (loading || promptsLoading) return;

		const list = promptsLoaded ? prompts : await loadPrompts();
		if (!list?.length) return;

		const prompt = getRandomPrompt(list);
		if (prompt) {
			worldPrompt = prompt;
		}
	}

	async function handleCreateWorld() {
		if (!worldPrompt.trim()) {
			error = 'World prompt is required';
			return;
		}

		try {
			loading = true;
			error = null;
			isGenerating = false;

			// Create the world (kicks off async generation)
			world = await createWorld({
				world_prompt: worldPrompt.trim(),
				narrator_profile: narratorProfile.trim() || undefined,
				node_text_length: nodeTextLength || undefined,
				visibility: visibility || undefined
			});

			// Start polling for completion
			isGenerating = true;
			generationStatus = world.generation_status;

			// Poll until completion
			const completedWorld = await pollWorldCompletion(world.id, (status) => {
				generationStatus = status as GenerationStatus;
			});

			world = completedWorld;

			// Navigate to the world once complete
			if (completedWorld.root_node_id) {
				goto(`/worlds/${completedWorld.id}`);
			} else {
				error = 'World creation completed but no story was generated. Please try again.';
				isGenerating = false;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create world';
			console.error('Error creating world:', err);
			isGenerating = false;
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen bg-gray-50">
	<div class="mx-auto max-w-3xl px-4 py-8">
		<header class="mb-8">
			<h1 class="mb-2 text-4xl font-bold text-gray-900">Create a New World</h1>
			<p class="text-gray-600">Build your interactive story universe</p>
		</header>

		{#if error}
			<div class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
				<p class="text-red-800">{error}</p>
			</div>
		{/if}

		{#if isGenerating && generationStatus}
			<!-- Generation Progress View -->
			<div class="rounded-lg bg-white p-8 shadow-md">
				<div class="flex flex-col items-center">
					<LoadingSpinner size="lg" />

					<h2 class="mt-6 text-xl font-semibold text-gray-900">Creating Your World</h2>
					<p class="mt-2 text-gray-600">{getStatusMessage(generationStatus)}</p>

					<!-- Progress Bar -->
					<div class="mt-6 w-full max-w-md">
						<div class="h-2 w-full overflow-hidden rounded-full bg-gray-200">
							<div
								class="h-full rounded-full bg-blue-600 transition-all duration-500"
								style="width: {getStatusProgress(generationStatus)}%"
							></div>
						</div>
						<div class="mt-2 flex justify-between text-xs text-gray-500">
							<span>Starting</span>
							<span>Complete</span>
						</div>
					</div>

					<!-- Status Steps -->
					<div class="mt-8 w-full max-w-md space-y-3">
						{#each generationStatuses as status (status)}
							{@const isActive = status === generationStatus}
							{@const isComplete =
								getStatusProgress(generationStatus) > getStatusProgress(status) ||
								generationStatus === 'completed'}
							<div
								class="flex items-center gap-3 rounded-lg p-2 {isActive
									? 'bg-blue-50'
									: ''} transition-colors"
							>
								<div
									class="flex h-6 w-6 items-center justify-center rounded-full {isComplete
										? 'bg-green-500'
										: isActive
											? 'bg-blue-500'
											: 'bg-gray-300'} text-white"
								>
									{#if isComplete}
										<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
									{:else if isActive}
										<div class="h-2 w-2 animate-pulse rounded-full bg-white"></div>
									{:else}
										<div class="h-2 w-2 rounded-full bg-gray-400"></div>
									{/if}
								</div>
								<span
									class="text-sm {isActive
										? 'font-medium text-blue-900'
										: isComplete
											? 'text-green-700'
											: 'text-gray-500'}"
								>
									{getStatusMessage(status)}
								</span>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{:else}
			<!-- Creation Form -->
			<div class="rounded-lg bg-white p-6 shadow-md">
				<h2 class="mb-4 text-2xl font-semibold">Describe Your World</h2>
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleCreateWorld();
					}}
					class="space-y-4"
				>
					<div>
						<div class="mb-1 flex items-center justify-between gap-2">
							<label for="world_prompt" class="block text-sm font-medium text-gray-700">
								World Prompt <span class="text-red-500">*</span>
							</label>
							<button
								type="button"
								onclick={useRandomPrompt}
								disabled={loading || promptsLoading}
								class="flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-700 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
								title="Use a random story prompt"
								aria-label="Use a random story prompt"
							>
								{#if promptsLoading}
									<LoadingSpinner size="sm" />
								{:else}
									<svg class="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
										<rect
											x="4"
											y="4"
											width="16"
											height="16"
											rx="2"
											ry="2"
											fill="none"
											stroke="currentColor"
											stroke-width="1.5"
										/>
										<circle cx="9" cy="9" r="1.25" fill="currentColor" />
										<circle cx="15" cy="9" r="1.25" fill="currentColor" />
										<circle cx="9" cy="15" r="1.25" fill="currentColor" />
										<circle cx="15" cy="15" r="1.25" fill="currentColor" />
										<circle cx="12" cy="12" r="1.25" fill="currentColor" />
									</svg>
								{/if}
								<span class="sr-only">Use a random story prompt</span>
							</button>
						</div>
						<textarea
							id="world_prompt"
							bind:value={worldPrompt}
							placeholder="Describe the world you want to create, e.g., 'A cyberpunk city where AI and humans coexist'"
							required
							disabled={loading}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:opacity-50"
							rows="4"
						></textarea>
					</div>

					<div>
						<label for="narrator_profile" class="mb-1 block text-sm font-medium text-gray-700">
							Narrator Profile (optional)
						</label>
						<input
							id="narrator_profile"
							type="text"
							bind:value={narratorProfile}
							placeholder="e.g., 'gritty and noir', 'mysterious and atmospheric'"
							disabled={loading}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:opacity-50"
						/>
					</div>

					<div>
						<label for="node_text_length" class="mb-1 block text-sm font-medium text-gray-700">
							Story Segment Length (optional)
						</label>
						<input
							id="node_text_length"
							type="number"
							bind:value={nodeTextLength}
							min="100"
							max="1000"
							disabled={loading}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:opacity-50"
						/>
						<p class="mt-1 text-xs text-gray-500">
							Approximate word count for each story segment (100-1000)
						</p>
					</div>

					<div>
						<label for="visibility" class="mb-1 block text-sm font-medium text-gray-700">
							Visibility
						</label>
						<select
							id="visibility"
							bind:value={visibility}
							disabled={loading}
							class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:opacity-50"
						>
							<option value="private">Private</option>
							<option value="public">Public</option>
						</select>
					</div>

					<div class="flex gap-4 pt-4">
						<button
							type="button"
							onclick={() => goto('/')}
							disabled={loading}
							class="rounded-lg border border-gray-300 px-6 py-2 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading}
							class="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#if loading}
								<LoadingSpinner size="sm" />
							{/if}
							Create World
						</button>
					</div>
				</form>
			</div>
		{/if}
	</div>
</div>
