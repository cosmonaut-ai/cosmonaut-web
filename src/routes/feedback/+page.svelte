<script lang="ts">
	import { goto } from '$app/navigation';
	import {
		Card,
		CardContent,
		CardHeader,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Select from '$lib/components/ui/select';
	import SEO from '$lib/components/shared/SEO.svelte';
	import { useFeedback } from '$lib/queries/feedback';
	import { ApiError } from '$lib/api/core';
	import type { FeedbackCategory } from '$lib/api/feedback';
	import {
		MessageSquarePlus,
		Send,
		CheckCircle,
		ArrowLeft,
		Bug,
		Lightbulb,
		MessageCircle,
		HelpCircle
	} from '@lucide/svelte';
	import { Spinner } from '$lib/components/ui/spinner';

	const categoryOptions: { value: FeedbackCategory; label: string; icon: typeof Bug }[] = [
		{ value: 'bug', label: 'Bug Report', icon: Bug },
		{ value: 'feature', label: 'Feature Request', icon: Lightbulb },
		{ value: 'feedback', label: 'General Feedback', icon: MessageCircle },
		{ value: 'other', label: 'Other', icon: HelpCircle }
	];

	let category = $state<FeedbackCategory>('feedback');
	let message = $state('');
	let submitted = $state(false);
	let rateLimited = $state(false);

	const feedbackMutation = useFeedback();
	const MIN_MESSAGE_LENGTH = 10;
	const MAX_MESSAGE_LENGTH = 10_000;
	const messageTooShort = $derived(message.trim().length < MIN_MESSAGE_LENGTH);
	const messageTooLong = $derived(message.length > MAX_MESSAGE_LENGTH);
	const canSubmit = $derived(!messageTooShort && !messageTooLong);
	const isPending = $derived(feedbackMutation.isPending);

	const selectedOption = $derived(
		categoryOptions.find((o) => o.value === category) ?? categoryOptions[2]
	);

	async function handleSubmit() {
		if (!canSubmit || isPending) return;
		rateLimited = false;
		try {
			await feedbackMutation.mutateAsync({ category, message: message.trim() });
			submitted = true;
		} catch (error) {
			if (error instanceof ApiError && error.status === 429) {
				rateLimited = true;
			} else {
				throw error;
			}
		}
	}
</script>

<SEO
	title="Feedback - Cosmonaut"
	description="Share your feedback, report bugs, or suggest features for Cosmonaut."
	path="/feedback"
	noindex
/>

<div class="h-full overflow-y-auto bg-background">
	<main class="mx-auto max-w-2xl px-6 py-12">
		<div class="mb-8">
			<Button variant="ghost" size="sm" onclick={() => goto('/dashboard')} class="mb-4 gap-2">
				<ArrowLeft class="h-4 w-4" />
				Back to Dashboard
			</Button>
			<h1 class="text-3xl font-bold text-foreground">Feedback</h1>
			<p class="mt-1 text-muted-foreground">Share your thoughts and help us improve Cosmonaut</p>
		</div>

		<Card>
			<CardHeader>
				<div class="flex items-center gap-2">
					<MessageSquarePlus class="h-5 w-5 text-primary" />
					<CardTitle>Send Feedback</CardTitle>
				</div>
				<CardDescription>
					Your feedback helps us build a better experience. Report bugs, suggest features, or share
					general thoughts about Cosmonaut.
				</CardDescription>
			</CardHeader>
			<CardContent>
				{#if submitted}
					<div class="flex flex-col items-center gap-4 py-6">
						<div
							class="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 text-primary"
						>
							<CheckCircle class="h-5 w-5 shrink-0" />
							<span class="font-medium">Thank you! Your feedback has been submitted.</span>
						</div>
					</div>
				{:else}
					<form
						onsubmit={(e) => {
							e.preventDefault();
							handleSubmit();
						}}
						class="space-y-4"
					>
						<div class="space-y-2">
							<Label>Category</Label>
							<Select.Root
								type="single"
								value={category}
								onValueChange={(v) => {
									if (v) category = v as FeedbackCategory;
								}}
							>
								<Select.Trigger class="w-full">
									<div class="flex items-center gap-2">
										<selectedOption.icon class="h-4 w-4 text-muted-foreground" />
										<span>{selectedOption.label}</span>
									</div>
								</Select.Trigger>
								<Select.Content>
									{#each categoryOptions as opt (opt.value)}
										<Select.Item value={opt.value}>
											<div class="flex items-center gap-2">
												<opt.icon class="h-4 w-4" />
												<span>{opt.label}</span>
											</div>
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>

						<div class="space-y-2">
							<Label for="message">Message</Label>
							<Textarea
								id="message"
								bind:value={message}
								placeholder="Share your feedback, describe a bug, or suggest a feature..."
								rows={5}
								required
								minlength={MIN_MESSAGE_LENGTH}
								maxlength={MAX_MESSAGE_LENGTH}
								disabled={isPending}
								class="min-h-24"
							/>
							<div class="flex items-start justify-between gap-4">
								<p class="text-xs text-muted-foreground">
									{#if messageTooShort}
										Please provide at least {MIN_MESSAGE_LENGTH} characters
									{:else}
										Minimum {MIN_MESSAGE_LENGTH} characters required
									{/if}
								</p>
								<span
									class="shrink-0 text-xs tabular-nums {messageTooLong
										? 'font-medium text-destructive'
										: 'text-muted-foreground'}"
								>
									{message.length}/{MAX_MESSAGE_LENGTH}
								</span>
							</div>
						</div>

						{#if rateLimited}
							<div
								class="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400"
							>
								Please wait before submitting again.
							</div>
						{/if}

						<Button type="submit" disabled={!canSubmit || isPending} class="gap-2">
							{#if isPending}
								<Spinner class="h-4 w-4" />
								Submitting...
							{:else}
								<Send class="h-4 w-4" />
								Submit Feedback
							{/if}
						</Button>
					</form>
				{/if}
			</CardContent>
		</Card>
	</main>
</div>
