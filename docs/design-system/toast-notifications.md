# Toast Notifications

Use **Sonner** (via shadcn-svelte) for all toast notifications. Toasts are used for asynchronous feedback that doesn't require user action.

## When to Use Toasts

| Scenario                     | Use Toast? | Example                                   |
| ---------------------------- | ---------- | ----------------------------------------- |
| Async operation success      | Yes        | "World created", "Settings saved"         |
| Async operation error        | Yes        | "Failed to delete world"                  |
| Validation error             | No         | Use inline form validation instead        |
| Background sync complete     | Yes        | "Changes synced"                          |
| Action requires confirmation | No         | Use dialog or inline confirmation instead |

## Setup

The `Toaster` component is already added to the root layout. Toasts are available globally.

```svelte
<!-- Already in +layout.svelte -->
<Toaster richColors />
```

## Usage

Import the toast utility functions from `$lib/utils/toast`:

```svelte
<script lang="ts">
	import { showSuccess, showError, showInfo, showWarning } from '$lib/utils/toast';

	async function handleDelete() {
		try {
			await deleteItem();
			showSuccess('Item deleted');
		} catch (err) {
			showError('Failed to delete item', err.message);
		}
	}
</script>
```

## Toast Variants

### Success

```typescript
showSuccess('World created', 'Your world is being generated');
```

Use for successful operations that don't need further action.

### Error

```typescript
showError('Failed to create world', 'Please check your connection and try again');
```

Use for failed operations. Always include a helpful description when possible.

### Info

```typescript
showInfo('Sync in progress', 'Your changes will be saved automatically');
```

Use for informational messages that don't indicate success or failure.

### Warning

```typescript
showWarning('Unsaved changes', 'You have unsaved changes that will be lost');
```

Use for warnings that the user should be aware of.

## With TanStack Query

Toast notifications are automatically shown by mutation hooks. Don't manually call toast functions when using mutations:

```svelte
<script lang="ts">
	import { useDeleteWorld } from '$lib/queries';

	const deleteMutation = useDeleteWorld();

	function handleDelete(worldId: string) {
		// Toast is shown automatically by the mutation's onSuccess/onError
		deleteMutation.mutate(worldId);
	}
</script>
```

## Best Practices

1. **Be concise** - Toast messages should be short and scannable
2. **Use descriptions sparingly** - Only add descriptions when additional context is needed
3. **Don't stack toasts** - If multiple operations complete, consider a single summary toast
4. **Don't use for validation** - Form validation errors should be shown inline
5. **Don't use for blocking errors** - Critical errors that prevent the user from continuing should use a dialog or error page
