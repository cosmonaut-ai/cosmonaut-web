<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		deleteAdminSoundtrack,
		listAdminSoundtracks,
		updateAdminSoundtrack,
		type Soundtrack,
		type SoundtrackStatus
	} from '$lib/api/admin';
	import {
		contentRatingClass,
		formatDateTime,
		formatDuration,
		formatFileSize,
		shortId,
		soundtrackStatusClass
	} from '$lib/admin/format';
	import { routeWithQuery } from '$lib/admin/url';
	import { showError, showSuccess } from '$lib/utils/toast';
	import CopyButton from '$lib/components/admin/CopyButton.svelte';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Input } from '$lib/components/ui/input';
	import { Spinner } from '$lib/components/ui/spinner';
	import {
		CheckCircle2,
		ChevronDown,
		CircleOff,
		ExternalLink,
		MoreHorizontal,
		RefreshCw,
		RotateCcw,
		Search,
		Trash2,
		XCircle
	} from '@lucide/svelte';

	const statusOptions: Array<{ value: SoundtrackStatus | 'all'; label: string }> = [
		{ value: 'draft', label: 'Drafts' },
		{ value: 'active', label: 'Active' },
		{ value: 'disabled', label: 'Disabled' },
		{ value: 'rejected', label: 'Rejected' },
		{ value: 'all', label: 'All' }
	];

	const cursorParam = $derived(page.url.searchParams.get('cursor'));
	const selectedStatus = $derived(normalizeStatus(page.url.searchParams.get('status')));

	let soundtracks = $state<Soundtrack[]>([]);
	let nextCursor = $state<string | null>(null);
	let loading = $state(false);
	let error = $state('');
	let actionPending = $state('');
	let lookupId = $state('');
	let soundtrackPendingDelete = $state<Soundtrack | null>(null);
	let selectedSoundtrackIds = $state<string[]>([]);
	let batchDeleteDialogOpen = $state(false);
	let requestId = 0;

	const isMutating = $derived(actionPending !== '');
	const visibleSelectableIds = $derived(
		soundtracks.flatMap((soundtrack) => (soundtrack.id ? [soundtrack.id] : []))
	);
	const selectedSoundtracks = $derived(
		soundtracks.filter(
			(soundtrack) => soundtrack.id && selectedSoundtrackIds.includes(soundtrack.id)
		)
	);
	const selectedCount = $derived(selectedSoundtracks.length);
	const allVisibleSelected = $derived(
		visibleSelectableIds.length > 0 &&
			visibleSelectableIds.every((id) => selectedSoundtrackIds.includes(id))
	);
	const someVisibleSelected = $derived(
		visibleSelectableIds.some((id) => selectedSoundtrackIds.includes(id)) && !allVisibleSelected
	);
	const canActivateSelection = $derived(
		selectedSoundtracks.length > 0 &&
			selectedSoundtracks.every((soundtrack) => canActivate(soundtrack))
	);

	$effect(() => {
		const currentRequest = ++requestId;
		void loadSoundtracks(selectedStatus, cursorParam, currentRequest);
	});

	function normalizeStatus(value: string | null): SoundtrackStatus | null {
		if (value === 'all') return null;
		if (value === 'active' || value === 'disabled' || value === 'rejected') return value;
		return 'draft';
	}

	function statusRoute(value: SoundtrackStatus | 'all'): string {
		return routeWithQuery(page.url, {
			status: value,
			cursor: null
		});
	}

	async function loadSoundtracks(
		status: SoundtrackStatus | null,
		cursor: string | null,
		currentRequest = ++requestId
	) {
		loading = true;
		error = '';
		try {
			const response = await listAdminSoundtracks({
				status,
				cursor,
				limit: 100
			});
			if (currentRequest !== requestId) return;
			soundtracks = response.items;
			nextCursor = response.next_cursor;
			selectedSoundtrackIds = [];
		} catch (caught) {
			if (currentRequest !== requestId) return;
			error = caught instanceof Error ? caught.message : 'Failed to load soundtracks';
		} finally {
			if (currentRequest === requestId) loading = false;
		}
	}

	function refreshSoundtracks() {
		void loadSoundtracks(selectedStatus, cursorParam);
	}

	function goToFirstPage() {
		goto(routeWithQuery(page.url, { cursor: null }), { replaceState: false });
	}

	function goToNextPage() {
		if (!nextCursor) return;
		goto(routeWithQuery(page.url, { cursor: nextCursor }), { replaceState: false });
	}

	function openLookup() {
		const cleaned = lookupId.trim();
		if (!cleaned) return;
		goto(`/admin/soundtracks/${cleaned}`);
	}

	function replaceOrRemove(updated: Soundtrack) {
		if (!updated.id) return;
		if (selectedStatus && updated.status !== selectedStatus) {
			soundtracks = soundtracks.filter((item) => item.id !== updated.id);
			return;
		}
		soundtracks = soundtracks.map((item) => (item.id === updated.id ? updated : item));
	}

	function canActivate(soundtrack: Soundtrack): boolean {
		return Boolean(soundtrack.id && soundtrack.audio_url && soundtrack.description?.trim());
	}

	function statusActionLabel(status: SoundtrackStatus): string {
		if (status === 'active') return 'Activate';
		if (status === 'disabled') return 'Disable';
		if (status === 'rejected') return 'Reject';
		return 'Back to draft';
	}

	function toggleSoundtrackSelection(soundtrackId: string | null, checked: boolean) {
		if (!soundtrackId) return;
		if (checked) {
			if (!selectedSoundtrackIds.includes(soundtrackId)) {
				selectedSoundtrackIds = [...selectedSoundtrackIds, soundtrackId];
			}
			return;
		}
		selectedSoundtrackIds = selectedSoundtrackIds.filter((id) => id !== soundtrackId);
	}

	function selectAllVisible() {
		selectedSoundtrackIds = visibleSelectableIds;
	}

	function clearSelection() {
		selectedSoundtrackIds = [];
	}

	function openAudio(soundtrack: Soundtrack) {
		if (!soundtrack.audio_url) return;
		window.open(soundtrack.audio_url, '_blank', 'noopener,noreferrer');
	}

	async function setSoundtrackStatus(soundtrack: Soundtrack, status: SoundtrackStatus) {
		if (!soundtrack.id || isMutating) return;
		actionPending = `${status}:${soundtrack.id}`;
		try {
			const updated = await updateAdminSoundtrack(soundtrack.id, { status });
			replaceOrRemove(updated);
			if (updated.id) {
				selectedSoundtrackIds = selectedSoundtrackIds.filter((id) => id !== updated.id);
			}
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

	async function setSelectedSoundtrackStatus(status: SoundtrackStatus) {
		if (selectedCount === 0 || isMutating) return;
		if (status === 'active' && !canActivateSelection) {
			showError(
				'Some selected tracks cannot be activated',
				'Active soundtracks need audio and a description.'
			);
			return;
		}

		const ids = [...selectedSoundtrackIds];
		actionPending = `batch:${status}`;
		try {
			const results = await Promise.allSettled(
				ids.map((id) => updateAdminSoundtrack(id, { status }))
			);
			const updates = results
				.filter(
					(result): result is PromiseFulfilledResult<Soundtrack> => result.status === 'fulfilled'
				)
				.map((result) => result.value);
			const successfulIds = updates.flatMap((updated) => (updated.id ? [updated.id] : []));

			for (const updated of updates) {
				replaceOrRemove(updated);
			}
			selectedSoundtrackIds = selectedSoundtrackIds.filter((id) => !successfulIds.includes(id));

			const failedCount = results.length - updates.length;
			if (failedCount > 0) {
				showError(
					'Some soundtrack updates failed',
					`${updates.length} updated, ${failedCount} failed.`
				);
				return;
			}
			showSuccess(
				`${updates.length} soundtrack${updates.length === 1 ? '' : 's'} ${status === 'active' ? 'activated' : 'updated'}`
			);
		} finally {
			actionPending = '';
		}
	}

	function requestDeleteSoundtrack(soundtrack: Soundtrack) {
		if (!soundtrack.id || isMutating) return;
		soundtrackPendingDelete = soundtrack;
	}

	async function deleteSoundtrack(soundtrack: Soundtrack | null) {
		if (!soundtrack?.id || isMutating) return;
		actionPending = `delete:${soundtrack.id}`;
		try {
			await deleteAdminSoundtrack(soundtrack.id);
			soundtracks = soundtracks.filter((item) => item.id !== soundtrack.id);
			selectedSoundtrackIds = selectedSoundtrackIds.filter((id) => id !== soundtrack.id);
			soundtrackPendingDelete = null;
			showSuccess('Soundtrack deleted');
		} catch (caught) {
			showError(
				'Failed to delete soundtrack',
				caught instanceof Error ? caught.message : undefined
			);
		} finally {
			actionPending = '';
		}
	}

	async function deleteSelectedSoundtracks() {
		if (selectedCount === 0 || isMutating) return;
		const ids = [...selectedSoundtrackIds];
		actionPending = 'batch:delete';
		try {
			const results = await Promise.allSettled(ids.map((id) => deleteAdminSoundtrack(id)));
			const successfulIds = ids.filter((_, index) => results[index]?.status === 'fulfilled');
			soundtracks = soundtracks.filter(
				(soundtrack) => !soundtrack.id || !successfulIds.includes(soundtrack.id)
			);
			selectedSoundtrackIds = selectedSoundtrackIds.filter((id) => !successfulIds.includes(id));

			const failedCount = results.length - successfulIds.length;
			if (failedCount > 0) {
				showError(
					'Some soundtrack deletes failed',
					`${successfulIds.length} deleted, ${failedCount} failed.`
				);
				return;
			}
			batchDeleteDialogOpen = false;
			showSuccess(
				`${successfulIds.length} soundtrack${successfulIds.length === 1 ? '' : 's'} deleted`
			);
		} finally {
			actionPending = '';
		}
	}
</script>

<section class="space-y-6">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
		<div>
			<h2 class="text-xl font-semibold text-foreground">Soundtracks</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Review generated background tracks before they enter world assignment.
			</p>
		</div>
		<div class="flex flex-col gap-2 sm:flex-row">
			<form
				class="flex min-w-0 gap-2"
				onsubmit={(event) => {
					event.preventDefault();
					openLookup();
				}}
			>
				<Input
					bind:value={lookupId}
					placeholder="Open soundtrack ID"
					aria-label="Open soundtrack by ID"
					class="min-w-0 sm:w-64"
				/>
				<Button type="submit" variant="outline">
					<Search class="h-4 w-4" />
					Open
				</Button>
			</form>
			<Button variant="outline" disabled={loading} onclick={refreshSoundtracks}>
				<RefreshCw class="h-4 w-4" />
				Refresh
			</Button>
		</div>
	</div>

	<Card class="min-w-0">
		<CardHeader>
			<div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
				<CardTitle>Library Review</CardTitle>
				<nav
					class="grid grid-cols-2 gap-2 rounded-lg border border-border bg-muted/50 p-1 sm:grid-cols-5"
					aria-label="Soundtrack status"
				>
					{#each statusOptions as option (option.value)}
						{@const active =
							option.value === 'all' ? selectedStatus === null : selectedStatus === option.value}
						<a
							href={statusRoute(option.value)}
							aria-current={active ? 'page' : undefined}
							class="inline-flex min-w-0 items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-all {active
								? 'bg-background text-foreground shadow-sm'
								: 'text-muted-foreground hover:text-foreground'}"
						>
							<span class="truncate">{option.label}</span>
						</a>
					{/each}
				</nav>
			</div>
		</CardHeader>
		<CardContent>
			<div
				class="mb-4 flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between"
			>
				<div class="flex min-w-0 items-center gap-3">
					<Checkbox
						checked={allVisibleSelected}
						indeterminate={someVisibleSelected}
						disabled={visibleSelectableIds.length === 0 || isMutating}
						aria-label={allVisibleSelected ? 'Unselect all soundtracks' : 'Select all soundtracks'}
						onCheckedChange={(checked) => {
							if (checked) {
								selectAllVisible();
							} else {
								clearSelection();
							}
						}}
					/>
					<div class="min-w-0">
						<p class="text-sm font-medium text-foreground">
							{selectedCount > 0
								? `${selectedCount} selected`
								: `${soundtracks.length} on this page`}
						</p>
						<p class="text-xs text-muted-foreground">Batch actions apply to selected tracks.</p>
					</div>
				</div>
				<div class="flex flex-wrap gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={visibleSelectableIds.length === 0 || allVisibleSelected || isMutating}
						onclick={selectAllVisible}
					>
						Select All
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={selectedCount === 0 || isMutating}
						onclick={clearSelection}
					>
						Unselect
					</Button>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
							disabled={selectedCount === 0 || isMutating}
						>
							Batch Actions
							<ChevronDown class="h-4 w-4" />
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end" class="w-52">
							<DropdownMenu.Label>{selectedCount} selected</DropdownMenu.Label>
							<DropdownMenu.Separator />
							<DropdownMenu.Item
								class="cursor-pointer"
								disabled={!canActivateSelection || isMutating}
								onclick={() => setSelectedSoundtrackStatus('active')}
							>
								<CheckCircle2 class="h-4 w-4" />
								{statusActionLabel('active')}
							</DropdownMenu.Item>
							<DropdownMenu.Item
								class="cursor-pointer"
								disabled={isMutating}
								onclick={() => setSelectedSoundtrackStatus('draft')}
							>
								<RotateCcw class="h-4 w-4" />
								{statusActionLabel('draft')}
							</DropdownMenu.Item>
							<DropdownMenu.Item
								class="cursor-pointer"
								disabled={isMutating}
								onclick={() => setSelectedSoundtrackStatus('disabled')}
							>
								<CircleOff class="h-4 w-4" />
								{statusActionLabel('disabled')}
							</DropdownMenu.Item>
							<DropdownMenu.Item
								class="cursor-pointer"
								disabled={isMutating}
								onclick={() => setSelectedSoundtrackStatus('rejected')}
							>
								<XCircle class="h-4 w-4" />
								{statusActionLabel('rejected')}
							</DropdownMenu.Item>
							<DropdownMenu.Separator />
							<DropdownMenu.Item
								class="cursor-pointer"
								variant="destructive"
								disabled={isMutating}
								onclick={() => (batchDeleteDialogOpen = true)}
							>
								<Trash2 class="h-4 w-4" />
								Delete selected
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
			</div>

			{#if error}
				<div
					class="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
				>
					{error}
				</div>
			{:else if loading && soundtracks.length === 0}
				<div class="flex h-52 items-center justify-center">
					<Spinner class="h-6 w-6" />
				</div>
			{:else}
				<div class="divide-y divide-border">
					{#each soundtracks as soundtrack (soundtrack.id)}
						{@const isSelected = Boolean(
							soundtrack.id && selectedSoundtrackIds.includes(soundtrack.id)
						)}
						<article
							class="grid min-w-0 gap-4 rounded-lg px-3 py-5 transition-colors first:pt-0 last:pb-0 {isSelected
								? 'bg-primary/5'
								: ''} xl:grid-cols-[2rem_minmax(0,1.35fr)_minmax(15rem,0.85fr)_minmax(12rem,0.55fr)_9rem] xl:items-center"
						>
							<div class="flex items-start xl:pt-1">
								<Checkbox
									checked={isSelected}
									disabled={!soundtrack.id || isMutating}
									aria-label={`Select ${soundtrack.title || soundtrack.id || 'soundtrack'}`}
									onCheckedChange={(checked) => toggleSoundtrackSelection(soundtrack.id, checked)}
								/>
							</div>
							<div class="min-w-0 space-y-2">
								<a
									href={`/admin/soundtracks/${soundtrack.id}`}
									class="line-clamp-2 text-base font-medium text-foreground hover:text-primary hover:underline"
								>
									{soundtrack.title || 'Untitled soundtrack'}
								</a>
								<p class="line-clamp-2 max-w-2xl text-sm text-muted-foreground">
									{soundtrack.description || 'No description'}
								</p>
								<div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
									<div class="flex items-center gap-1 font-mono">
										<span>{shortId(soundtrack.id)}</span>
										{#if soundtrack.id}
											<CopyButton
												value={soundtrack.id}
												label="Copy soundtrack ID"
												successLabel="Soundtrack ID copied"
												class="h-6 w-6 text-muted-foreground"
											/>
										{/if}
									</div>
									{#if soundtrack.provider_track_id}
										<div class="flex items-center gap-1 font-mono">
											<span>{shortId(soundtrack.provider_track_id)}</span>
											<CopyButton
												value={soundtrack.provider_track_id}
												label="Copy provider track ID"
												successLabel="Provider ID copied"
												class="h-6 w-6 text-muted-foreground"
											/>
										</div>
									{/if}
								</div>
							</div>

							<div class="min-w-0">
								<p class="mb-2 text-xs font-medium text-muted-foreground uppercase">Preview</p>
								{#if soundtrack.audio_url}
									<audio
										controls
										preload="none"
										src={soundtrack.audio_url}
										class="h-10 w-full max-w-md min-w-0"
										aria-label={`Preview ${soundtrack.title || soundtrack.id || 'soundtrack'}`}
									></audio>
								{:else}
									<div
										class="flex h-10 items-center rounded-md border border-border px-3 text-sm text-muted-foreground"
									>
										No audio
									</div>
								{/if}
							</div>

							<div class="grid min-w-0 grid-cols-2 gap-3 text-sm sm:grid-cols-4 xl:grid-cols-1">
								<div>
									<p class="mb-1 text-xs font-medium text-muted-foreground uppercase">State</p>
									<div class="flex flex-wrap gap-2">
										<Badge class={soundtrackStatusClass(soundtrack.status)}>
											{soundtrack.status}
										</Badge>
										<Badge class={contentRatingClass(soundtrack.content_rating)}>
											{soundtrack.content_rating}
										</Badge>
									</div>
									{#if soundtrack.pinecone_upserted_at}
										<p class="mt-1 text-xs text-muted-foreground">Indexed</p>
									{/if}
								</div>
								<div>
									<p class="mb-1 text-xs font-medium text-muted-foreground uppercase">Length</p>
									<p class="text-foreground">{formatDuration(soundtrack.duration_seconds)}</p>
									<p class="text-xs text-muted-foreground">
										{formatFileSize(soundtrack.file_size_bytes)}
									</p>
								</div>
								<div class="col-span-2 sm:col-span-2 xl:col-span-1">
									<p class="mb-1 text-xs font-medium text-muted-foreground uppercase">Uploaded</p>
									<p class="text-foreground">{formatDateTime(soundtrack.created_at)}</p>
									{#if soundtrack.reviewed_at}
										<p class="text-xs text-muted-foreground">
											Reviewed {formatDateTime(soundtrack.reviewed_at)}
										</p>
									{/if}
								</div>
							</div>

							<div class="flex min-w-0 flex-wrap gap-2 xl:flex-col xl:items-stretch">
								<Button href={`/admin/soundtracks/${soundtrack.id}`} variant="outline" size="sm">
									Open
								</Button>
								{#if soundtrack.status !== 'active'}
									<Button
										size="sm"
										disabled={isMutating || !canActivate(soundtrack)}
										onclick={() => setSoundtrackStatus(soundtrack, 'active')}
									>
										<CheckCircle2 class="h-4 w-4" />
										Activate
									</Button>
								{:else}
									<Button
										variant="outline"
										size="sm"
										disabled={isMutating}
										onclick={() => setSoundtrackStatus(soundtrack, 'disabled')}
									>
										<CircleOff class="h-4 w-4" />
										Disable
									</Button>
								{/if}
								<DropdownMenu.Root>
									<DropdownMenu.Trigger
										class="inline-flex h-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-3 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 xl:w-full"
										disabled={isMutating}
									>
										<MoreHorizontal class="h-4 w-4" />
										More
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end" class="w-48">
										{#if soundtrack.status !== 'rejected'}
											<DropdownMenu.Item
												onclick={() => setSoundtrackStatus(soundtrack, 'rejected')}
												class="cursor-pointer"
												disabled={isMutating}
											>
												<XCircle class="h-4 w-4" />
												Reject
											</DropdownMenu.Item>
										{/if}
										{#if soundtrack.status !== 'disabled'}
											<DropdownMenu.Item
												onclick={() => setSoundtrackStatus(soundtrack, 'disabled')}
												class="cursor-pointer"
												disabled={isMutating}
											>
												<CircleOff class="h-4 w-4" />
												Disable
											</DropdownMenu.Item>
										{/if}
										{#if soundtrack.audio_url}
											<DropdownMenu.Item
												onclick={() => openAudio(soundtrack)}
												class="cursor-pointer"
											>
												<ExternalLink class="h-4 w-4" />
												Open audio
											</DropdownMenu.Item>
										{/if}
										<DropdownMenu.Separator />
										<DropdownMenu.Item
											onclick={() => requestDeleteSoundtrack(soundtrack)}
											class="cursor-pointer"
											variant="destructive"
											disabled={isMutating}
										>
											<Trash2 class="h-4 w-4" />
											Delete
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</div>
						</article>
					{/each}
				</div>

				{#if soundtracks.length === 0}
					<p class="mt-4 text-sm text-muted-foreground">No soundtracks match the current status.</p>
				{/if}

				<div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<p class="text-sm text-muted-foreground">
						Showing {soundtracks.length} soundtrack{soundtracks.length === 1 ? '' : 's'} on this page.
					</p>
					<div class="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={!cursorParam || loading}
							onclick={goToFirstPage}
						>
							First Page
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={!nextCursor || loading}
							onclick={goToNextPage}
						>
							{#if loading}
								<Spinner class="h-4 w-4" />
							{/if}
							Next Page
						</Button>
					</div>
				</div>
			{/if}
		</CardContent>
	</Card>
</section>

<AlertDialog.Root
	open={soundtrackPendingDelete !== null}
	onOpenChange={(open) => {
		if (!open && !isMutating) soundtrackPendingDelete = null;
	}}
>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete soundtrack?</AlertDialog.Title>
			<AlertDialog.Description>
				This permanently deletes
				<span class="font-medium text-foreground"
					>{soundtrackPendingDelete?.title ||
						soundtrackPendingDelete?.id ||
						'this soundtrack'}</span
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
					void deleteSoundtrack(soundtrackPendingDelete);
				}}
			>
				{#if actionPending.startsWith('delete:')}
					<Spinner class="h-4 w-4" />
				{:else}
					<Trash2 class="h-4 w-4" />
				{/if}
				Delete
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

<AlertDialog.Root
	open={batchDeleteDialogOpen}
	onOpenChange={(open) => {
		if (!isMutating) batchDeleteDialogOpen = open;
	}}
>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete selected soundtracks?</AlertDialog.Title>
			<AlertDialog.Description>
				This permanently deletes {selectedCount} selected soundtrack{selectedCount === 1 ? '' : 's'} from
				the library. This action cannot be undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel disabled={isMutating}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action
				variant="destructive"
				disabled={isMutating || selectedCount === 0}
				onclick={(event) => {
					event.preventDefault();
					void deleteSelectedSoundtracks();
				}}
			>
				{#if actionPending === 'batch:delete'}
					<Spinner class="h-4 w-4" />
				{:else}
					<Trash2 class="h-4 w-4" />
				{/if}
				Delete selected
			</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
