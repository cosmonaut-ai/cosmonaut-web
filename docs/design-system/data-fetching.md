# Data Fetching

Use **TanStack Query** for all API data fetching. This provides caching, automatic refetching, and consistent loading/error states.

## Architecture

We use a "middle layer" architecture:

```
Component → Query Hook → API Client → Server
```

- **Components** use query hooks for data
- **Query hooks** (`$lib/queries/`) wrap API calls with caching and mutations
- **API clients** (`$lib/api/`) make raw fetch calls through shared helpers in `$lib/api/core.ts`

## Query Hooks

Query hooks are located in `$lib/queries/`. Import them in components:

```svelte
<script lang="ts">
	import { useWorlds, useWorld, useCreateWorld, useDeleteWorld } from '$lib/queries';
</script>
```

### Available Hooks

#### Worlds

| Hook                    | Type     | Description             |
| ----------------------- | -------- | ----------------------- |
| `useWorlds()`           | Query    | Fetch all user's worlds |
| `useWorld(id, opts)`    | Query    | Fetch a single world    |
| `useCreateWorld()`      | Mutation | Create a new world      |
| `useDeleteWorld()`      | Mutation | Delete a world          |
| `useUpdateWorldSharing` | Mutation | Update sharing settings |

#### Nodes

| Hook                   | Type     | Description              |
| ---------------------- | -------- | ------------------------ |
| `useWorldNodes(id)`    | Query    | Fetch all nodes in world |
| `useNode(worldId, id)` | Query    | Fetch a single node      |
| `useChooseOption(id)`  | Mutation | Choose a story option    |

---

## Using Queries

### Basic Query

```svelte
<script lang="ts">
	import { useWorlds } from '$lib/queries';
	import { Skeleton } from '$lib/components/ui/skeleton';

	const worldsQuery = useWorlds();
</script>

{#if worldsQuery.isLoading}
	<Skeleton class="h-20 w-full" />
{:else if worldsQuery.isError}
	<p class="text-destructive">Failed to load: {worldsQuery.error.message}</p>
{:else}
	{#each worldsQuery.data ?? [] as world}
		<WorldCard {world} />
	{/each}
{/if}
```

**Note**: Query hooks wrap their options in accessor functions (`() => ({...})`) for Svelte 5 reactivity. This is handled internally in the query hooks - you don't need to worry about it when using them.

### Query with Polling

For data that updates server-side (like world generation status):

```svelte
<script lang="ts">
	import { useWorld } from '$lib/queries';

	const worldId = 'abc123';

	// Enable polling until world is complete
	const worldQuery = useWorld(worldId, { enablePolling: true });
</script>
```

---

## Using Mutations

### Basic Mutation

```svelte
<script lang="ts">
	import { useDeleteWorld } from '$lib/queries';
	import { Button } from '$lib/components/ui/button';
	import { Spinner } from '$lib/components/ui/spinner';

	const deleteMutation = useDeleteWorld();

	function handleDelete(worldId: string) {
		$deleteMutation.mutate(worldId);
	}
</script>

<Button
	variant="destructive"
	onclick={() => handleDelete(world.id)}
	disabled={deleteMutation.isPending}
>
	{#if deleteMutation.isPending}
		<Spinner />
		Deleting...
	{:else}
		Delete
	{/if}
</Button>
```

### Mutation with Callbacks

```svelte
<script lang="ts">
	import { useCreateWorld } from '$lib/queries';
	import { goto } from '$app/navigation';

	const createMutation = useCreateWorld();

	function handleCreate() {
		createMutation.mutate(
			{ world_prompt: prompt, visibility: 'private' },
			{
				onSuccess: (world) => {
					goto(`/worlds/${world.id}`);
				}
			}
		);
	}
</script>
```

---

## Query Keys

Query keys are used for cache invalidation. They're exported from the unified query key factory:

```typescript
import { queryKeys } from '$lib/queries';

// queryKeys.worlds.all -> ['worlds']
// queryKeys.worlds.detail(id) -> ['worlds', id]
// queryKeys.nodes.all(worldId) -> ['worlds', worldId, 'nodes']
// queryKeys.nodes.detail(worldId, nodeId) -> ['worlds', worldId, 'nodes', nodeId]
```

---

## Streaming Content

TanStack Query doesn't handle Server-Sent Events (SSE). For streaming content, use the API client directly:

```svelte
<script lang="ts">
	import { generateNodeText } from '$lib/api/nodes';

	let streamingText = $state('');

	async function streamContent() {
		await generateNodeText(worldId, nodeId, (text, done) => {
			streamingText = text;
		});
	}
</script>
```

---

## Best Practices

1. **Always use query hooks** - Don't call API client directly in components
2. **Don't duplicate loading state** - Use `query.isLoading` and `mutation.isPending`
3. **Let mutations handle toasts** - Mutations automatically show success/error toasts
4. **Use derived state** - Derive UI state from query state, not separate `$state`
5. **Don't use $ prefix** - TanStack Query returns plain objects, not Svelte stores

### Anti-Patterns

```svelte
<!-- Don't do this -->
<script>
	let loading = $state(false);
	let data = $state(null);

	async function loadData() {
		loading = true;
		data = await getWorlds();
		loading = false;
	}
</script>

<!-- Do this instead -->
<script>
	import { useWorlds } from '$lib/queries';
	const query = useWorlds();
	// Use query.isLoading and query.data directly
</script>
```
