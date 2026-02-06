<script lang="ts">
	import { goto } from '$app/navigation';
	import { useCreateWorld } from '$lib/queries';
	import type { WorldVisibility } from '$lib/types/api';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Rocket, ArrowLeft, Shuffle } from '@lucide/svelte';

	// Form state
	let worldPrompt = $state('');
	let visibility = $state<WorldVisibility>('private');
	let prompts = $state<string[]>([]);
	let promptsLoaded = $state(false);
	let promptsLoading = $state(false);
	let hasAttemptedSubmit = $state(false);

	// Use mutation for creating world
	const createMutation = useCreateWorld();
	const loading = $derived(createMutation.isPending);

	// Inline validation
	const MAX_PROMPT_LENGTH = 2000;
	const promptTrimmed = $derived(worldPrompt.trim());
	const promptTooLong = $derived(worldPrompt.length > MAX_PROMPT_LENGTH);
	const promptEmpty = $derived(promptTrimmed.length === 0);
	const promptError = $derived.by(() => {
		if (!hasAttemptedSubmit && !promptTooLong) return '';
		if (promptEmpty) return 'A world prompt is required to create your world.';
		if (promptTooLong)
			return `Prompt is too long (${worldPrompt.length}/${MAX_PROMPT_LENGTH} characters).`;
		return '';
	});

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
		hasAttemptedSubmit = true;

		if (promptEmpty || promptTooLong) {
			return;
		}

		createMutation.mutate(
			{
				world_prompt: worldPrompt.trim(),
				visibility
			},
			{
				onSuccess: (world) => {
					// Navigate to the world page (will show generation progress)
					goto(`/worlds/${world.id}`);
				}
			}
		);
	}
</script>

<svelte:head>
	<title>Create World - Cosmonaut</title>
	<meta name="description" content="Create a new interactive story world." />
</svelte:head>

<div class="h-full overflow-y-auto bg-background">
	<!-- Header -->
	<header class="border-b border-border bg-card/50">
		<div class="mx-auto flex max-w-3xl items-center gap-4 px-6 py-4">
			<Button variant="ghost" size="sm" onclick={() => goto('/dashboard')} class="gap-2">
				<ArrowLeft class="h-4 w-4" />
				Back
			</Button>
			<div class="h-4 w-px bg-border"></div>
			<div class="flex items-center gap-2">
				<Rocket class="h-5 w-5 text-primary" />
				<span class="font-semibold text-foreground">Create a New World</span>
			</div>
		</div>
	</header>

	<main class="mx-auto max-w-3xl px-6 py-12">
		<!-- Creation Form -->
		<Card>
			<CardHeader>
				<CardTitle class="text-2xl">Describe Your World</CardTitle>
				<CardDescription>
					Tell us about the story world you want to create. Be as detailed or brief as you like.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					onsubmit={(e) => {
						e.preventDefault();
						handleCreateWorld();
					}}
					class="space-y-6"
				>
					<!-- World Prompt -->
					<div class="space-y-2">
						<div class="flex items-center justify-between">
							<Label for="world_prompt">
								World Prompt <span class="text-destructive">*</span>
							</Label>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								onclick={useRandomPrompt}
								disabled={loading || promptsLoading}
								class="h-8 gap-2 text-xs"
							>
								{#if promptsLoading}
									<Spinner class="h-3 w-3" />
								{:else}
									<Shuffle class="h-3 w-3" />
								{/if}
								Random Prompt
							</Button>
						</div>
						<Textarea
							id="world_prompt"
							bind:value={worldPrompt}
							placeholder="Describe the world you want to create, e.g., 'A cyberpunk city where AI and humans coexist' or 'A medieval kingdom on the brink of war with a dark secret in the royal court'"
							required
							disabled={loading}
							maxlength={MAX_PROMPT_LENGTH}
							aria-invalid={promptError ? 'true' : undefined}
							aria-describedby="prompt-help prompt-error"
							class="min-h-32 resize-none font-mono {promptError
								? 'border-destructive focus-visible:ring-destructive'
								: ''}"
						/>
						<div class="flex items-start justify-between gap-4">
							<div class="flex-1">
								{#if promptError}
									<p id="prompt-error" class="text-xs text-destructive">{promptError}</p>
								{:else}
									<p id="prompt-help" class="text-xs text-muted-foreground">
										Include setting, tone, key characters, or any specific elements you'd like in
										your story.
									</p>
								{/if}
							</div>
							<span
								class="shrink-0 text-xs tabular-nums {promptTooLong
									? 'font-medium text-destructive'
									: 'text-muted-foreground'}"
							>
								{worldPrompt.length}/{MAX_PROMPT_LENGTH}
							</span>
						</div>
					</div>

					<!-- Visibility -->
					<div class="space-y-2">
						<Label for="visibility">Visibility</Label>
						<Select.Root
							type="single"
							value={visibility}
							onValueChange={(v) => {
								if (v) visibility = v as WorldVisibility;
							}}
						>
							<Select.Trigger id="visibility" class="w-full" disabled={loading}>
								{visibility === 'public' ? 'Public' : 'Private'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="private">Private - Only you can access</Select.Item>
								<Select.Item value="public">Public - Anyone with the link can view</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>

					<!-- Actions -->
					<div class="flex gap-4 pt-4">
						<Button
							type="button"
							variant="outline"
							onclick={() => goto('/dashboard')}
							disabled={loading}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={loading || !worldPrompt.trim()} class="flex-1 gap-2">
							{#if loading}
								<Spinner />
								Creating...
							{:else}
								<Rocket class="h-4 w-4" />
								Create World
							{/if}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	</main>
</div>
