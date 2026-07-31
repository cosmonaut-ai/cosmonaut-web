<script lang="ts">
	import { goto } from '$app/navigation';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { TriangleAlert } from '@lucide/svelte';

	interface Props {
		message?: string;
		onRetry?: () => void;
	}

	let { message = "We couldn't load this page. This might be a temporary issue.", onRetry }: Props =
		$props();
</script>

<div class="min-h-full bg-background">
	<main class="mx-auto max-w-3xl px-6 py-12">
		<Card class="border-destructive/50">
			<CardContent class="flex flex-col items-center py-12 text-center">
				<TriangleAlert class="mb-4 h-8 w-8 text-destructive" />
				<p class="mb-2 font-semibold text-foreground">Something went wrong</p>
				<p class="mb-6 text-sm text-muted-foreground">{message}</p>
				<div class="flex gap-3">
					{#if onRetry}
						<Button variant="outline" onclick={onRetry}>Try Again</Button>
					{/if}
					<Button onclick={() => goto('/dashboard')}>Return to Dashboard</Button>
				</div>
			</CardContent>
		</Card>
	</main>
</div>
