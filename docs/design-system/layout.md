# Layout & Spacing

## Container Widths

| Context          | Max Width  | Class       |
| ---------------- | ---------- | ----------- |
| Landing hero     | Full bleed | `w-full`    |
| Content sections | 1280px     | `max-w-7xl` |
| Reading content  | 768px      | `max-w-3xl` |
| Dialogs          | 512px      | `max-w-lg`  |

## Spacing Scale

Use Tailwind's spacing with these common patterns:

- **Section padding**: `py-24` or `py-32`
- **Card padding**: `p-6`
- **Content gaps**: `gap-8` or `gap-12`
- **Tight spacing**: `gap-2` or `gap-4`

## Responsive Breakpoints

Follow Tailwind defaults:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## Mobile Considerations

- Hero text scales down gracefully
- Cards stack in single column
- Navigation collapses to hamburger menu
- Touch targets minimum 44px

## Common Layout Patterns

### Page Container

```svelte
<div class="min-h-screen bg-background">
	<main class="mx-auto max-w-7xl px-6 py-12">
		<!-- Content -->
	</main>
</div>
```

### Content Container (Narrow)

```svelte
<main class="mx-auto max-w-3xl px-6 py-12">
	<!-- Reading content -->
</main>
```

### Grid Layouts

```svelte
<!-- Cards grid -->
<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
	{#each items as item}
		<Card>{item}</Card>
	{/each}
</div>
```

## Anti-Patterns

- Don't forget spacing between sections
- Don't use fixed widths that break on mobile
