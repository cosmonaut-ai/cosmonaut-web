<script lang="ts">
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Spinner } from '$lib/components/ui/spinner';
</script>

<div class="min-h-full bg-background">
	<header class="border-b border-border bg-card/50">
		<div class="mx-auto flex max-w-3xl items-center gap-4 px-6 py-4">
			<Skeleton class="h-8 w-20" />
			<div class="h-4 w-px bg-border"></div>
			<Skeleton class="h-6 w-48" />
		</div>
	</header>
	<main class="mx-auto max-w-4xl px-6 py-8">
		<Card>
			<CardContent class="flex items-center justify-center py-16">
				<Spinner class="h-8 w-8" />
			</CardContent>
		</Card>
	</main>
</div>
