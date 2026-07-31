<script lang="ts">
	import {
		previewAdminSoundtrackMatches,
		previewAdminWorldContext,
		type AdminDiagnosticsContentFilter,
		type AdminSoundtrackMatchResponse,
		type AdminWorldContextPreviewResponse
	} from '$lib/api/admin';
	import {
		contentRatingClass,
		formatDuration,
		shortId,
		soundtrackStatusClass
	} from '$lib/admin/format';
	import CopyButton from '$lib/components/admin/CopyButton.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		AlertCircle,
		ArrowRight,
		Brain,
		ExternalLink,
		ListChecks,
		Music2,
		Search,
		Sparkles,
		Wrench
	} from '@lucide/svelte';

	type DiagnosticTool = 'playlist' | 'context';

	const contentFilterOptions: Array<{ value: AdminDiagnosticsContentFilter; label: string }> = [
		{ value: 'none', label: 'None' },
		{ value: 'moderate', label: 'Moderate' },
		{ value: 'strict', label: 'Strict' }
	];

	let activeTool = $state<DiagnosticTool>('playlist');

	let playlistQuery = $state('');
	let playlistContentFilter = $state<AdminDiagnosticsContentFilter>('none');
	let playlistTopK = $state('10');
	let playlistLoading = $state(false);
	let playlistError = $state('');
	let playlistResponse = $state<AdminSoundtrackMatchResponse | null>(null);

	let contextWorldId = $state('');
	let contextNodeId = $state('');
	let contextText = $state('');
	let contextAncestors = $state('');
	let contextWorldFactsTopK = $state('20');
	let contextBranchFactsTopK = $state('20');
	let contextSimilarNodesTopK = $state('3');
	let contextLoading = $state(false);
	let contextError = $state('');
	let contextResponse = $state<AdminWorldContextPreviewResponse | null>(null);

	const playlistCanRun = $derived(playlistQuery.trim().length >= 3 && !playlistLoading);
	const contextCanRun = $derived(
		contextWorldId.trim().length > 0 &&
			(contextNodeId.trim().length > 0 || contextText.trim().length >= 3) &&
			!contextLoading
	);

	function boundedInteger(value: string, fallback: number, min: number, max: number): number {
		const parsed = Number.parseInt(value, 10);
		if (!Number.isFinite(parsed)) return fallback;
		return Math.min(max, Math.max(min, parsed));
	}

	function splitIds(value: string): string[] {
		return value
			.split(/[\s,]+/)
			.map((item) => item.trim())
			.filter(Boolean);
	}

	function scoreLabel(score: number | null): string {
		return score == null ? 'N/A' : score.toFixed(4);
	}

	function nodeHref(worldId: string | null | undefined, nodeId: string | null | undefined): string {
		if (!worldId) return '/admin/worlds';
		if (!nodeId) return `/admin/worlds/${worldId}`;
		return `/admin/worlds/${worldId}#node-${nodeId}`;
	}

	function resetPlaylist() {
		playlistQuery = '';
		playlistContentFilter = 'none';
		playlistTopK = '10';
		playlistError = '';
		playlistResponse = null;
	}

	function resetContext() {
		contextWorldId = '';
		contextNodeId = '';
		contextText = '';
		contextAncestors = '';
		contextWorldFactsTopK = '20';
		contextBranchFactsTopK = '20';
		contextSimilarNodesTopK = '3';
		contextError = '';
		contextResponse = null;
	}

	async function runPlaylistMatch() {
		const query = playlistQuery.trim();
		if (query.length < 3 || playlistLoading) return;

		playlistLoading = true;
		playlistError = '';
		try {
			playlistResponse = await previewAdminSoundtrackMatches({
				query,
				content_filter: playlistContentFilter,
				top_k: boundedInteger(playlistTopK, 10, 1, 20)
			});
		} catch (caught) {
			playlistError =
				caught instanceof Error ? caught.message : 'Failed to preview soundtrack matches';
		} finally {
			playlistLoading = false;
		}
	}

	async function runWorldContext() {
		const worldId = contextWorldId.trim();
		const nodeId = contextNodeId.trim();
		const text = contextText.trim();
		if (!worldId || (!nodeId && text.length < 3) || contextLoading) return;

		contextLoading = true;
		contextError = '';
		try {
			contextResponse = await previewAdminWorldContext({
				world_id: worldId,
				node_id: nodeId || null,
				text: text || null,
				ancestor_node_ids: splitIds(contextAncestors),
				world_facts_top_k: boundedInteger(contextWorldFactsTopK, 20, 0, 50),
				branch_facts_top_k: boundedInteger(contextBranchFactsTopK, 20, 0, 50),
				similar_nodes_top_k: boundedInteger(contextSimilarNodesTopK, 3, 0, 10)
			});
		} catch (caught) {
			contextError = caught instanceof Error ? caught.message : 'Failed to preview world context';
		} finally {
			contextLoading = false;
		}
	}
