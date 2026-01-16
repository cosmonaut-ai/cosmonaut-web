# Quick Reference

## Common Patterns

```svelte
<!-- Gold CTA button with glow -->
<Button class="shadow-lg shadow-primary/25">Get Started</Button>

<!-- Card with hover glow -->
<Card class="transition-shadow hover:shadow-lg hover:shadow-primary/10">

<!-- Muted secondary text -->
<p class="text-sm text-muted-foreground">Caption here</p>

<!-- Gold accent border -->
<div class="border-l-4 border-l-primary pl-4">

<!-- Story text styling -->
<p class="font-mono text-lg leading-relaxed">

<!-- Button with loading state -->
<Button disabled={loading}>
	{#if loading}
		<Spinner />
		Loading...
	{:else}
		<Icon class="h-4 w-4" />
		Action
	{/if}
</Button>

<!-- Skeleton placeholder -->
<Skeleton class="h-4 w-full" />

<!-- Toast notification -->
showSuccess('Action completed', 'Optional description');
```

## Import Cheatsheet

```svelte
<script lang="ts">
	// shadcn components
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Select from '$lib/components/ui/select';

	// Query hooks
	import { useWorlds, useCreateWorld, useDeleteWorld } from '$lib/queries';

	// Toast utilities
	import { showSuccess, showError, showInfo, showWarning } from '$lib/utils/toast';

	// Icons
	import { Rocket, Sparkles, ArrowLeft, Plus, Trash2 } from '@lucide/svelte';
</script>
```

## Don't Do

- Don't use gold (`--primary`) for large backgrounds
- Don't mix serif and sans-serif in UI elements
- Don't animate everything—be purposeful
- Don't forget spacing between sections
- Don't use pure white text—use `--foreground`
- Don't use `$navigating` store—it's deprecated in Svelte 5
- Don't block entire pages with full-screen spinners
- Don't use different spinner styles—use `Spinner` consistently
- Don't call API client directly—use query hooks
- Don't manually track loading state when using TanStack Query
