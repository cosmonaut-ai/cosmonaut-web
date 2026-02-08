<script lang="ts">
	import { goto } from '$app/navigation';
	import { useAuth } from '$lib/auth/auth.svelte';
	import { useUsage } from '$lib/queries';
	import { getTierConfig } from '$lib/config/tiers';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Badge } from '$lib/components/ui/badge';
	import { Settings, CreditCard, LogOut, ChevronDown } from '@lucide/svelte';

	const auth = useAuth();
	const usageQuery = useUsage();

	const tierConfig = $derived(usageQuery.data ? getTierConfig(usageQuery.data.tier) : null);

	const tierBadgeClass: Record<string, string> = {
		FREE: 'bg-muted text-muted-foreground border-border',
		EXPLORER: 'bg-primary/15 text-primary border-primary/30',
		COSMONAUT: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
	};
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		class="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
	>
		{#if auth.user?.picture}
			<img
				src={auth.user.picture}
				alt={auth.user.name || 'User'}
				class="h-8 w-8 rounded-full ring-2 ring-primary/20"
			/>
		{:else}
			<div
				class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground"
			>
				{(auth.user?.name || auth.user?.email || 'U').charAt(0).toUpperCase()}
			</div>
		{/if}
		{#if auth.user?.name}
			<span class="hidden text-sm font-medium text-foreground sm:block">
				{auth.user.name}
			</span>
		{/if}
		<ChevronDown class="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
	</DropdownMenu.Trigger>

	<DropdownMenu.Content align="end" class="w-56">
		<!-- Tier badge header -->
		<div class="px-2 py-2">
			<p class="text-sm font-medium text-foreground">
				{auth.user?.name || auth.user?.email || 'User'}
			</p>
			{#if usageQuery.data && tierConfig}
				<Badge class="mt-1 {tierBadgeClass[usageQuery.data.tier] ?? ''}">
					{tierConfig.name} Plan
				</Badge>
			{/if}
		</div>

		<DropdownMenu.Separator />

		<DropdownMenu.Item onclick={() => goto('/settings')} class="cursor-pointer">
			<Settings class="h-4 w-4" />
			Settings
		</DropdownMenu.Item>

		<DropdownMenu.Item onclick={() => goto('/pricing')} class="cursor-pointer">
			<CreditCard class="h-4 w-4" />
			Plans & Pricing
		</DropdownMenu.Item>

		<DropdownMenu.Separator />

		<DropdownMenu.Item
			onclick={async () => {
				try {
					await auth.logout();
					goto('/');
				} catch (error) {
					console.error('Failed to log out:', error);
				}
			}}
			class="cursor-pointer"
			variant="destructive"
		>
			<LogOut class="h-4 w-4" />
			Sign Out
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
