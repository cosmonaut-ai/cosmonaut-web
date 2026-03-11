<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { checkAuthState, getIsAuthenticated } from '$lib/auth/auth.svelte';
	import { logger } from '$lib/utils/logger';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { AlertTriangle } from '@lucide/svelte';

	const REDIRECT_STORAGE_KEY = 'cosmonaut-auth-redirect';

	let error = $state<string | null>(null);
	let checking = $state(true);

	/**
	 * Read and clear the stored post-auth redirect URL.
	 * Falls back to /dashboard when no redirect was stored.
	 */
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
			// Amplify automatically handles the code exchange when configured
			// We just need to wait for it to complete and check auth state
			await checkAuthState();

			// Give Amplify a moment to finish processing
			await new Promise((resolve) => setTimeout(resolve, 500));

			if (getIsAuthenticated()) {
				try {
					const optedIn = localStorage.getItem('cosmonaut-newsletter-opt-in');
					if (optedIn === 'true') {
						const { updateNewsletter } = await import('$lib/api/subscription');
						await updateNewsletter(true);
					}
					localStorage.removeItem('cosmonaut-newsletter-opt-in');
				} catch {
					// Newsletter sync is non-critical
				}
				goto(consumeRedirectUrl());
			} else {
				// Check again after a delay
				await new Promise((resolve) => setTimeout(resolve, 1000));
				await checkAuthState();

				if (getIsAuthenticated()) {
					try {
						const optedIn = localStorage.getItem('cosmonaut-newsletter-opt-in');
						if (optedIn === 'true') {
							const { updateNewsletter } = await import('$lib/api/subscription');
							await updateNewsletter(true);
						}
						localStorage.removeItem('cosmonaut-newsletter-opt-in');
					} catch {
						// Newsletter sync is non-critical
					}
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

<div class="flex h-full items-center justify-center bg-background">
	<Card class="w-full max-w-md">
		<CardContent class="py-12">
			{#if checking}
				<div class="flex flex-col items-center gap-4">
					<Spinner class="h-8 w-8 text-primary" />
					<p class="text-muted-foreground">Completing sign in...</p>
				</div>
			{:else if error}
				<div class="flex flex-col items-center text-center">
					<div
						class="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10"
					>
						<AlertTriangle class="h-6 w-6 text-destructive" />
					</div>
					<h2 class="mb-2 text-xl font-semibold text-foreground">Authentication Failed</h2>
					<p class="mb-6 text-muted-foreground">{error}</p>
					<Button onclick={() => goto('/')}>Return Home</Button>
				</div>
			{/if}
		</CardContent>
	</Card>
</div>
