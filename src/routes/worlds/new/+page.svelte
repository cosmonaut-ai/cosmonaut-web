<script lang="ts">
	import { goto } from '$app/navigation';
	import { createWorld } from '$lib/api/client';
	import type { WorldVisibility } from '$lib/types/api';
	import { Button } from '$lib/components/ui/button';
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

	let loading = $state(false);
	let error = $state<string | null>(null);

	// Form state
	let worldPrompt = $state('');
	let visibility = $state<WorldVisibility>('private');
	let prompts = $state<string[]>([]);
	let promptsLoaded = $state(false);
	let promptsLoading = $state(false);

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

			// Create the world (kicks off async generation)
			const world = await createWorld({
				world_prompt: worldPrompt.trim(),
				visibility
			});

			// Immediately navigate to the world page
			// The world page will show generation progress if not complete
			goto(`/worlds/${world.id}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create world';
			console.error('Error creating world:', err);
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Create World - Cosmonaut</title>
	<meta name="description" content="Create a new interactive story world." />
</svelte:head>

<div class="min-h-screen bg-background">
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
		{#if error}
			<Card class="mb-6 border-destructive/50 bg-destructive/10">
				<CardContent class="py-4">
					<p class="text-destructive">{error}</p>
				</CardContent>
			</Card>
		{/if}

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
								<Shuffle class="h-3 w-3" />
								Random Prompt
							</Button>
						</div>
						<Textarea
							id="world_prompt"
							bind:value={worldPrompt}
							placeholder="Describe the world you want to create, e.g., 'A cyberpunk city where AI and humans coexist' or 'A medieval kingdom on the brink of war with a dark secret in the royal court'"
							required
							disabled={loading}
							class="min-h-32 resize-none font-mono"
						/>
						<p class="text-xs text-muted-foreground">
							Include setting, tone, key characters, or any specific elements you'd like in your
							story.
						</p>
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
							<Rocket class="h-4 w-4" />
							Create World
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	</main>
</div>
