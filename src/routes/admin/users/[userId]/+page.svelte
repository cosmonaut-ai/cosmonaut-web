<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		banAdminUser,
		deleteAdminAccount,
		getAdminUser,
		getAdminUserGroups,
		getAdminUserUsage,
		listAdminUserWorlds,
		unbanAdminUser,
		updateAdminUserTier,
		type AdminCognitoUser,
		type AdminUserUsage
	} from '$lib/api/admin';
	import {
		ADMIN_TIERS,
		formatBoolean,
		formatDate,
		formatDateTime,
		formatNumber,
		normalizeTier,
		shortId,
		statusClass,
		tierClass,
		visibilityClass
	} from '$lib/admin/format';
	import { ApiError, type World } from '$lib/types/api';
	import type { SubscriptionTier } from '$lib/types/subscription';
	import { showError, showSuccess, showWarning } from '$lib/utils/toast';
	import CopyButton from '$lib/components/admin/CopyButton.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Ban, ChevronLeft, ExternalLink, Trash2, UserCheck } from '@lucide/svelte';

	const userId = $derived(page.params.userId ?? '');

	let user = $state<AdminCognitoUser | null>(null);
	let usage = $state<AdminUserUsage | null>(null);
	let groups = $state<string[]>([]);
	let worlds = $state<World[]>([]);
	let worldsCursor = $state<string | null>(null);
	let worldsLoading = $state(false);
	let selectedTier = $state<SubscriptionTier>('FREE');
	let loading = $state(false);
	let error = $state('');
	let actionPending = $state('');
	let requestId = 0;

	const isMutating = $derived(actionPending !== '');
	const stripeCustomerUrl = $derived(
		usage?.stripe_customer_id
			? `https://dashboard.stripe.com/customers/${usage.stripe_customer_id}`
			: ''
	);

	$effect(() => {
		if (!userId) return;
		const currentRequest = ++requestId;
		void loadUser(userId, currentRequest, true);
	});

	async function readOptional<T>(promise: Promise<T>): Promise<T | null> {
		try {
			return await promise;
		} catch (caught) {
			if (caught instanceof ApiError && caught.isNotFound) return null;
			throw caught;
		}
	}

	async function loadUser(targetUserId = userId, currentRequest = ++requestId, clear = false) {
		if (!targetUserId) return;
		if (clear) {
			user = null;
			usage = null;
			groups = [];
			worlds = [];
			worldsCursor = null;
			selectedTier = 'FREE';
		}
		loading = true;
		error = '';
		try {
			const [freshUser, freshUsage, freshGroups, worldResponse] = await Promise.all([
				getAdminUser(targetUserId),
				readOptional(getAdminUserUsage(targetUserId)),
				getAdminUserGroups(targetUserId),
				listAdminUserWorlds(targetUserId)
			]);
			if (currentRequest !== requestId) return;
			user = freshUser;
			usage = freshUsage;
			groups = freshGroups;
			worlds = worldResponse.items;
			worldsCursor = worldResponse.next_cursor;
			selectedTier = normalizeTier(freshUsage?.tier ?? freshUser.tier);
		} catch (caught) {
			if (currentRequest !== requestId) return;
			error = caught instanceof Error ? caught.message : 'Failed to load user details';
		} finally {
			if (currentRequest === requestId) loading = false;
		}
	}

	function refreshUser() {
		void loadUser(userId, ++requestId, false);
	}

	async function loadMoreWorlds() {
		if (!userId || !worldsCursor || worldsLoading) return;
		const targetUserId = userId;
		worldsLoading = true;
		try {
			const response = await listAdminUserWorlds(targetUserId, { cursor: worldsCursor });
			if (targetUserId !== userId) return;
			worlds = [...worlds, ...response.items];
			worldsCursor = response.next_cursor;
		} catch (caught) {
			showError('Failed to load more worlds', caught instanceof Error ? caught.message : undefined);
		} finally {
			worldsLoading = false;
		}
	}

	async function updateTier() {
		if (!user || isMutating) return;
		actionPending = 'tier';
		try {
			const result = await updateAdminUserTier(user.sub, selectedTier);
			showSuccess('Tier updated', `${user.email || user.sub} is now ${result.tier}`);
			if (result.warning) showWarning('Cognito sync warning', result.warning);
			await loadUser(user.sub, ++requestId, false);
		} catch (caught) {
			showError('Failed to update tier', caught instanceof Error ? caught.message : undefined);
		} finally {
			actionPending = '';
		}
	}

	async function banUser() {
		if (!user || isMutating) return;
		if (!window.confirm(`Ban ${user.email || user.sub}?`)) return;
		actionPending = 'ban';
		try {
			const result = await banAdminUser(user.sub);
			if (result.sessions_revoked) {
				showSuccess('User banned', 'Sessions were revoked.');
			} else {
				showSuccess('User banned');
				showWarning('Sessions not revoked', 'Existing tokens may remain valid until they expire.');
			}
			await loadUser(user.sub, ++requestId, false);
		} catch (caught) {
			showError('Failed to ban user', caught instanceof Error ? caught.message : undefined);
		} finally {
			actionPending = '';
		}
	}

	async function unbanUser() {
		if (!user || isMutating) return;
		actionPending = 'unban';
		try {
			await unbanAdminUser(user.sub);
			showSuccess('User unbanned');
			await loadUser(user.sub, ++requestId, false);
		} catch (caught) {
			showError('Failed to unban user', caught instanceof Error ? caught.message : undefined);
		} finally {
			actionPending = '';
		}
	}

	async function deleteUser() {
		if (!user || isMutating) return;
		const confirmation = window.prompt(
			`Permanently delete ${user.email || user.sub}? Type DELETE to confirm.`
		);
		if (confirmation !== 'DELETE') return;
		actionPending = 'delete';
		try {
			await deleteAdminAccount(user.sub);
			showSuccess('Account deleted');
			await goto('/admin/users');
		} catch (caught) {
			showError('Failed to delete account', caught instanceof Error ? caught.message : undefined);
		} finally {
			actionPending = '';
		}
	}
