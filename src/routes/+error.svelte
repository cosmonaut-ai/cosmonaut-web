<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Home, LayoutDashboard, AlertTriangle } from '@lucide/svelte';

	const status = $derived(page.status ?? 500);
	const error = $derived(page.error);

	const is404 = $derived(status === 404);
	const title = $derived(is404 ? 'Page not found' : 'Something went wrong');
	const message = $derived(
		is404
			? "The page you're looking for doesn't exist or has been moved."
			: 'An unexpected error occurred. Please try again later.'
	);
</script>

<div class="flex min-h-dvh items-center justify-center bg-background px-6">
	<Card class="w-full max-w-md border-border">
		<CardHeader class="text-center">
			<div
				class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10"
			>
				<AlertTriangle class="h-8 w-8 text-destructive" />
			</div>
			<CardTitle class="text-2xl">{title}</CardTitle>
			<CardDescription class="text-base">{message}</CardDescription>
			<p class="mt-2 font-mono text-sm text-muted-foreground">Error {status}</p>
			{#if error?.message && !is404}
				<p class="mt-1 text-sm text-muted-foreground">{error.message}</p>
			{/if}
		</CardHeader>
		<CardContent class="flex flex-col gap-3 sm:flex-row sm:justify-center">
			<Button href="/" variant="default" class="gap-2">
				<Home class="h-4 w-4" />
				Return Home
			</Button>
			<Button href="/dashboard" variant="outline" class="gap-2">
				<LayoutDashboard class="h-4 w-4" />
				Go to Dashboard
			</Button>
		</CardContent>
	</Card>
</div>
