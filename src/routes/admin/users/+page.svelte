<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { listAdminUsers, type AdminCognitoUser } from '$lib/api/admin';
	import { formatDate, shortId, statusClass, tierClass } from '$lib/admin/format';
	import { queryValue, routeWithQuery } from '$lib/admin/url';
	import CopyButton from '$lib/components/admin/CopyButton.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Spinner } from '$lib/components/ui/spinner';
	import { RefreshCw, Search } from '@lucide/svelte';

	const emailPrefixParam = $derived(queryValue(page.url, 'email_prefix'));
	const cursorParam = $derived(page.url.searchParams.get('cursor'));

	let userSearch = $state('');
	let users = $state<AdminCognitoUser[]>([]);
	let nextCursor = $state<string | null>(null);
	let usersLoading = $state(false);
	let usersError = $state('');
	let requestId = 0;

	$effect(() => {
		const currentRequest = ++requestId;
		userSearch = emailPrefixParam;
		void loadUsers(emailPrefixParam, cursorParam, currentRequest);
	});

	async function loadUsers(
		emailPrefix: string,
		cursor: string | null,
		currentRequest = ++requestId
	) {
		usersLoading = true;
		usersError = '';
		try {
			const response = await listAdminUsers({
				emailPrefix: emailPrefix || undefined,
				cursor
			});
			if (currentRequest !== requestId) return;
			users = response.items;
			nextCursor = response.next_cursor;
		} catch (error) {
			if (currentRequest !== requestId) return;
			usersError = error instanceof Error ? error.message : 'Failed to load users';
		} finally {
			if (currentRequest === requestId) usersLoading = false;
		}
	}

	function submitUserSearch() {
		goto(routeWithQuery(page.url, { email_prefix: userSearch, cursor: null }));
	}

	function refreshUsers() {
		void loadUsers(emailPrefixParam, cursorParam);
	}

	function goToFirstPage() {
		goto(routeWithQuery(page.url, { cursor: null }), { replaceState: false });
	}

	function goToNextPage() {
		if (!nextCursor) return;
		goto(routeWithQuery(page.url, { cursor: nextCursor }), { replaceState: false });
	}
</script>

<section class="space-y-6">
	<div>
		<h2 class="text-xl font-semibold text-foreground">Users</h2>
		<p class="mt-1 text-sm text-muted-foreground">
			Find users, inspect account state, and manage access.
		</p>
	</div>

	<Card class="min-w-0">
		<CardHeader>
			<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<CardTitle>User Directory</CardTitle>
				<form
					class="flex w-full min-w-0 flex-col gap-2 sm:flex-row md:max-w-md"
					onsubmit={(event) => {
						event.preventDefault();
						submitUserSearch();
					}}
				>
					<Input
						bind:value={userSearch}
						placeholder="Search email prefix"
						aria-label="Search user email prefix"
						class="min-w-0"
					/>
					<Button type="submit" disabled={usersLoading}>
						<Search class="h-4 w-4" />
						Search
					</Button>
					{#if emailPrefixParam}
						<Button
							type="button"
							variant="outline"
							disabled={usersLoading}
							onclick={() => {
								userSearch = '';
								goto(routeWithQuery(page.url, { email_prefix: null, cursor: null }));
							}}
						>
							Clear
						</Button>
					{/if}
				</form>
			</div>
		</CardHeader>
		<CardContent>
			{#if usersError}
				<div
					class="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
				>
					{usersError}
				</div>
			{:else if usersLoading && users.length === 0}
				<div class="flex h-52 items-center justify-center">
					<Spinner class="h-6 w-6" />
				</div>
			{:else}
				<div class="overflow-x-auto">
					<table class="w-full min-w-[760px] text-left text-sm">
						<thead class="border-b border-border text-xs text-muted-foreground uppercase">
							<tr>
								<th class="py-3 pr-4 font-medium">User</th>
								<th class="px-4 py-3 font-medium">Tier</th>
								<th class="px-4 py-3 font-medium">Status</th>
								<th class="px-4 py-3 font-medium">Created</th>
								<th class="py-3 pl-4 text-right font-medium">Action</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-border">
							{#each users as user (user.sub)}
								<tr class="hover:bg-muted/30">
									<td class="py-3 pr-4">
										<a
											href={`/admin/users/${user.sub}`}
											class="font-medium text-foreground hover:text-primary hover:underline"
										>
											{user.email || 'No email'}
										</a>
										{#if user.username}
											<div class="mt-1 text-xs text-muted-foreground">@{user.username}</div>
										{/if}
										<div
											class="mt-1 flex items-center gap-1 font-mono text-xs text-muted-foreground"
										>
											{shortId(user.sub)}
											<CopyButton
												value={user.sub}
												label="Copy user ID"
												successLabel="User ID copied"
												class="h-6 w-6 text-muted-foreground"
											/>
										</div>
									</td>
									<td class="px-4 py-3">
										<Badge class={tierClass(user.tier)}>{user.tier}</Badge>
									</td>
									<td class="px-4 py-3">
										<Badge class={statusClass(user.enabled)}>
											{user.enabled === false ? 'Disabled' : user.status || 'Enabled'}
										</Badge>
									</td>
									<td class="px-4 py-3 text-muted-foreground">{formatDate(user.created_at)}</td>
									<td class="py-3 pl-4 text-right">
										<Button href={`/admin/users/${user.sub}`} variant="outline" size="sm">
											Open
										</Button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>

				{#if users.length === 0}
					<p class="mt-4 text-sm text-muted-foreground">No users match the current filters.</p>
				{/if}

				<div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
					<p class="text-sm text-muted-foreground">
						Showing {users.length} user{users.length === 1 ? '' : 's'} on this page.
					</p>
					<div class="flex gap-2">
						<Button variant="outline" size="sm" disabled={usersLoading} onclick={refreshUsers}>
							<RefreshCw class="h-4 w-4" />
							Refresh
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={!cursorParam || usersLoading}
							onclick={goToFirstPage}
						>
							First Page
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={!nextCursor || usersLoading}
							onclick={goToNextPage}
						>
							{#if usersLoading}
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
