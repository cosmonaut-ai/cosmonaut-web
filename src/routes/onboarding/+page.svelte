<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Switch } from '$lib/components/ui/switch';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Check, X, AtSign } from '@lucide/svelte';
	import { checkUsernameAvailability, updateNewsletter } from '$lib/api/subscription';
	import { useSetUsername, useUser } from '$lib/queries/subscription';
	import { useAuth } from '$lib/auth/auth.svelte';
	import { showSuccess } from '$lib/utils/toast';

	const auth = useAuth();
	const userQuery = useUser();
	const usernameMutation = useSetUsername();

	$effect(() => {
		if (!auth.isLoading && auth.isAuthenticated && userQuery.data?.is_onboarded) {
			goto('/dashboard');
		}
	});

	let username = $state('');
	let newsletterOptIn = $state(true);
	let checkStatus = $state<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
	let validationError = $state<string | null>(null);

	const USERNAME_RE = /^[A-Za-z0-9]+$/;

	const trimmedUsername = $derived(username.trim());

	function validateLocal(value: string): string | null {
		if (value.length === 0) return null;
		if (value.length < 3) return 'Must be at least 3 characters';
		if (value.length > 30) return 'Must be at most 30 characters';
		if (!USERNAME_RE.test(value)) return 'Letters and numbers only';
		return null;
	}

	const canSubmit = $derived(
		checkStatus === 'available' &&
			!validationError &&
			!usernameMutation.isPending &&
			trimmedUsername.length >= 3 &&
			trimmedUsername.length <= 30
	);

	$effect(() => {
		const value = trimmedUsername;
		const error = validateLocal(value);
		validationError = error;

		if (error || value.length === 0) {
			checkStatus = value.length === 0 ? 'idle' : 'invalid';
			return;
		}

		checkStatus = 'checking';
		const tid = setTimeout(() => {
			void (async () => {
				try {
					const result = await checkUsernameAvailability(value);
					if (username.trim() === value) {
						checkStatus = result.available ? 'available' : 'taken';
					}
				} catch {
					if (username.trim() === value) {
						checkStatus = 'idle';
					}
				}
			})();
		}, 300);

		return () => clearTimeout(tid);
	});

	function handleSubmit() {
		if (!canSubmit) return;
		const name = trimmedUsername;
		const optIn = newsletterOptIn;
		usernameMutation.mutate(name, {
			onSuccess: () => {
				if (optIn) {
					void updateNewsletter(true);
				}
				showSuccess(`You're all set, ${name}!`, 'Go conquer the cosmos!');
				goto('/dashboard');
			},
			onError: (err: Error) => {
				if (err.message?.includes('already taken')) {
					checkStatus = 'taken';
				}
			}
		});
	}
</script>

<div
	class="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10 text-foreground"
>
	<Card class="w-full max-w-md border-border/50 bg-card/80 shadow-lg backdrop-blur-sm">
		<CardHeader class="space-y-3 pb-2 text-center">
			<div class="flex items-center justify-center gap-2">
				<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
					<img src="/logo.png" alt="Cosmonaut logo" class="h-7 w-7" />
				</div>
				<span class="font-orbitron text-xl font-semibold text-foreground">Cosmonaut</span>
			</div>
			<CardTitle class="text-lg tracking-tight">A few things to get you started.</CardTitle>
		</CardHeader>
		<CardContent>
			<form
				class="space-y-6"
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
			>
				<div class="space-y-2">
					<label for="onboarding-username" class="text-sm font-medium text-foreground"
						>What should we call you?</label
					>
					<div class="relative">
						<span
							class="pointer-events-none absolute top-1/2 left-3 z-10 -translate-y-1/2 text-muted-foreground"
							aria-hidden="true"
						>
							<AtSign class="size-4" />
						</span>
						<Input
							id="onboarding-username"
							type="text"
							bind:value={username}
							maxlength={30}
							autocomplete="username"
							autocapitalize="off"
							autocorrect="off"
							spellcheck={false}
							placeholder="yourname"
							aria-invalid={validationError !== null || checkStatus === 'taken'}
							class="h-11 pr-11 pl-10 text-base md:text-sm"
						/>
						<div
							class="pointer-events-none absolute top-1/2 right-3 z-10 flex size-5 -translate-y-1/2 items-center justify-center"
							aria-live="polite"
						>
							{#if checkStatus === 'checking'}
								<Spinner class="size-4 text-muted-foreground" />
							{:else if checkStatus === 'available'}
								<Check class="size-4 text-emerald-500" strokeWidth={2.5} aria-hidden="true" />
							{:else if checkStatus === 'taken'}
								<X class="size-4 text-destructive" strokeWidth={2.5} aria-hidden="true" />
							{/if}
						</div>
					</div>

					<p class="text-sm" role="status">
						{#if validationError}
							<span class="text-destructive">{validationError}</span>
						{:else if checkStatus === 'taken'}
							<span class="text-destructive">This username is already taken.</span>
						{:else if checkStatus === 'available'}
							<span class="text-emerald-500">This username is available.</span>
						{:else if checkStatus === 'idle' && trimmedUsername.length > 0}
							<span class="text-muted-foreground"
								>Unable to verify availability. Try again in a moment.</span
							>
						{:else}
							<span class="text-muted-foreground"
								>Letters and numbers only. This can't be changed later.</span
							>
						{/if}
					</p>
				</div>
				<div class="flex items-center justify-between rounded-lg border border-border/50 px-4 py-3">
					<div class="space-y-0.5 pr-4">
						<p class="text-sm font-medium text-foreground">Product updates</p>
						<p class="text-sm text-muted-foreground">Occasional emails about new features</p>
					</div>
					<Switch
						id="newsletter-opt-in"
						checked={newsletterOptIn}
						onCheckedChange={(v) => (newsletterOptIn = v)}
					/>
				</div>

				<div class="flex items-center justify-between gap-4">
					<Button type="submit" class="flex-1" size="lg" disabled={!canSubmit}>
						{#if usernameMutation.isPending}
							<Spinner class="mr-2 size-4" />
							Saving…
						{:else}
							Get Started
						{/if}
					</Button>
				</div>
			</form>
		</CardContent>
	</Card>
</div>
