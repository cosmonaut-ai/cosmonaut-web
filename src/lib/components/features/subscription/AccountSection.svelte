<script lang="ts">
	import { useAuth } from '$lib/auth/auth.svelte';
	import { useUser } from '$lib/queries/subscription';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { User } from '@lucide/svelte';

	const auth = useAuth();
	const usageQuery = useUser();

	const displayName = $derived(
		auth.user?.username || usageQuery.data?.display_name || auth.user?.email
	);
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
					alt={displayName || 'User'}
					class="h-16 w-16 rounded-full ring-2 ring-primary/20"
				/>
			{:else}
				<div
					class="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-xl font-medium text-primary-foreground"
				>
					{(displayName || 'U').charAt(0).toUpperCase()}
				</div>
			{/if}
			<div>
				{#if displayName}
					<p class="text-lg font-medium text-foreground">{displayName}</p>
				{/if}
				{#if auth.user?.email}
					<p class="text-sm text-muted-foreground">{auth.user.email}</p>
				{/if}
			</div>
		</div>
	</CardContent>
</Card>