</script>

<section class="space-y-6">
	<div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
		<div>
			<h2 class="text-xl font-semibold text-foreground">Diagnostics</h2>
			<p class="mt-1 max-w-3xl text-sm text-muted-foreground">
				Test matching and retrieval paths with the same admin auth context as the rest of the
				console.
			</p>
		</div>
		<div class="grid rounded-lg border border-border bg-muted/30 p-1 sm:grid-cols-2">
			<button
				type="button"
				class={`inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${activeTool === 'playlist' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
				aria-pressed={activeTool === 'playlist'}
				onclick={() => (activeTool = 'playlist')}
			>
				<Music2 class="h-4 w-4" />
				Playlist Matching
			</button>
			<button
				type="button"
				class={`inline-flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${activeTool === 'context' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
				aria-pressed={activeTool === 'context'}
				onclick={() => (activeTool = 'context')}
			>
				<Brain class="h-4 w-4" />
				World Context
			</button>
		</div>
	</div>

	<div class="grid gap-3 md:grid-cols-3">
		<a
			href="/admin/soundtracks?status=active"
			class="rounded-lg border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
		>
			<div class="flex items-center gap-2 text-sm font-medium text-foreground">
				<Music2 class="h-4 w-4 text-muted-foreground" />
				Active Library
			</div>
			<p class="mt-2 text-sm text-muted-foreground">Soundtracks eligible for playlist search.</p>
		</a>
		<a
			href="/admin/worlds"
			class="rounded-lg border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
		>
			<div class="flex items-center gap-2 text-sm font-medium text-foreground">
				<ListChecks class="h-4 w-4 text-muted-foreground" />
				Worlds
			</div>
			<p class="mt-2 text-sm text-muted-foreground">
				Find world and node IDs for context previews.
			</p>
		</a>
		<a
			href="/admin/soundtracks?status=draft"
			class="rounded-lg border border-border bg-muted/20 p-4 transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
		>
			<div class="flex items-center gap-2 text-sm font-medium text-foreground">
				<Sparkles class="h-4 w-4 text-muted-foreground" />
				Curation Queue
			</div>
			<p class="mt-2 text-sm text-muted-foreground">
				Review descriptions that affect future matching.
			</p>
		</a>
	</div>

	{#if activeTool === 'playlist'}
		<div class="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
			<Card class="min-w-0 self-start">
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Music2 class="h-5 w-5 text-muted-foreground" />
						Playlist Matching
					</CardTitle>
					<CardDescription>Vector search against active soundtracks.</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						class="space-y-4"
						onsubmit={(event) => {
							event.preventDefault();
							void runPlaylistMatch();
						}}
					>
						<div class="space-y-2">
							<Label for="playlist-query">Search Text</Label>
							<Textarea
								id="playlist-query"
								bind:value={playlistQuery}
								class="min-h-36 resize-y"
								placeholder="Tense, lonely synth pulses for a ruined orbital station..."
								disabled={playlistLoading}
								required
							/>
						</div>

						<div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_8rem]">
							<div class="space-y-2">
								<Label>Content Filter</Label>
								<div class="grid rounded-lg border border-border bg-muted/30 p-1 sm:grid-cols-3">
									{#each contentFilterOptions as option (option.value)}
										<button
											type="button"
											class={`h-9 rounded-md px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${playlistContentFilter === option.value ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'}`}
											aria-pressed={playlistContentFilter === option.value}
											disabled={playlistLoading}
											onclick={() => (playlistContentFilter = option.value)}
										>
											{option.label}
										</button>
									{/each}
								</div>
							</div>
							<div class="space-y-2">
								<Label for="playlist-top-k">Top K</Label>
								<Input
									id="playlist-top-k"
									type="number"
									min="1"
									max="20"
									bind:value={playlistTopK}
									disabled={playlistLoading}
								/>
							</div>
						</div>

						{#if playlistError}
							<div
								class="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
								role="alert"
							>
								<AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
								<p>{playlistError}</p>
							</div>
						{/if}

						<div class="flex flex-wrap gap-2">
							<Button type="submit" disabled={!playlistCanRun}>
								{#if playlistLoading}
									<Spinner class="h-4 w-4" />
								{:else}
									<Search class="h-4 w-4" />
								{/if}
								Run Match
							</Button>
							<Button
								type="button"
								variant="outline"
								disabled={playlistLoading}
								onclick={resetPlaylist}
							>
								Reset
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<Card class="min-w-0">
				<CardHeader>
					<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<CardTitle>Match Results</CardTitle>
							<CardDescription>
								{#if playlistResponse}
									{playlistResponse.matches.length} ranked hit{playlistResponse.matches.length === 1
										? ''
										: 's'}
								{:else}
									Ready
								{/if}
							</CardDescription>
						</div>
						{#if playlistResponse}
							<div class="flex flex-wrap gap-2 sm:justify-end">
								{#each playlistResponse.allowed_ratings as rating (rating)}
									<Badge variant="outline">{rating}</Badge>
								{/each}
							</div>
						{/if}
					</div>
				</CardHeader>
				<CardContent>
					{#if playlistLoading}
						<div class="flex h-52 items-center justify-center">
							<Spinner class="h-6 w-6" />
						</div>
					{:else if playlistResponse}
						<div class="space-y-3">
							{#each playlistResponse.matches as match (match.pinecone_record_id ?? match.soundtrack_id ?? match.rank)}
								<div class="rounded-md border border-border p-4">
									<div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
										<div class="min-w-0">
											<div class="flex flex-wrap items-center gap-2">
												<Badge variant="outline">#{match.rank}</Badge>
												{#if match.soundtrack?.id}
													<a
														href={`/admin/soundtracks/${match.soundtrack.id}`}
														class="min-w-0 font-medium text-foreground hover:text-primary hover:underline"
													>
														{match.soundtrack.title || 'Untitled soundtrack'}
													</a>
												{:else}
													<span class="font-medium text-foreground">
														{match.soundtrack_id || match.pinecone_record_id || 'Unhydrated hit'}
													</span>
												{/if}
												{#if match.missing_soundtrack}
													<Badge class="border-amber-500/30 bg-amber-500/10 text-amber-300"
														>Missing record</Badge
													>
												{/if}
											</div>
											<div
												class="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
											>
												<span>Score {scoreLabel(match.score)}</span>
												{#if match.soundtrack_id}
													<span class="flex items-center gap-1 font-mono">
														{shortId(match.soundtrack_id)}
														<CopyButton
															value={match.soundtrack_id}
															label="Copy soundtrack ID"
															successLabel="Soundtrack ID copied"
															class="h-6 w-6 text-muted-foreground"
														/>
													</span>
												{/if}
												{#if match.pinecone_record_id}
													<span class="font-mono">Vector {shortId(match.pinecone_record_id)}</span>
												{/if}
											</div>
											<p class="mt-3 text-sm text-muted-foreground">
												{match.matched_text ||
													match.soundtrack?.description ||
													'No matched text returned.'}
											</p>
										</div>
										<div class="flex flex-wrap items-start gap-2 lg:justify-end">
											{#if match.soundtrack}
												<Badge class={soundtrackStatusClass(match.soundtrack.status)}>
													{match.soundtrack.status}
												</Badge>
												<Badge class={contentRatingClass(match.soundtrack.content_rating)}>
													{match.soundtrack.content_rating}
												</Badge>
												<Badge variant="outline">
													{formatDuration(match.soundtrack.duration_seconds)}
												</Badge>
											{/if}
											{#if match.soundtrack?.id}
												<Button
													href={`/admin/soundtracks/${match.soundtrack.id}`}
													variant="outline"
													size="sm"
												>
													Open
													<ArrowRight class="h-4 w-4" />
												</Button>
											{/if}
										</div>
									</div>
									{#if match.soundtrack?.audio_url}
										<audio
											class="mt-4 w-full"
											controls
											preload="none"
											src={match.soundtrack.audio_url}
											aria-label={`Preview ${match.soundtrack.title || match.soundtrack.id || 'soundtrack'}`}
										></audio>
									{/if}
								</div>
							{:else}
								<p class="text-sm text-muted-foreground">No matches returned.</p>
							{/each}
						</div>
					{:else}
						<div
							class="flex min-h-52 items-center justify-center rounded-md border border-dashed border-border p-6 text-center"
						>
							<div>
								<Wrench class="mx-auto h-6 w-6 text-muted-foreground" />
								<p class="mt-2 text-sm font-medium text-foreground">No query run yet.</p>
								<p class="mt-1 text-sm text-muted-foreground">
									Matched tracks will appear here with links and audio previews.
								</p>
							</div>
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>
	{:else}
		<div class="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
			<Card class="min-w-0 self-start">
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Brain class="h-5 w-5 text-muted-foreground" />
						World Context
					</CardTitle>
					<CardDescription>Vector context for a node or free text.</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						class="space-y-4"
						onsubmit={(event) => {
							event.preventDefault();
							void runWorldContext();
						}}
					>
						<div class="grid gap-4 sm:grid-cols-2">
							<div class="space-y-2">
								<Label for="context-world-id">World ID</Label>
								<Input
									id="context-world-id"
									bind:value={contextWorldId}
									placeholder="world_..."
									disabled={contextLoading}
									required
								/>
							</div>
							<div class="space-y-2">
								<Label for="context-node-id">Node ID</Label>
								<Input
									id="context-node-id"
									bind:value={contextNodeId}
									placeholder="0aac"
									disabled={contextLoading}
								/>
							</div>
						</div>

						<div class="space-y-2">
							<Label for="context-text">Text Override</Label>
							<Textarea
								id="context-text"
								bind:value={contextText}
								class="min-h-32 resize-y"
								placeholder="Use this text instead of the node text..."
								disabled={contextLoading}
							/>
						</div>

						<div class="space-y-2">
							<Label for="context-ancestors">Ancestor Node IDs</Label>
							<Textarea
								id="context-ancestors"
								bind:value={contextAncestors}
								class="min-h-20 resize-y"
								placeholder="0, 0a, 0ac"
								disabled={contextLoading}
							/>
						</div>

						<div class="grid gap-4 sm:grid-cols-3">
							<div class="space-y-2">
								<Label for="world-facts-top-k">World Facts</Label>
								<Input
									id="world-facts-top-k"
									type="number"
									min="0"
									max="50"
									bind:value={contextWorldFactsTopK}
									disabled={contextLoading}
								/>
							</div>
							<div class="space-y-2">
								<Label for="branch-facts-top-k">Branch Facts</Label>
								<Input
									id="branch-facts-top-k"
									type="number"
									min="0"
									max="50"
									bind:value={contextBranchFactsTopK}
									disabled={contextLoading}
								/>
							</div>
							<div class="space-y-2">
								<Label for="similar-nodes-top-k">Similar Nodes</Label>
								<Input
									id="similar-nodes-top-k"
									type="number"
									min="0"
									max="10"
									bind:value={contextSimilarNodesTopK}
									disabled={contextLoading}
								/>
							</div>
						</div>

						{#if contextError}
							<div
								class="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
								role="alert"
							>
								<AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
								<p>{contextError}</p>
							</div>
						{/if}

						<div class="flex flex-wrap gap-2">
							<Button type="submit" disabled={!contextCanRun}>
								{#if contextLoading}
									<Spinner class="h-4 w-4" />
								{:else}
									<Search class="h-4 w-4" />
								{/if}
								Run Preview
							</Button>
							<Button
								type="button"
								variant="outline"
								disabled={contextLoading}
								onclick={resetContext}
							>
								Reset
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>

			<Card class="min-w-0">
				<CardHeader>
					<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<CardTitle>Context Results</CardTitle>
							<CardDescription>
								{#if contextResponse}
									{contextResponse.world_facts.length} world facts, {contextResponse.branch_facts
										.length}
									branch facts, {contextResponse.similar_nodes.length} similar nodes
								{:else}
									Ready
								{/if}
							</CardDescription>
						</div>
						{#if contextResponse}
							<Button
								href={`/admin/worlds/${contextResponse.world_id}`}
								variant="outline"
								size="sm"
							>
								Open World
								<ExternalLink class="h-4 w-4" />
							</Button>
						{/if}
					</div>
				</CardHeader>
				<CardContent>
					{#if contextLoading}
						<div class="flex h-52 items-center justify-center">
							<Spinner class="h-6 w-6" />
						</div>
					{:else if contextResponse}
						<div class="space-y-5">
							<div class="rounded-md border border-border p-4">
								<div class="flex flex-wrap items-center gap-2">
									<Badge variant="outline">{shortId(contextResponse.world_id)}</Badge>
									{#if contextResponse.source_node_id}
										<a
											href={nodeHref(contextResponse.world_id, contextResponse.source_node_id)}
											class="font-mono text-xs text-primary hover:underline"
										>
											Node {shortId(contextResponse.source_node_id)}
										</a>
									{/if}
								</div>
								<p class="mt-3 max-h-32 overflow-y-auto text-sm text-muted-foreground">
									{contextResponse.query_text}
								</p>
								<div class="mt-3 flex flex-wrap gap-2">
									{#each contextResponse.ancestor_node_ids as ancestor (ancestor)}
										<a
											href={nodeHref(contextResponse.world_id, ancestor)}
											class="rounded-md border border-border px-2 py-1 font-mono text-xs text-muted-foreground hover:text-primary"
										>
											{shortId(ancestor)}
										</a>
									{:else}
										<span class="text-xs text-muted-foreground">No ancestors supplied.</span>
									{/each}
								</div>
							</div>

							{#if contextResponse.stored_context}
								<div class="rounded-md border border-border p-4">
									<div class="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
										<ListChecks class="h-4 w-4 text-muted-foreground" />
										Stored Node Context
									</div>
									<div class="grid gap-3 lg:grid-cols-3">
										<div>
											<p class="text-xs font-medium text-muted-foreground uppercase">World Facts</p>
											<ul class="mt-2 space-y-2 text-sm text-muted-foreground">
												{#each contextResponse.stored_context.world_facts as fact, index (`world-${index}`)}
													<li>{fact}</li>
												{:else}
													<li>N/A</li>
												{/each}
											</ul>
										</div>
										<div>
											<p class="text-xs font-medium text-muted-foreground uppercase">
												Branch Facts
											</p>
											<ul class="mt-2 space-y-2 text-sm text-muted-foreground">
												{#each contextResponse.stored_context.branch_facts as fact, index (`branch-${index}`)}
													<li>{fact}</li>
												{:else}
													<li>N/A</li>
												{/each}
											</ul>
										</div>
										<div>
											<p class="text-xs font-medium text-muted-foreground uppercase">
												Similar Nodes
											</p>
											<ul class="mt-2 space-y-2 text-sm text-muted-foreground">
												{#each contextResponse.stored_context.similar_nodes as node, index (`similar-${index}`)}
													<li>{node}</li>
												{:else}
													<li>N/A</li>
												{/each}
											</ul>
										</div>
									</div>
								</div>
							{/if}

							<div class="grid gap-4">
								<div class="rounded-md border border-border p-4">
									<div class="mb-3 flex items-center justify-between gap-3">
										<p class="text-sm font-medium text-foreground">World Facts</p>
										<Badge variant="outline">{contextResponse.world_facts.length}</Badge>
									</div>
									<div class="space-y-3">
										{#each contextResponse.world_facts as fact (fact.id)}
											<div class="rounded-md bg-muted/30 p-3">
												<p class="text-sm text-foreground">{fact.text}</p>
												<p
													class="mt-2 flex items-center gap-1 font-mono text-xs text-muted-foreground"
												>
													{shortId(fact.id)}
													<CopyButton
														value={fact.id}
														label="Copy fact ID"
														successLabel="Fact ID copied"
														class="h-6 w-6 text-muted-foreground"
													/>
												</p>
											</div>
										{:else}
											<p class="text-sm text-muted-foreground">No world facts returned.</p>
										{/each}
									</div>
								</div>

								<div class="rounded-md border border-border p-4">
									<div class="mb-3 flex items-center justify-between gap-3">
										<p class="text-sm font-medium text-foreground">Branch Facts</p>
										<Badge variant="outline">{contextResponse.branch_facts.length}</Badge>
									</div>
									<div class="space-y-3">
										{#each contextResponse.branch_facts as fact (fact.id)}
											<div class="rounded-md bg-muted/30 p-3">
												<p class="text-sm text-foreground">{fact.text}</p>
												<div
													class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
												>
													<span class="flex items-center gap-1 font-mono">
														{shortId(fact.id)}
														<CopyButton
															value={fact.id}
															label="Copy fact ID"
															successLabel="Fact ID copied"
															class="h-6 w-6 text-muted-foreground"
														/>
													</span>
													{#if fact.origin_node_id}
														<a
															href={nodeHref(contextResponse.world_id, fact.origin_node_id)}
															class="font-mono text-primary hover:underline"
														>
															Origin {shortId(fact.origin_node_id)}
														</a>
													{/if}
												</div>
											</div>
										{:else}
											<p class="text-sm text-muted-foreground">No branch facts returned.</p>
										{/each}
									</div>
								</div>

								<div class="rounded-md border border-border p-4">
									<div class="mb-3 flex items-center justify-between gap-3">
										<p class="text-sm font-medium text-foreground">Similar Nodes</p>
										<Badge variant="outline">{contextResponse.similar_nodes.length}</Badge>
									</div>
									<div class="space-y-3">
										{#each contextResponse.similar_nodes as node (node.id)}
											<div class="rounded-md bg-muted/30 p-3">
												<p class="text-sm text-foreground">{node.text}</p>
												<div
													class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground"
												>
													<a
														href={nodeHref(node.world_id || contextResponse.world_id, node.id)}
														class="font-mono text-primary hover:underline"
													>
														{shortId(node.id)}
													</a>
													<CopyButton
														value={node.id}
														label="Copy node ID"
														successLabel="Node ID copied"
														class="h-6 w-6 text-muted-foreground"
													/>
												</div>
											</div>
										{:else}
											<p class="text-sm text-muted-foreground">No similar nodes returned.</p>
										{/each}
									</div>
								</div>
							</div>
						</div>
					{:else}
						<div
							class="flex min-h-52 items-center justify-center rounded-md border border-dashed border-border p-6 text-center"
						>
							<div>
								<Brain class="mx-auto h-6 w-6 text-muted-foreground" />
								<p class="mt-2 text-sm font-medium text-foreground">No preview run yet.</p>
								<p class="mt-1 text-sm text-muted-foreground">
									Context buckets and stored node context will appear here.
								</p>
							</div>
						</div>
					{/if}
				</CardContent>
			</Card>
		</div>
	{/if}
</section>
