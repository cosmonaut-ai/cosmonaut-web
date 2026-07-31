<script lang="ts">
	import { goto } from '$app/navigation';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';

	interface Props {
		message?: string;
	}

	let { message = "This doesn't exist - or it's been deleted." }: Props = $props();
</script>

<div class="min-h-full bg-background">
	<main class="mx-auto max-w-3xl px-6 py-12">
		<Card class="border-destructive/50">
			<CardContent class="py-12 text-center">
				<p class="mb-4 text-muted-foreground">{message}</p>
				<Button onclick={() => goto('/dashboard')}>Return to Dashboard</Button>
			</CardContent>
		</Card>
	</main>
</div>
