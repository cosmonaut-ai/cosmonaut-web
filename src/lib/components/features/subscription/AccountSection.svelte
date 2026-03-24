<script lang="ts">
	import { useAuth } from '$lib/auth/auth.svelte';
	import { useUser } from '$lib/queries/subscription';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { User } from '@lucide/svelte';

	const auth = useAuth();
	const usageQuery = useUser();
</script>

<Card>
	<CardHeader>
		<div class="flex items-center gap-2">
			<User class="h-5 w-5 text-primary" />
			<CardTitle>Account</CardTitle>
		</div>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="flex items-center gap-4">
			{#if auth.user?.picture}
				<img
					src={auth.user.picture}
					alt={auth.user.name || 'User'}
					class="h-16 w-16 rounded-full ring-2 ring-primary/20"
				/>
			{:else}
				<div
					class="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-medium text-primary-foreground"
				>
					{(auth.user?.name || auth.user?.email || 'U').charAt(0).toUpperCase()}
				</div>
			{/if}
			<div>
				{#if auth.user?.name}
					<p class="text-lg font-medium text-foreground">{auth.user.name}</p>
				{/if}
				{#if usageQuery.data?.username}
					<p class="text-sm font-medium text-muted-foreground">@{usageQuery.data.username}</p>
				{/if}
				{#if auth.user?.email}
					<p class="text-sm text-muted-foreground">{auth.user.email}</p>
				{/if}
			</div>
		</div>
	</CardContent>
</Card>
