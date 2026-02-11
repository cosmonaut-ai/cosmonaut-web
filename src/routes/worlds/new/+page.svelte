<script lang="ts">
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { useCreateWorld, useUsage } from '$lib/queries';
	import type { WorldVisibility, WorldLength } from '$lib/types/api';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Tooltip, TooltipContent, TooltipTrigger } from '$lib/components/ui/tooltip';
	import * as Select from '$lib/components/ui/select';
	import { Rocket, ArrowLeft, Shuffle, AlertTriangle, Info } from '@lucide/svelte';
	import SEO from '$lib/components/SEO.svelte';

	// ── localStorage helpers ────────────────────────────────────────────
	const STORAGE_KEY_LENGTH = 'cosmonaut-world-length';
	const STORAGE_KEY_FAMILY = 'cosmonaut-family-friendly';

	function getStoredWorldLength(): WorldLength {
		if (!browser) return 'medium';
		try {
			const stored = localStorage.getItem(STORAGE_KEY_LENGTH);
			if (stored === 'short' || stored === 'medium' || stored === 'long') return stored;
		} catch {
			// localStorage might not be available
		}
		return 'medium';
	}

	function getStoredFamilyFriendly(): boolean {
		if (!browser) return false;
		try {
			return localStorage.getItem(STORAGE_KEY_FAMILY) === 'true';
		} catch {
			// localStorage might not be available
		}
		return false;
	}

	// ── World length metadata ───────────────────────────────────────────
	const WORLD_LENGTH_OPTIONS: { value: WorldLength; label: string; description: string }[] = [
		{ value: 'short', label: 'Short', description: '~5 min read' },
		{ value: 'medium', label: 'Medium', description: '~10 min read' },
		{ value: 'long', label: 'Long', description: '~20 min read' }
	];

	function formatResetDate(dateStr: string | null): string {
		if (!dateStr) return '';
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = date.getTime() - now.getTime();
		const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

		if (diffDays <= 0) return 'Resets soon.';
		if (diffDays === 1) return 'Resets tomorrow.';
		if (diffDays <= 7) return `Resets in ${diffDays} days.`;

		return `Resets ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`;
	}

	// Form state
	let worldPrompt = $state('');
	let visibility = $state<WorldVisibility>('private');
	let worldLength = $state<WorldLength>(getStoredWorldLength());
	let familyFriendly = $state<boolean>(getStoredFamilyFriendly());
	let prompts = $state<string[]>([]);
	let promptsLoaded = $state(false);
	let promptsLoading = $state(false);
	let hasAttemptedSubmit = $state(false);

	// Persist preferences to localStorage
	$effect(() => {
		if (!browser) return;
		try {
			localStorage.setItem(STORAGE_KEY_LENGTH, worldLength);
		} catch {
			// localStorage might not be available
		}
	});

	$effect(() => {
		if (!browser) return;
		try {
			localStorage.setItem(STORAGE_KEY_FAMILY, String(familyFriendly));
		} catch {
			// localStorage might not be available
		}
	});

	const selectedLengthOption = $derived(
		WORLD_LENGTH_OPTIONS.find((o) => o.value === worldLength) ?? WORLD_LENGTH_OPTIONS[1]
	);

	// Use mutation for creating world
	const createMutation = useCreateWorld();
	const loading = $derived(createMutation.isPending);

	// Quota check
	const usageQuery = useUsage();
	const usage = $derived(usageQuery.data);
	const isAtStorageLimit = $derived(
		usage ? usage.worlds_stored >= usage.worlds_stored_limit : false
	);
	const isAtPeriodLimit = $derived(usage ? usage.worlds_created >= usage.worlds_limit : false);
	const isAtWorldLimit = $derived(isAtStorageLimit || isAtPeriodLimit);

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
				visibility,
				world_length: worldLength,
				family_friendly: familyFriendly
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

<SEO
	title="Create World - Cosmonaut"
	description="Create a new interactive story world."
	path="/worlds/new"
	noindex
/>

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
		{#if isAtStorageLimit}
			<Alert class="mb-6 border-destructive/50 bg-destructive/10">
				<AlertTriangle class="h-4 w-4 text-destructive" />
				<AlertDescription>
					<p>
						You've reached your saved worlds limit ({usage?.worlds_stored}/{usage?.worlds_stored_limit}).
						Delete an existing world or
						<a href="/pricing" class="text-yellow-400 underline hover:text-yellow-300">
							upgrade your plan
						</a>
						to create more.
					</p>
				</AlertDescription>
			</Alert>
		{:else if isAtPeriodLimit}
			<Alert class="mb-6 border-destructive/50 bg-destructive/10">
				<AlertTriangle class="h-4 w-4 text-destructive" />
				<AlertDescription>
					<p>
						You've reached your world creation limit ({usage?.worlds_created}/{usage?.worlds_limit}).
						<a href="/pricing" class="text-yellow-400 underline hover:text-yellow-300">
							Upgrade your plan
						</a>
						for more worlds, or wait for your usage period to reset.
						{#if usage?.period_end}
							<span class="text-muted-foreground">
								{formatResetDate(usage.period_end)}
							</span>
						{/if}
					</p>
				</AlertDescription>
			</Alert>
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

					<!-- Story Length -->
					<div class="space-y-2">
						<Label>Story Length</Label>
						<div
							class="inline-flex w-full rounded-lg border border-border bg-muted/50 p-1"
							role="radiogroup"
							aria-label="Story length"
						>
							{#each WORLD_LENGTH_OPTIONS as option (option.value)}
								<button
									type="button"
									role="radio"
									aria-checked={worldLength === option.value}
									disabled={loading}
									onclick={() => (worldLength = option.value)}
									class="flex-1 rounded-md px-3 py-2 text-center text-sm font-medium transition-all
										{worldLength === option.value
										? 'bg-background text-foreground shadow-sm'
										: 'text-muted-foreground hover:text-foreground'}"
								>
									{option.label}
								</button>
							{/each}
						</div>
						<p class="text-xs text-muted-foreground">
							{selectedLengthOption.label} stories are approximately a {selectedLengthOption.description}.
						</p>
					</div>

					<!-- Family Friendly -->
					<div class="flex items-center justify-between rounded-lg border border-border p-4">
						<div class="flex items-center gap-2">
							<Label for="family_friendly" class="cursor-pointer text-sm font-medium">
								Family Friendly
							</Label>
							<Tooltip>
								<TooltipTrigger
									type="button"
									class="inline-flex text-muted-foreground transition-colors hover:text-foreground"
									aria-label="What does family friendly mean?"
								>
									<Info class="h-4 w-4" />
								</TooltipTrigger>
								<TooltipContent class="max-w-xs">
									When enabled, all content will be child-safe: no graphic violence, profanity, or
									horror. Uses approachable vocabulary and an encouraging tone.
								</TooltipContent>
							</Tooltip>
						</div>
						<Switch
							id="family_friendly"
							checked={familyFriendly}
							onCheckedChange={(v) => (familyFriendly = v)}
							disabled={loading}
						/>
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
						<Button
							type="submit"
							disabled={loading || !worldPrompt.trim() || isAtWorldLimit}
							class="flex-1 gap-2"
						>
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
