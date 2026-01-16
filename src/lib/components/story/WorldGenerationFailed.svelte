<script lang="ts">
	import { goto } from '$app/navigation';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Sparkles, ArrowLeft } from '@lucide/svelte';
</script>

<div class="h-full overflow-y-auto bg-background">
	<header class="border-b border-border bg-card/50">
		<div class="mx-auto flex max-w-3xl items-center gap-4 px-6 py-4">
			<Button variant="ghost" size="sm" onclick={() => goto('/dashboard')} class="gap-2">
				<ArrowLeft class="h-4 w-4" />
				Back
			</Button>
		</div>
	</header>

	<main class="mx-auto max-w-3xl px-6 py-12">
		<Card class="border-destructive/50">
			<CardContent class="py-12">
				<div class="flex flex-col items-center">
					<div
						class="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-destructive/30 bg-destructive/10"
					>
						<Sparkles class="h-10 w-10 text-destructive" />
					</div>

					<h2 class="mb-2 text-2xl font-bold text-foreground">World Generation Failed</h2>
					<p class="mb-8 text-muted-foreground">
						Something went wrong while creating your world. Please try again.
					</p>

					<Button onclick={() => goto('/worlds/new')} class="gap-2">
						<Sparkles class="h-4 w-4" />
						Try Again
					</Button>
				</div>
			</CardContent>
		</Card>
	</main>
</div>