</script>

<section class="space-y-6">
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<Button href="/admin/users" variant="ghost" size="sm" class="mb-2 px-0">
				<ChevronLeft class="h-4 w-4" />
				Users
			</Button>
			<h2 class="text-xl font-semibold text-foreground">User Detail</h2>
			<p class="mt-1 flex items-center gap-1 font-mono text-sm break-all text-muted-foreground">
				{userId}
				<CopyButton
					value={userId}
					label="Copy user ID"
					successLabel="User ID copied"
					class="h-7 w-7 text-muted-foreground"
				/>
			</p>
		</div>
		<Button variant="outline" size="sm" disabled={loading} onclick={refreshUser}>Refresh</Button>
	</div>

	{#if error}
		<div
			class="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
		>
			{error}
		</div>
	{:else if loading && !user}
		<div class="flex h-52 items-center justify-center">
			<Spinner class="h-6 w-6" />
		</div>
	{:else if user}
		<div class="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
			<div class="min-w-0 space-y-6">
				<Card class="min-w-0">
					<CardHeader>
						<div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
							<div class="min-w-0">
								<div class="flex items-start gap-1">
									<CardTitle class="break-all">{user.email || user.sub}</CardTitle>
									<CopyButton
										value={user.email || user.sub}
										label={user.email ? 'Copy email' : 'Copy user ID'}
										successLabel={user.email ? 'Email copied' : 'User ID copied'}
										class="h-7 w-7 text-muted-foreground"
									/>
								</div>
								<p
									class="mt-1 flex items-center gap-1 font-mono text-xs break-all text-muted-foreground"
								>
									{user.sub}
									<CopyButton
										value={user.sub}
										label="Copy user ID"
										successLabel="User ID copied"
										class="h-6 w-6 text-muted-foreground"
									/>
								</p>
							</div>
							<div class="flex flex-wrap gap-2">
								<Badge class={tierClass(usage?.tier ?? user.tier)}>{usage?.tier ?? user.tier}</Badge
								>
								<Badge class={statusClass(user.enabled)}>
									{user.enabled === false ? 'Disabled' : user.status || 'Enabled'}
								</Badge>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
							<div class="rounded-md border border-border p-3">
								<p class="text-xs text-muted-foreground">Groups</p>
								<p class="mt-1 font-medium text-foreground">
									{groups.length ? groups.join(', ') : 'None'}
								</p>
							</div>
							<div class="rounded-md border border-border p-3">
								<p class="text-xs text-muted-foreground">Loaded Worlds</p>
								<p class="mt-1 font-medium text-foreground">{formatNumber(worlds.length)}</p>
							</div>
							<div class="rounded-md border border-border p-3">
								<p class="text-xs text-muted-foreground">Created</p>
								<p class="mt-1 font-medium text-foreground">{formatDate(user.created_at)}</p>
							</div>
							<div class="rounded-md border border-border p-3">
								<p class="text-xs text-muted-foreground">Verified</p>
								<p class="mt-1 font-medium text-foreground">{formatBoolean(user.email_verified)}</p>
							</div>
							<div class="rounded-md border border-border p-3">
								<p class="text-xs text-muted-foreground">Cognito Username</p>
								<p class="mt-1 flex items-center gap-1 font-mono text-xs break-all text-foreground">
									{user.username || 'N/A'}
									<CopyButton
										value={user.username}
										label="Copy Cognito username"
										successLabel="Cognito username copied"
										class="h-6 w-6 text-muted-foreground"
									/>
								</p>
							</div>
							<div class="rounded-md border border-border p-3">
								<p class="text-xs text-muted-foreground">Stripe Customer</p>
								{#if usage?.stripe_customer_id || user.stripe_customer_id}
									<p
										class="mt-1 flex items-center gap-1 font-mono text-xs break-all text-foreground"
									>
										{usage?.stripe_customer_id || user.stripe_customer_id}
										<CopyButton
											value={usage?.stripe_customer_id || user.stripe_customer_id}
											label="Copy Stripe customer ID"
											successLabel="Stripe customer ID copied"
											class="h-6 w-6 text-muted-foreground"
										/>
									</p>
								{:else}
									<p class="mt-1 font-medium text-foreground">N/A</p>
								{/if}
							</div>
							<div class="rounded-md border border-border p-3">
								<p class="text-xs text-muted-foreground">Onboarded</p>
								<p class="mt-1 font-medium text-foreground">
									{usage ? formatBoolean(usage.is_onboarded) : 'N/A'}
								</p>
							</div>
							<div class="rounded-md border border-border p-3">
								<p class="text-xs text-muted-foreground">Usage Updated</p>
								<p class="mt-1 font-medium text-foreground">{formatDateTime(usage?.updated_at)}</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card class="min-w-0">
					<CardHeader>
						<div class="flex items-center justify-between gap-3">
							<CardTitle>Worlds</CardTitle>
							<Button
								href={`/admin/worlds?search=${encodeURIComponent(user.sub)}`}
								variant="outline"
								size="sm"
							>
								All User Worlds
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						<div class="space-y-3">
							{#each worlds as world (world.id)}
								<a
									href={`/admin/worlds/${world.id}`}
									class="block rounded-md border border-border p-3 hover:bg-muted/40"
								>
									<div class="flex items-start justify-between gap-3">
										<div class="min-w-0">
											<p class="truncate text-sm font-medium text-foreground">
												{world.title || 'Untitled world'}
											</p>
											<p
												class="mt-1 flex items-center gap-1 font-mono text-xs text-muted-foreground"
											>
												{shortId(world.id)}
												<CopyButton
													value={world.id}
													label="Copy world ID"
													successLabel="World ID copied"
													class="h-6 w-6 text-muted-foreground"
												/>
											</p>
										</div>
										<Badge class={visibilityClass(world.visibility)}>
											{world.visibility || 'unknown'}
										</Badge>
									</div>
									<p class="mt-2 text-xs text-muted-foreground">
										{formatDateTime(world.updated_at)}
									</p>
								</a>
							{/each}
							{#if worlds.length === 0}
								<p class="text-sm text-muted-foreground">No worlds found for this user.</p>
							{/if}
						</div>
						{#if worldsCursor}
							<div class="mt-4 flex justify-end">
								<Button
									variant="outline"
									size="sm"
									disabled={worldsLoading}
									onclick={loadMoreWorlds}
								>
									{#if worldsLoading}
										<Spinner class="h-4 w-4" />
									{/if}
									Load More Worlds
								</Button>
							</div>
						{/if}
					</CardContent>
				</Card>
			</div>

			<div class="min-w-0 space-y-6">
				<Card class="min-w-0">
					<CardHeader>
						<CardTitle>Usage</CardTitle>
					</CardHeader>
					<CardContent>
						{#if usage}
							<div class="grid grid-cols-2 gap-3 text-sm">
								<div class="rounded-md border border-border p-3">
									<p class="text-xs text-muted-foreground">Nodes</p>
									<p class="mt-1 font-medium text-foreground">{formatNumber(usage.nodes_used)}</p>
								</div>
								<div class="rounded-md border border-border p-3">
									<p class="text-xs text-muted-foreground">Created</p>
									<p class="mt-1 font-medium text-foreground">
										{formatNumber(usage.worlds_created)}
									</p>
								</div>
								<div class="rounded-md border border-border p-3">
									<p class="text-xs text-muted-foreground">Audio</p>
									<p class="mt-1 font-medium text-foreground">
										{formatNumber(usage.audio_narrations_used)}
									</p>
								</div>
								<div class="rounded-md border border-border p-3">
									<p class="text-xs text-muted-foreground">Saved</p>
									<p class="mt-1 font-medium text-foreground">
										{formatNumber(usage.saved_world_count)}
									</p>
								</div>
								<div class="rounded-md border border-border p-3">
									<p class="text-xs text-muted-foreground">Period End</p>
									<p class="mt-1 font-medium text-foreground">{formatDate(usage.period_end)}</p>
								</div>
								<div class="rounded-md border border-border p-3">
									<p class="text-xs text-muted-foreground">Subscription</p>
									<p class="mt-1 font-medium text-foreground">
										{usage.subscription_status || 'N/A'}
									</p>
								</div>
								<div class="rounded-md border border-border p-3">
									<p class="text-xs text-muted-foreground">Pending Tier</p>
									<p class="mt-1 font-medium text-foreground">
										{usage.pending_tier || 'None'}
									</p>
								</div>
								<div class="rounded-md border border-border p-3">
									<p class="text-xs text-muted-foreground">Newsletter</p>
									<p class="mt-1 font-medium text-foreground">
										{formatBoolean(usage.newsletter_opted_in)}
									</p>
								</div>
							</div>
							{#if usage.pending_cancellation || usage.pending_tier_date || usage.cancellation_date}
								<div
									class="mt-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200"
								>
									{#if usage.pending_cancellation}
										<p>Subscription cancellation is pending.</p>
									{/if}
									{#if usage.cancellation_date}
										<p>Cancellation date: {formatDateTime(usage.cancellation_date)}</p>
									{/if}
									{#if usage.pending_tier_date}
										<p>Pending tier date: {formatDateTime(usage.pending_tier_date)}</p>
									{/if}
								</div>
							{/if}
							{#if stripeCustomerUrl}
								<Button href={stripeCustomerUrl} variant="outline" size="sm" class="mt-3">
									<ExternalLink class="h-4 w-4" />
									Open Stripe Customer
								</Button>
							{/if}
						{:else}
							<p class="text-sm text-muted-foreground">No usage record exists for this user.</p>
						{/if}
					</CardContent>
				</Card>

				<Card class="min-w-0">
					<CardHeader>
						<CardTitle>Actions</CardTitle>
					</CardHeader>
					<CardContent class="space-y-5">
						<div class="space-y-2">
							<label for="admin-tier" class="text-sm font-medium text-foreground">Tier</label>
							<div class="flex gap-2">
								<select
									id="admin-tier"
									bind:value={selectedTier}
									disabled={isMutating}
									class="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm text-foreground"
								>
									{#each ADMIN_TIERS as tier (tier)}
										<option value={tier}>{tier}</option>
									{/each}
								</select>
								<Button disabled={isMutating} onclick={updateTier}>
									{#if actionPending === 'tier'}
										<Spinner class="h-4 w-4" />
									{/if}
									Update
								</Button>
							</div>
						</div>

						<div class="grid gap-2">
							{#if user.enabled === false}
								<Button variant="outline" disabled={isMutating} onclick={unbanUser}>
									<UserCheck class="h-4 w-4" />
									Unban User
								</Button>
							{:else}
								<Button variant="outline" disabled={isMutating} onclick={banUser}>
									<Ban class="h-4 w-4" />
									Ban User
								</Button>
							{/if}
							<Button variant="destructive" disabled={isMutating} onclick={deleteUser}>
								<Trash2 class="h-4 w-4" />
								Delete Account
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	{/if}
</section>
