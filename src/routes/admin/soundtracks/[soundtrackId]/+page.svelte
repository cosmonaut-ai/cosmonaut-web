<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		deleteAdminSoundtrack,
		getAdminSoundtrack,
		updateAdminSoundtrack,
		type Soundtrack,
		type SoundtrackContentRating,
		type SoundtrackLoopStrategy,
		type SoundtrackStatus,
		type SoundtrackUpdatePayload
	} from '$lib/api/admin';
	import {
		contentRatingClass,
		formatDateTime,
		formatDuration,
		formatFileSize,
		formatScore,
		soundtrackStatusClass
	} from '$lib/admin/format';
	import { showError, showSuccess } from '$lib/utils/toast';
	import CopyButton from '$lib/components/admin/CopyButton.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Select from '$lib/components/ui/select';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		CheckCircle2,
		ChevronLeft,
		CircleOff,
		ExternalLink,
		RefreshCw,
		RotateCcw,
		Save,
		Trash2,
		XCircle
	} from '@lucide/svelte';

	interface SoundtrackForm {
		status: SoundtrackStatus;
		title: string;
		description: string;
		prompt: string;
		content_rating: SoundtrackContentRating;
		loop_strategy: SoundtrackLoopStrategy;
		duration_seconds: string;
		file_size_bytes: string;
		content_type: string;
		provider_track_id: string;
		generated_at: string;
		quality_score: string;
		curation_notes: string;
	}

	const statusOptions: SoundtrackStatus[] = ['draft', 'active', 'disabled', 'rejected'];
	const contentRatingOptions: SoundtrackContentRating[] = ['child', 'teen', 'adult'];
	const loopStrategyOptions: SoundtrackLoopStrategy[] = ['crossfade', 'fade_restart', 'none'];

	const soundtrackId = $derived(page.params.soundtrackId ?? '');

	let soundtrack = $state<Soundtrack | null>(null);
	let loading = $state(false);
	let error = $state('');
	let actionPending = $state('');
	let savedForm = $state('');
	let deleteDialogOpen = $state(false);
	let requestId = 0;
	let form = $state<SoundtrackForm>({
		status: 'draft',
		title: '',
		description: '',
		prompt: '',
		content_rating: 'adult',
		loop_strategy: 'crossfade',
		duration_seconds: '',
		file_size_bytes: '',
		content_type: '',
		provider_track_id: '',
		generated_at: '',
		quality_score: '',
		curation_notes: ''
	});

	const isMutating = $derived(actionPending !== '');
	const hasUnsavedChanges = $derived(JSON.stringify(form) !== savedForm);
	const canActivate = $derived(Boolean(soundtrack?.audio_url && form.description.trim()));

	$effect(() => {
		if (!soundtrackId) return;
		const currentRequest = ++requestId;
		void loadSoundtrack(soundtrackId, currentRequest, true);
	});

	async function loadSoundtrack(
		targetId = soundtrackId,
		currentRequest = ++requestId,
		clear = false
	) {
		if (!targetId) return;
		if (clear) soundtrack = null;
		loading = true;
		error = '';
		try {
			const fresh = await getAdminSoundtrack(targetId);
			if (currentRequest !== requestId) return;
			soundtrack = fresh;
			resetForm(fresh);
		} catch (caught) {
			if (currentRequest !== requestId) return;
			error = caught instanceof Error ? caught.message : 'Failed to load soundtrack';
		} finally {
			if (currentRequest === requestId) loading = false;
		}
	}

	function resetForm(source = soundtrack) {
		if (!source) return;
		form = {
			status: source.status,
			title: source.title ?? '',
			description: source.description ?? '',
			prompt: source.prompt ?? '',
			content_rating: source.content_rating,
			loop_strategy: source.loop_strategy,
			duration_seconds: source.duration_seconds == null ? '' : String(source.duration_seconds),
			file_size_bytes: source.file_size_bytes == null ? '' : String(source.file_size_bytes),
			content_type: source.content_type ?? '',
			provider_track_id: source.provider_track_id ?? '',
			generated_at: source.generated_at ?? '',
			quality_score: source.quality_score == null ? '' : String(source.quality_score),
			curation_notes: source.curation_notes ?? ''
		};
		savedForm = JSON.stringify(form);
	}

	function nullableText(value: string): string | null {
		const cleaned = value.trim();
		return cleaned ? cleaned : null;
	}

	function optionalNumber(
		value: string,
		label: string,
		options: { integer?: boolean; max?: number } = {}
	): number | null {
		const cleaned = value.trim();
		if (!cleaned) return null;
		const parsed = Number(cleaned);
		if (!Number.isFinite(parsed) || parsed < 0) {
			throw new Error(`${label} must be zero or greater.`);
		}
		if (options.integer && !Number.isInteger(parsed)) {
			throw new Error(`${label} must be a whole number.`);
		}
		if (options.max != null && parsed > options.max) {
			throw new Error(`${label} must be ${options.max} or lower.`);
		}
		return parsed;
	}

	function buildPayload(): SoundtrackUpdatePayload {
		return {
			status: form.status,
			title: nullableText(form.title),
			description: nullableText(form.description),
			prompt: nullableText(form.prompt),
			content_rating: form.content_rating,
			loop_strategy: form.loop_strategy,
			duration_seconds: optionalNumber(form.duration_seconds, 'Duration'),
			file_size_bytes: optionalNumber(form.file_size_bytes, 'File size', { integer: true }),
			content_type: nullableText(form.content_type),
			provider_track_id: nullableText(form.provider_track_id),
			generated_at: nullableText(form.generated_at),
			quality_score: optionalNumber(form.quality_score, 'Quality score', { max: 100 }),
			curation_notes: nullableText(form.curation_notes)
		};
	}

	function loopStrategyLabel(value: SoundtrackLoopStrategy): string {
		if (value === 'fade_restart') return 'Fade restart';
		if (value === 'none') return 'None';
		return 'Crossfade';
	}

	function titleCase(value: string): string {
		return value
			.split('_')
			.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
			.join(' ');
	}

	async function saveSoundtrack() {
		if (!soundtrack?.id || isMutating) return;
		let payload: SoundtrackUpdatePayload;
		try {
			payload = buildPayload();
		} catch (caught) {
			showError('Review form is invalid', caught instanceof Error ? caught.message : undefined);
			return;
		}
		actionPending = 'save';
		try {
			const updated = await updateAdminSoundtrack(soundtrack.id, payload);
			soundtrack = updated;
			resetForm(updated);
			showSuccess('Soundtrack saved');
		} catch (caught) {
			showError('Failed to save soundtrack', caught instanceof Error ? caught.message : undefined);
		} finally {
			actionPending = '';
		}
	}

	async function setStatus(status: SoundtrackStatus) {
		if (!soundtrack?.id || isMutating) return;
		actionPending = `status:${status}`;
		try {
			const updated = await updateAdminSoundtrack(soundtrack.id, { status });
			soundtrack = updated;
			resetForm(updated);
			showSuccess(status === 'active' ? 'Soundtrack activated' : 'Soundtrack updated');
		} catch (caught) {
			showError(
				'Failed to update soundtrack',
				caught instanceof Error ? caught.message : undefined
			);
		} finally {
			actionPending = '';
		}
	}

	async function deleteSoundtrack() {
		if (!soundtrack?.id || isMutating) return;
		actionPending = 'delete';
		try {
			await deleteAdminSoundtrack(soundtrack.id);
			deleteDialogOpen = false;
			showSuccess('Soundtrack deleted');
			await goto('/admin/soundtracks');
		} catch (caught) {
			showError(
				'Failed to delete soundtrack',
				caught instanceof Error ? caught.message : undefined
			);
		} finally {
			actionPending = '';
		}
	}
