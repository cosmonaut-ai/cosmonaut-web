<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Check, X, AtSign } from '@lucide/svelte';
	import { checkUsernameAvailability } from '$lib/api/subscription';
	import { useSetUsername } from '$lib/queries/subscription';

	const usernameMutation = useSetUsername();

	let username = $state('');
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
		usernameMutation.mutate(trimmedUsername, {
			onSuccess: () => goto('/dashboard'),
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
			<div class="flex justify-center">
				<img src="/logo.png" alt="Cosmonaut logo" class="h-10 w-10" />
			</div>
			<CardTitle class="font-orbitron text-xl tracking-tight">Choose your username</CardTitle>
			<p class="text-sm text-muted-foreground">
				This will be your permanent identity on Cosmonaut.
			</p>
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
					<label for="onboarding-username" class="sr-only">Username</label>
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

					{#if validationError}
						<p class="text-sm text-destructive" role="status">{validationError}</p>
					{:else if checkStatus === 'taken'}
						<p class="text-sm text-destructive" role="status">This username is already taken.</p>
					{:else if checkStatus === 'available'}
						<p class="text-sm text-emerald-500" role="status">This username is available.</p>
					{:else if checkStatus === 'idle' && trimmedUsername.length > 0 && !validationError}
						<p class="text-sm text-muted-foreground" role="status">
							Unable to verify availability. Try again in a moment.
						</p>
					{/if}
				</div>

				<Button type="submit" class="w-full" size="lg" disabled={!canSubmit}>
					{#if usernameMutation.isPending}
						<Spinner class="mr-2 size-4" />
						Saving…
					{:else}
						Continue
					{/if}
				</Button>
			</form>
		</CardContent>
	</Card>
</div>
