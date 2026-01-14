<script lang="ts">
	import { Rocket } from '@lucide/svelte';
</script>

<footer class="relative border-t border-border/30 bg-background/50 py-12 backdrop-blur-sm">
	<div class="mx-auto max-w-7xl px-6">
		<div class="flex flex-col items-center justify-between gap-8 md:flex-row">
			<!-- Logo & tagline -->
			<div class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10"
				>
					<Rocket class="h-5 w-5 text-primary" />
				</div>
				<div>
					<p class="font-semibold text-foreground">Cosmonaut</p>
					<p class="text-sm text-muted-foreground">Explore infinite worlds</p>
				</div>
			</div>

			<!-- Links -->
			<nav class="flex flex-wrap items-center justify-center gap-6 text-sm">
				<a href="/about" class="text-muted-foreground transition-colors hover:text-foreground">
					About
				</a>
				<a href="/docs" class="text-muted-foreground transition-colors hover:text-foreground">
					Documentation
				</a>
				<a href="/privacy" class="text-muted-foreground transition-colors hover:text-foreground">
					Privacy
				</a>
				<a href="/terms" class="text-muted-foreground transition-colors hover:text-foreground">
					Terms
				</a>
			</nav>

			<!-- Copyright -->
			<p class="text-sm text-muted-foreground">
				© {new Date().getFullYear()} Cosmonaut. All rights reserved.
			</p>
		</div>
	</div>
</footer>
