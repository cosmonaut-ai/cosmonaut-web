<script lang="ts">
	import { Card, CardContent, CardHeader } from '$lib/components/ui/card';
	import { Skeleton } from '$lib/components/ui/skeleton';
</script>

<Card class="overflow-hidden">
	<!-- Image placeholder -->
	<Skeleton class="h-40 w-full rounded-b-none" />

	<CardHeader class="pb-3">
		<div class="flex items-start justify-between gap-3">
			<Skeleton class="h-5 w-3/4" />
			<Skeleton class="h-5 w-16" />
		</div>
		<Skeleton class="mt-2 h-5 w-20" />
	</CardHeader>

	<CardContent class="pt-0">
		<div class="mb-4 space-y-2">
			<Skeleton class="h-4 w-full" />
			<Skeleton class="h-4 w-2/3" />
		</div>

		<!-- Footer -->
		<div class="flex items-center justify-between border-t border-border pt-3">
			<Skeleton class="h-4 w-24" />
			<Skeleton class="h-7 w-7 rounded-md" />
		</div>
	</CardContent>
</Card>
