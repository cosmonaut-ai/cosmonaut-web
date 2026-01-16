# Loading States & Feedback

Loading states are critical for user experience. They provide feedback that the system is responding and set expectations for wait times. Follow these patterns consistently throughout the application.

## Core Principles

1. **Non-Blocking Navigation** — Navigation should be instant. Never block page transitions with loading states.
2. **Immediate Feedback** — Every user action should provide immediate visual feedback.
3. **Progressive Loading** — Show content as it becomes available. Don't wait for everything.
4. **Contextual Indicators** — Use the right loading indicator for the context (spinner, skeleton, progress bar).
5. **Accessibility** — All loading states must have proper ARIA labels and semantic HTML.

## Svelte 5 Patterns

Use runes exclusively for loading state management. Avoid deprecated Svelte stores.

```svelte
<script lang="ts">
	import { Spinner } from '$lib/components/ui/spinner';

	// Use $state for loading flags
	let loading = $state(false);
	let data = $state<Data | null>(null);

	// Use $derived for computed loading states
	const isReady = $derived(data !== null && !loading);
	const canSubmit = $derived(!loading && formIsValid);

	// Use $effect for data loading side effects
	$effect(() => {
		loadData();
	});

	async function loadData() {
		loading = true;
		try {
			data = await fetchData();
		} finally {
			loading = false;
		}
	}
</script>
```

## Loading Indicator Hierarchy

| Context              | Component       | Usage                                      |
| -------------------- | --------------- | ------------------------------------------ |
| **Buttons**          | `Spinner`       | Form submissions, async actions            |
| **Content sections** | `Skeleton`      | Cards, lists, text blocks during page load |
| **Inline content**   | Small `Spinner` | Inline async operations                    |
| **Long operations**  | Progress bar    | Multi-step processes, file uploads         |
| **Background ops**   | Toast/Badge     | Non-blocking background operations         |

---

## Button Loading States

Use the `Spinner` component from shadcn-svelte for all button loading states.

### Standard Pattern

```svelte
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Rocket } from '@lucide/svelte';

	let loading = $state(false);

	async function handleSubmit() {
		loading = true;
		try {
			await submitForm();
		} finally {
			loading = false;
		}
	}
</script>

<Button onclick={handleSubmit} disabled={loading}>
	{#if loading}
		<Spinner />
		Creating...
	{:else}
		<Rocket class="h-4 w-4" />
		Create World
	{/if}
</Button>
```

### Icon-Only Button

```svelte
<Button variant="ghost" size="icon" disabled={loading} aria-label="Delete">
	{#if loading}
		<Spinner />
	{:else}
		<Trash2 class="h-4 w-4" />
	{/if}
</Button>
```

### Button Variants with Loading

| Variant       | Loading Text                | Use Case                    |
| ------------- | --------------------------- | --------------------------- |
| `default`     | `<Spinner /> Creating...`   | Primary actions             |
| `destructive` | `<Spinner /> Deleting...`   | Destructive actions         |
| `ghost`       | `<Spinner /> Signing in...` | Subtle actions like auth    |
| `outline`     | `<Spinner /> Loading...`    | Secondary prominent actions |

---

## Skeleton Loading States

Use the `Skeleton` component for content placeholders during data loading.

### Card Skeleton

```svelte
<script lang="ts">
	import { Card, CardContent, CardHeader } from '$lib/components/ui/card';
	import { Skeleton } from '$lib/components/ui/skeleton';
</script>

<Card>
	<!-- Image placeholder -->
	<Skeleton class="h-40 w-full rounded-t-lg rounded-b-none" />
	<CardHeader class="pb-3">
		<Skeleton class="h-5 w-3/4" />
		<Skeleton class="mt-2 h-4 w-1/4" />
	</CardHeader>
	<CardContent>
		<Skeleton class="h-4 w-full" />
		<Skeleton class="mt-2 h-4 w-2/3" />
	</CardContent>
</Card>
```

### Text Skeleton

```svelte
<div class="space-y-2">
	<Skeleton class="h-4 w-full" />
	<Skeleton class="h-4 w-full" />
	<Skeleton class="h-4 w-3/4" />
</div>
```

### Avatar Skeleton

```svelte
<div class="flex items-center gap-3">
	<Skeleton class="h-8 w-8 rounded-full" />
	<Skeleton class="h-4 w-24" />
</div>
```

---

## Streaming Content

For AI-generated content, use a typing indicator to show text as it arrives.

```svelte
<script lang="ts">
	let streamingText = $state('');
	let isStreaming = $state(false);
</script>

<div class="prose font-mono">
	{streamingText}
	{#if isStreaming}
		<span class="inline-block h-5 w-2 animate-pulse bg-primary"></span>
	{/if}
</div>
```

---

## Long Operations (Progress Indicators)

For multi-step operations, show progress with status messages.

```svelte
<script lang="ts">
	type Status = 'initialized' | 'processing' | 'finalizing' | 'completed';

	let status = $state<Status>('initialized');

	const statusMessages: Record<Status, string> = {
		initialized: 'Starting...',
		processing: 'Processing data...',
		finalizing: 'Finalizing...',
		completed: 'Complete!'
	};

	function getProgress(s: Status): number {
		const progressMap: Record<Status, number> = {
			initialized: 10,
			processing: 50,
			finalizing: 80,
			completed: 100
		};
		return progressMap[s];
	}
</script>

<div class="space-y-4">
	<p class="text-muted-foreground">{statusMessages[status]}</p>
	<div class="h-2 w-full overflow-hidden rounded-full bg-secondary">
		<div
			class="h-full rounded-full bg-primary transition-all duration-500"
			style="width: {getProgress(status)}%"
		></div>
	</div>
</div>
```

---

## Form Submission Pattern

Keep forms visible during submission. Disable inputs and show spinner in submit button.

```svelte
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Spinner } from '$lib/components/ui/spinner';

	let loading = $state(false);
	let value = $state('');

	async function handleSubmit() {
		loading = true;
		try {
			await submitData(value);
		} finally {
			loading = false;
		}
	}
</script>

<form
	onsubmit={(e) => {
		e.preventDefault();
		handleSubmit();
	}}
>
	<Input bind:value disabled={loading} />
	<Button type="submit" disabled={loading || !value.trim()}>
		{#if loading}
			<Spinner />
			Submitting...
		{:else}
			Submit
		{/if}
	</Button>
</form>
```

---

## Anti-Patterns

**Don't Do:**

- Don't use `$navigating` store — it's deprecated in Svelte 5
- Don't block entire pages with full-screen spinners for navigation
- Don't use different spinner styles across the app — use `Spinner` component consistently
- Don't forget to disable buttons during loading
- Don't hide forms entirely during submission
- Don't use raw `animate-pulse` divs — use `Skeleton` component
- Don't forget loading text — spinners alone don't communicate what's happening

**Do:**

- Use `$state` runes for all loading flags
- Use `$derived` for computed loading states
- Show skeletons for content that's loading
- Show spinners in buttons for actions in progress
- Keep forms visible and disable inputs during submission
- Provide status text alongside loading indicators
- Make navigation instant with component-level loading states
