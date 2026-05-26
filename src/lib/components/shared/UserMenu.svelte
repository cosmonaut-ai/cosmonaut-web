<script lang="ts">
	import { goto } from '$app/navigation';
	import { isAdminUser, useAuth } from '$lib/auth/auth.svelte';
	import { logger } from '$lib/utils/logger';
	import { useUser } from '$lib/queries';
	import { getTierConfig } from '$lib/config/tiers';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Badge } from '$lib/components/ui/badge';
	import { getDisplayName } from '$lib/utils/displayName';
	import {
		LayoutDashboard,
		Settings,
		CreditCard,
		MessageSquare,
		LogOut,
		ChevronDown,
		ShieldCheck
	} from '@lucide/svelte';

	const auth = useAuth();
	const usageQuery = useUser();

	const displayName = $derived(getDisplayName(auth.user, usageQuery.data?.display_name));
	const tierConfig = $derived(usageQuery.data ? getTierConfig(usageQuery.data.tier) : null);
	const showAdminLink = $derived(isAdminUser(auth.user));

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
				alt={displayName || 'User'}
				class="h-8 w-8 rounded-full ring-2 ring-primary/20"
			/>
		{:else}
			<div
				class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground"
			>
				{(displayName || 'U').charAt(0).toUpperCase()}
			</div>
		{/if}
		{#if displayName}
			<span class="hidden text-sm font-medium text-foreground sm:block">
				<span class="text-muted-foreground/70">@</span>{displayName}
			</span>
		{/if}
		<ChevronDown class="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
	</DropdownMenu.Trigger>

	<DropdownMenu.Content align="end" class="w-56">
		<!-- Tier badge header -->
		<div class="px-2 py-2">
			<p class="text-sm font-medium text-foreground">
				<span class="text-muted-foreground/70">@</span>{displayName || 'User'}
			</p>
			{#if usageQuery.data && tierConfig}
				<Badge class="mt-1 {tierBadgeClass[usageQuery.data.tier] ?? ''}">
					{tierConfig.name} Plan
				</Badge>
			{/if}
		</div>

		<DropdownMenu.Separator />

		<DropdownMenu.Item onclick={() => goto('/dashboard')} class="cursor-pointer">
			<LayoutDashboard class="h-4 w-4" />
			Dashboard
		</DropdownMenu.Item>

		{#if showAdminLink}
			<DropdownMenu.Item onclick={() => goto('/admin/dashboard')} class="cursor-pointer">
				<ShieldCheck class="h-4 w-4" />
				Admin
			</DropdownMenu.Item>
		{/if}

		<DropdownMenu.Item onclick={() => goto('/pricing')} class="cursor-pointer">
			<CreditCard class="h-4 w-4" />
			Plans & Pricing
		</DropdownMenu.Item>

		<DropdownMenu.Item onclick={() => goto('/feedback')} class="cursor-pointer">
			<MessageSquare class="h-4 w-4" />
			Send Feedback
		</DropdownMenu.Item>

		<DropdownMenu.Item onclick={() => goto('/settings')} class="cursor-pointer">
			<Settings class="h-4 w-4" />
			Settings
		</DropdownMenu.Item>

		<DropdownMenu.Separator />

		<DropdownMenu.Item
			onclick={() => {
				auth.logout().catch((error) => logger.error('Failed to log out:', error));
			}}
			class="cursor-pointer"
			variant="destructive"
		>
			<LogOut class="h-4 w-4" />
			Sign Out
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