</script>

<section class="space-y-6">
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<Button href="/admin/soundtracks" variant="ghost" size="sm" class="mb-2 px-0">
				<ChevronLeft class="h-4 w-4" />
				Soundtracks
			</Button>
			<h2 class="text-xl font-semibold text-foreground">Soundtrack Detail</h2>
			<p class="mt-1 flex items-center gap-1 font-mono text-sm break-all text-muted-foreground">
				{soundtrackId}
				<CopyButton
					value={soundtrackId}
					label="Copy soundtrack ID"
					successLabel="Soundtrack ID copied"
					class="h-7 w-7 text-muted-foreground"
				/>
			</p>
		</div>
		<Button
			variant="outline"
			size="sm"
			disabled={loading}
			onclick={() => loadSoundtrack(soundtrackId, ++requestId, false)}
		>
			<RefreshCw class="h-4 w-4" />
			Refresh
		</Button>
	</div>

	{#if error}
		<div
			class="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
		>
			{error}
		</div>
	{:else if loading && !soundtrack}
		<div class="flex h-52 items-center justify-center">
			<Spinner class="h-6 w-6" />
		</div>
	{:else if soundtrack}
		<div class="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
			<div class="min-w-0 space-y-6">
				<Card class="min-w-0">
					<CardHeader>
						<div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
							<div class="min-w-0">
								<CardTitle class="break-words">
									{soundtrack.title || 'Untitled soundtrack'}
								</CardTitle>
								<p
									class="mt-1 flex items-center gap-1 font-mono text-xs break-all text-muted-foreground"
								>
									{soundtrack.id}
									{#if soundtrack.id}
										<CopyButton
											value={soundtrack.id}
											label="Copy soundtrack ID"
											successLabel="Soundtrack ID copied"
											class="h-6 w-6 text-muted-foreground"
										/>
									{/if}
								</p>
							</div>
							<div class="flex flex-wrap gap-2">
								<Badge class={soundtrackStatusClass(soundtrack.status)}>
									{soundtrack.status}
								</Badge>
								<Badge class={contentRatingClass(soundtrack.content_rating)}>
									{soundtrack.content_rating}
								</Badge>
							</div>
						</div>
					</CardHeader>
					<CardContent class="space-y-5">
						<div class="rounded-md border border-border bg-muted/20 p-3">
							{#if soundtrack.audio_url}
								<audio
									controls
									preload="metadata"
									src={soundtrack.audio_url}
									class="w-full"
									aria-label={`Preview ${soundtrack.title || soundtrack.id || 'soundtrack'}`}
								></audio>
							{:else}
								<p class="text-sm text-muted-foreground">No audio asset available.</p>
							{/if}
						</div>

						<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
							<div class="rounded-md border border-border p-3">
								<p class="text-xs text-muted-foreground">Duration</p>
								<p class="mt-1 font-medium text-foreground">
									{formatDuration(soundtrack.duration_seconds)}
								</p>
							</div>
							<div class="rounded-md border border-border p-3">
								<p class="text-xs text-muted-foreground">File size</p>
								<p class="mt-1 font-medium text-foreground">
									{formatFileSize(soundtrack.file_size_bytes)}
								</p>
							</div>
							<div class="rounded-md border border-border p-3">
								<p class="text-xs text-muted-foreground">Quality score</p>
								<p class="mt-1 font-medium text-foreground">
									{formatScore(soundtrack.quality_score)}
								</p>
							</div>
							<div class="rounded-md border border-border p-3">
								<p class="text-xs text-muted-foreground">Loop</p>
								<p class="mt-1 font-medium text-foreground">
									{loopStrategyLabel(soundtrack.loop_strategy)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card class="min-w-0">
					<CardHeader>
						<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<CardTitle>Review Metadata</CardTitle>
							{#if hasUnsavedChanges}
								<Badge class="border-amber-500/30 bg-amber-500/10 text-amber-300">Unsaved</Badge>
							{/if}
						</div>
					</CardHeader>
					<CardContent>
						<form
							class="space-y-5"
							onsubmit={(event) => {
								event.preventDefault();
								void saveSoundtrack();
							}}
						>
							<div class="grid gap-4 lg:grid-cols-2">
								<div class="space-y-2">
									<Label for="soundtrack-title">Title</Label>
									<Input id="soundtrack-title" bind:value={form.title} disabled={isMutating} />
								</div>
								<div class="space-y-2">
									<Label for="quality-score">Quality score</Label>
									<Input
										id="quality-score"
										inputmode="decimal"
										placeholder="0-100"
										bind:value={form.quality_score}
										disabled={isMutating}
									/>
								</div>
							</div>

							<div class="grid gap-4 lg:grid-cols-3">
								<div class="space-y-2">
									<Label for="soundtrack-status">Status</Label>
									<Select.Root
										type="single"
										value={form.status}
										disabled={isMutating}
										onValueChange={(value) => {
											if (value) form.status = value as SoundtrackStatus;
										}}
									>
										<Select.Trigger id="soundtrack-status" class="w-full" disabled={isMutating}>
											<span>{titleCase(form.status)}</span>
										</Select.Trigger>
										<Select.Content>
											{#each statusOptions as option (option)}
												<Select.Item value={option}>{titleCase(option)}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</div>
								<div class="space-y-2">
									<Label for="content-rating">Content rating</Label>
									<Select.Root
										type="single"
										value={form.content_rating}
										disabled={isMutating}
										onValueChange={(value) => {
											if (value) form.content_rating = value as SoundtrackContentRating;
										}}
									>
										<Select.Trigger id="content-rating" class="w-full" disabled={isMutating}>
											<span>{titleCase(form.content_rating)}</span>
										</Select.Trigger>
										<Select.Content>
											{#each contentRatingOptions as option (option)}
												<Select.Item value={option}>{titleCase(option)}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</div>
								<div class="space-y-2">
									<Label for="loop-strategy">Loop strategy</Label>
									<Select.Root
										type="single"
										value={form.loop_strategy}
										disabled={isMutating}
										onValueChange={(value) => {
											if (value) form.loop_strategy = value as SoundtrackLoopStrategy;
										}}
									>
										<Select.Trigger id="loop-strategy" class="w-full" disabled={isMutating}>
											<span>{loopStrategyLabel(form.loop_strategy)}</span>
										</Select.Trigger>
										<Select.Content>
											{#each loopStrategyOptions as option (option)}
												<Select.Item value={option}>{loopStrategyLabel(option)}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</div>
							</div>

							<div class="grid gap-4 lg:grid-cols-3">
								<div class="space-y-2">
									<Label for="duration-seconds">Duration seconds</Label>
									<Input
										id="duration-seconds"
										inputmode="decimal"
										placeholder="180"
										bind:value={form.duration_seconds}
										disabled={isMutating}
									/>
								</div>
								<div class="space-y-2">
									<Label for="file-size-bytes">File size bytes</Label>
									<Input
										id="file-size-bytes"
										inputmode="numeric"
										placeholder="10485760"
										bind:value={form.file_size_bytes}
										disabled={isMutating}
									/>
								</div>
								<div class="space-y-2">
									<Label for="content-type">Content type</Label>
									<Input
										id="content-type"
										placeholder="audio/mpeg"
										bind:value={form.content_type}
										disabled={isMutating}
									/>
								</div>
							</div>

							<div class="grid gap-4 lg:grid-cols-2">
								<div class="space-y-2">
									<Label for="provider-track-id">Provider track ID</Label>
									<Input
										id="provider-track-id"
										bind:value={form.provider_track_id}
										disabled={isMutating}
									/>
								</div>
								<div class="space-y-2">
									<Label for="generated-at">Generated at</Label>
									<Input
										id="generated-at"
										placeholder="2026-05-29T00:00:00Z"
										bind:value={form.generated_at}
										disabled={isMutating}
									/>
								</div>
							</div>

							<div class="space-y-2">
								<Label for="soundtrack-description">Description</Label>
								<Textarea
									id="soundtrack-description"
									bind:value={form.description}
									disabled={isMutating}
									class="min-h-32"
								/>
							</div>

							<div class="space-y-2">
								<Label for="soundtrack-prompt">Prompt</Label>
								<Textarea
									id="soundtrack-prompt"
									bind:value={form.prompt}
									disabled={isMutating}
									class="min-h-52"
								/>
							</div>

							<div class="space-y-2">
								<Label for="curation-notes">Curation notes</Label>
								<Textarea
									id="curation-notes"
									bind:value={form.curation_notes}
									disabled={isMutating}
									class="min-h-28"
								/>
							</div>

							<div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
								<Button
									type="button"
									variant="outline"
									disabled={isMutating || !hasUnsavedChanges}
									onclick={() => resetForm()}
								>
									<RotateCcw class="h-4 w-4" />
									Reset
								</Button>
								<Button type="submit" disabled={isMutating || !hasUnsavedChanges}>
									{#if actionPending === 'save'}
										<Spinner class="h-4 w-4" />
									{:else}
										<Save class="h-4 w-4" />
									{/if}
									Save Review
								</Button>
							</div>
						</form>
					</CardContent>
				</Card>
			</div>

			<div class="min-w-0 space-y-6">
				<Card class="min-w-0 self-start">
					<CardHeader>
						<CardTitle>Review Actions</CardTitle>
					</CardHeader>
					<CardContent class="grid gap-2">
						<Button
							disabled={isMutating || soundtrack.status === 'active' || !canActivate}
							onclick={() => setStatus('active')}
						>
							<CheckCircle2 class="h-4 w-4" />
							Activate
						</Button>
						<Button
							variant="outline"
							disabled={isMutating || soundtrack.status === 'draft'}
							onclick={() => setStatus('draft')}
						>
							Back To Draft
						</Button>
						<Button
							variant="outline"
							disabled={isMutating || soundtrack.status === 'disabled'}
							onclick={() => setStatus('disabled')}
						>
							<CircleOff class="h-4 w-4" />
							Disable
						</Button>
						<Button
							variant="outline"
							disabled={isMutating || soundtrack.status === 'rejected'}
							onclick={() => setStatus('rejected')}
						>
							<XCircle class="h-4 w-4" />
							Reject
						</Button>
						<Button
							variant="destructive"
							disabled={isMutating}
							onclick={() => (deleteDialogOpen = true)}
						>
							<Trash2 class="h-4 w-4" />
							Delete
						</Button>
						{#if !canActivate}
							<div
								class="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200"
							>
								Active soundtracks need an audio asset and description.
							</div>
						{/if}
					</CardContent>
				</Card>

				<Card class="min-w-0">
					<CardHeader>
						<CardTitle>System Metadata</CardTitle>
					</CardHeader>
					<CardContent class="space-y-3 text-sm">
						<div class="flex justify-between gap-3">
							<span class="text-muted-foreground">Created</span>
							<span class="text-right text-foreground">{formatDateTime(soundtrack.created_at)}</span
							>
						</div>
						<div class="flex justify-between gap-3">
							<span class="text-muted-foreground">Updated</span>
							<span class="text-right text-foreground">{formatDateTime(soundtrack.updated_at)}</span
							>
						</div>
						<div class="flex justify-between gap-3">
							<span class="text-muted-foreground">Reviewed</span>
							<span class="text-right text-foreground"
								>{formatDateTime(soundtrack.reviewed_at)}</span
							>
						</div>
						<div class="flex justify-between gap-3">
							<span class="text-muted-foreground">Generated</span>
							<span class="text-right text-foreground"
								>{formatDateTime(soundtrack.generated_at)}</span
							>
						</div>
						<div class="flex justify-between gap-3">
							<span class="text-muted-foreground">Content type</span>
							<span class="text-right text-foreground">{soundtrack.content_type || 'N/A'}</span>
						</div>
						<div class="space-y-1">
							<p class="text-muted-foreground">Provider track</p>
							<div class="flex items-center gap-1">
								<p class="min-w-0 truncate font-mono text-xs text-foreground">
									{soundtrack.provider_track_id || 'N/A'}
								</p>
								{#if soundtrack.provider_track_id}
									<CopyButton
										value={soundtrack.provider_track_id}
										label="Copy provider track ID"
										successLabel="Provider ID copied"
										class="h-6 w-6 text-muted-foreground"
									/>
								{/if}
							</div>
						</div>
						<div class="space-y-1">
							<p class="text-muted-foreground">S3 key</p>
							<p class="font-mono text-xs break-all text-foreground">
								{soundtrack.s3_key || 'N/A'}
							</p>
						</div>
						<div class="space-y-1">
							<p class="text-muted-foreground">Pinecone record</p>
							<p class="font-mono text-xs break-all text-foreground">
								{soundtrack.pinecone_record_id || 'Not indexed'}
							</p>
							<p class="text-xs text-muted-foreground">
								{soundtrack.pinecone_upserted_at
									? `Indexed ${formatDateTime(soundtrack.pinecone_upserted_at)}`
									: 'Draft, disabled, and rejected tracks are not indexed.'}
							</p>
						</div>
						{#if soundtrack.audio_url}
							<Button href={soundtrack.audio_url} variant="outline" size="sm" class="w-full">
								<ExternalLink class="h-4 w-4" />
								Open Audio URL
							</Button>
						{/if}
					</CardContent>
				</Card>
			</div>
		</div>
	{/if}
</section>

<AlertDialog.Root
	open={deleteDialogOpen}
	onOpenChange={(open) => {
		if (!isMutating) deleteDialogOpen = open;
	}}
>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete soundtrack?</AlertDialog.Title>
			<AlertDialog.Description>
				This permanently deletes
				<span class="font-medium text-foreground"
					>{soundtrack?.title || soundtrack?.id || 'this soundtrack'}</span
				>
				from the library. This action cannot be undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={isMutating}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				variant="destructive"
				disabled={isMutating}
				onclick={(event) => {
					event.preventDefault();
					void deleteSoundtrack();
				}}
			>
				{#if actionPending === 'delete'}
					<Spinner class="h-4 w-4" />
				{:else}
					<Trash2 class="h-4 w-4" />
				{/if}
				Delete
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
