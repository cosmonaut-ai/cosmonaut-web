# Atmospheric Effects

## Glow Effects

Apply to elements that need emphasis:

```css
/* Gold glow for CTAs */
box-shadow: 0 0 20px oklch(0.9536 0.0872 97.9082 / 0.4);

/* Subtle text glow */
text-shadow: 0 0 30px oklch(0.9536 0.0872 97.9082 / 0.3);
```

### Button with Glow

```svelte
<Button class="shadow-lg shadow-primary/25">Get Started</Button>
```

### Card with Hover Glow

```svelte
<Card class="transition-shadow hover:shadow-lg hover:shadow-primary/10">
	<!-- Content -->
</Card>
```

## Gradient Backgrounds

### Subtle Card Gradient

```css
background: linear-gradient(
	135deg,
	oklch(0.2662 0.0251 244.0621) 0%,
	oklch(0.2132 0.0183 245.2123) 100%
);
```

### Gold Accent Gradient

```css
background: linear-gradient(
	135deg,
	oklch(0.9536 0.0872 97.9082) 0%,
	oklch(0.507 0.0558 99.0646) 100%
);
```

### World Card Image Placeholder

```svelte
<div class="h-48 bg-gradient-to-br from-primary/20 via-accent/10 to-secondary/20" />
```

## Borders & Dividers

### Gold Accent Border

```svelte
<div class="border-l-4 border-l-primary pl-4">
	<!-- Highlighted content -->
</div>
```

### Subtle Divider

```svelte
<div class="h-px bg-border" />
```
