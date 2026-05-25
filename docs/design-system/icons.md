# Iconography

Use **Lucide Icons** (included via shadcn):

```svelte
<script>
	import { Rocket, Map, Sparkles, BookOpen } from '@lucide/svelte';
</script>
```

## Common Icons

| Icon       | Meaning                |
| ---------- | ---------------------- |
| `Rocket`   | Launch, begin journey  |
| `Map`      | Story map, navigation  |
| `Sparkles` | Magic, creation        |
| `BookOpen` | Stories, reading       |
| `Globe`    | Worlds                 |
| `Users`    | Multiplayer, community |
| `Compass`  | Exploration            |

## Icon Sizing

| Context      | Class       |
| ------------ | ----------- |
| Button icon  | `h-4 w-4`   |
| Card icon    | `h-5 w-5`   |
| Feature icon | `h-8 w-8`   |
| Hero icon    | `h-10 w-10` |

## Icon + Text Pattern

```svelte
<Button class="gap-2">
	<Rocket class="h-4 w-4" />
	Create World
</Button>
```
