# Accessibility

## Color Contrast

All text combinations meet WCAG AA standards:

- Foreground on background: ✓
- Primary-foreground on primary: ✓
- Muted-foreground on card: ✓

## Focus States

All interactive elements have visible focus rings using `ring-ring`.

```svelte
<Button class="focus:ring-2 focus:ring-ring focus:ring-offset-2">Click me</Button>
```

## Motion

Respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
	* {
		animation-duration: 0.01ms !important;
		transition-duration: 0.01ms !important;
	}
}
```

## Touch Targets

Minimum touch target size is 44x44px:

```svelte
<!-- Icon button with proper touch target -->
<Button variant="ghost" size="icon" class="h-11 w-11">
	<Icon class="h-4 w-4" />
</Button>
```

## ARIA Labels

Provide labels for icon-only buttons and non-text content:

```svelte
<Button variant="ghost" size="icon" aria-label="Delete world">
	<Trash2 class="h-4 w-4" />
</Button>

<img src={world.image} alt={world.title} />
```

## Loading State Accessibility

```svelte
<Button disabled={loading} aria-busy={loading}>
	{#if loading}
		<Spinner aria-hidden="true" />
		<span>Loading...</span>
	{:else}
		Submit
	{/if}
</Button>
```

## Semantic HTML

Use appropriate semantic elements:

- `<header>` for page headers
- `<main>` for primary content
- `<nav>` for navigation
- `<section>` for content sections
- `<article>` for self-contained content
- `<button>` for interactive elements (not `<div onclick>`)
