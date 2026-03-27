<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { checkAuthState, getIsAuthenticated } from '$lib/auth/auth.svelte';
	import { logger } from '$lib/utils/logger';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Button } from '$lib/components/ui/button';
	import { TriangleAlert } from '@lucide/svelte';

	const REDIRECT_STORAGE_KEY = 'cosmonaut-auth-redirect';

	let error = $state<string | null>(null);
	let checking = $state(true);

	function consumeRedirectUrl(): string {
		let destination: string | null = null;
		try {
			destination = localStorage.getItem(REDIRECT_STORAGE_KEY);
			localStorage.removeItem(REDIRECT_STORAGE_KEY);
		} catch {
			// localStorage might not be available
		}
		return destination || '/dashboard';
	}

	onMount(async () => {
		try {
			await checkAuthState();

			await new Promise((resolve) => setTimeout(resolve, 500));

			if (getIsAuthenticated()) {
				goto(consumeRedirectUrl());
			} else {
				await new Promise((resolve) => setTimeout(resolve, 1000));
				await checkAuthState();

				if (getIsAuthenticated()) {
					goto(consumeRedirectUrl());
				} else {
					error = 'Authentication failed. Please try again.';
				}
			}
		} catch (err) {
			logger.error('Callback error:', err);
			error = err instanceof Error ? err.message : 'Authentication failed';
		} finally {
			checking = false;
		}
	});
</script>

<div
	class="callback-page flex h-full flex-col items-center justify-center bg-background px-4 py-10"
>
	<div class="relative z-10 flex w-full max-w-xs flex-col items-center">
		{#if checking}
			<div class="flex flex-col items-center gap-5">
				<div
					class="flex h-14 w-14 items-center justify-center rounded-full border border-border/50 bg-card/80 shadow-sm backdrop-blur-sm"
				>
					<Spinner class="h-6 w-6 text-primary" />
				</div>
				<div class="flex flex-col items-center gap-1.5">
					<p class="text-sm font-medium text-foreground">Completing sign in</p>
					<p class="text-xs text-muted-foreground">Just a moment...</p>
				</div>
			</div>
		{:else if error}
			<div class="flex w-full flex-col items-center">
				<div
					class="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10"
				>
					<TriangleAlert class="h-6 w-6 text-destructive" />
				</div>
				<h2 class="mb-1.5 text-base font-semibold text-foreground">Something went sideways</h2>
				<p class="mb-6 text-center text-sm text-muted-foreground">{error}</p>
				<div class="flex gap-3">
					<Button variant="outline" onclick={() => goto('/login')}>Try Again</Button>
					<Button onclick={() => goto('/')}>Return Home</Button>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.callback-page {
		position: relative;
		overflow: hidden;
	}
</style>
