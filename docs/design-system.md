# Cosmonaut Design System

## Brand Overview

**Cosmonaut** is a choose-your-own-adventure platform where users create and explore unique story worlds. The name evokes space exploration—navigating the infinite possibilities of narrative universes.

### Core Concept

> "Every story is a world waiting to be explored."

The visual identity bridges the elegance of space exploration with the warmth of storytelling. The interface should feel like a command center for narrative discovery—modern, precise, yet inviting.

---

## Visual Identity

### Mood & Atmosphere

- **Modern & Minimalistic**: Clean interfaces with purposeful elements
- **Digital Elegance**: Refined, precise, with subtle technological undertones
- **Warm Exploration**: Despite the dark palette, the experience should feel inviting
- **Art-Heavy**: Every page is a destination—visuals are not decoration, they're atmosphere

### Design Principles

1. **Breathing Space** — Generous whitespace lets content shine. Don't crowd the cosmos.
2. **Gold for Significance** — Reserve `--primary` (gold) for CTAs, active states, and moments that matter.
3. **Depth Through Layers** — Use card elevations, subtle gradients, and atmospheric effects to create dimensionality.
4. **Purposeful Motion** — Animations should feel like traveling through space—smooth, considered, never jarring.

---

## Color System

### Dark Theme (Primary)

The application uses dark mode exclusively, creating an immersive, focused environment.

| Token                    | OKLCH Value                     | Usage                                                 |
| ------------------------ | ------------------------------- | ----------------------------------------------------- |
| `--background`           | `oklch(0.2132 0.0183 245.2123)` | Page backgrounds, deep space                          |
| `--foreground`           | `oklch(0.9762 0.0067 233.6393)` | Primary text, high contrast                           |
| `--card`                 | `oklch(0.2662 0.0251 244.0621)` | Elevated surfaces, panels                             |
| `--card-foreground`      | `oklch(0.9762 0.0067 233.6393)` | Text on cards                                         |
| `--primary`              | `oklch(0.9536 0.0872 97.9082)`  | **Gold accent** — CTAs, highlights, active states     |
| `--primary-foreground`   | `oklch(0.2132 0.0183 245.2123)` | Text on gold backgrounds                              |
| `--secondary`            | `oklch(0.377 0.0482 247.087)`   | Subtle backgrounds, secondary actions                 |
| `--secondary-foreground` | `oklch(0.9361 0.0331 243.9581)` | Text on secondary surfaces                            |
| `--muted`                | `oklch(0.3304 0.0391 242.2081)` | Disabled states, subtle dividers                      |
| `--muted-foreground`     | `oklch(0.7828 0.0254 238.5072)` | Secondary text, captions                              |
| `--accent`               | `oklch(0.507 0.0558 99.0646)`   | **Warm gold variant** — hover states, soft highlights |
| `--accent-foreground`    | `oklch(0.9331 0.0122 96.429)`   | Text on accent                                        |
| `--border`               | `oklch(0.3872 0.0379 241.7598)` | Borders, dividers                                     |
| `--destructive`          | `oklch(0.7362 0.2217 339.8177)` | Errors, dangerous actions                             |

### Color Usage Guidelines

```
┌─────────────────────────────────────────────────────────────┐
│  BACKGROUND (deep space blue)                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  CARD (elevated panel)                                │  │
│  │                                                       │  │
│  │  FOREGROUND text here                                 │  │
│  │  MUTED-FOREGROUND for secondary info                  │  │
│  │                                                       │  │
│  │  ┌─────────────────┐  ┌─────────────────┐            │  │
│  │  │ PRIMARY (gold)  │  │ SECONDARY       │            │  │
│  │  │ Main CTA        │  │ Alt action      │            │  │
│  │  └─────────────────┘  └─────────────────┘            │  │
│  │                                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Typography

### Font Families

| Family             | Variable       | Usage                                 |
| ------------------ | -------------- | ------------------------------------- |
| **Inter**          | `--font-sans`  | Body text, UI elements, buttons       |
| **JetBrains Mono** | `--font-mono`  | Story text, narrative content, code   |
| **Georgia**        | `--font-serif` | Editorial moments, quotes (sparingly) |

### Type Scale

Use Tailwind's built-in scale with these semantic applications:

| Size      | Class                    | Usage                        |
| --------- | ------------------------ | ---------------------------- |
| Display   | `text-5xl` to `text-7xl` | Hero headlines, landing page |
| Heading 1 | `text-4xl`               | Page titles                  |
| Heading 2 | `text-2xl` to `text-3xl` | Section headers              |
| Heading 3 | `text-xl`                | Card titles, subsections     |
| Body      | `text-base`              | Primary content              |
| Small     | `text-sm`                | Captions, metadata           |
| Tiny      | `text-xs`                | Labels, badges               |

### Typography Treatments

**Hero Text with Glow**

```css
.hero-title {
	@apply text-6xl font-bold tracking-tight;
	text-shadow: 0 0 40px oklch(0.9536 0.0872 97.9082 / 0.3);
}
```

**Story Narrative**

```css
.story-text {
	@apply font-mono text-lg leading-relaxed;
}
```

---

## Components

### Buttons

#### Primary (Gold CTA)

```svelte
<Button>Begin Your Journey</Button>
```

- Background: `bg-primary`
- Text: `text-primary-foreground`
- Hover: Subtle glow effect
- Use for: Main actions, sign up, create world

#### Secondary

```svelte
<Button variant="secondary">Learn More</Button>
```

- Background: `bg-secondary`
- Text: `text-secondary-foreground`
- Use for: Alternative actions, cancel, back

#### Ghost

```svelte
<Button variant="ghost">Sign In</Button>
```

- Background: Transparent
- Text: `text-foreground`
- Hover: `bg-secondary`
- Use for: Navigation, subtle actions

#### Outline

```svelte
<Button variant="outline">View Map</Button>
```

- Border: `border-primary`
- Text: `text-primary`
- Use for: Secondary prominent actions

### Cards

#### World Card

Used for displaying story worlds in grids.

```svelte
<Card class="group transition-colors hover:border-primary/50">
	<div class="h-48 bg-gradient-to-br from-primary/20 to-accent/10" />
	<CardHeader>
		<CardTitle>World Title</CardTitle>
		<CardDescription>Genre • Author</CardDescription>
	</CardHeader>
	<CardContent>
		<p class="line-clamp-2 text-muted-foreground">Description...</p>
	</CardContent>
</Card>
```

#### Story Node Card

Used for displaying narrative content.

```svelte
<Card class="border-l-4 border-l-primary">
	<CardContent class="font-mono">Story text here...</CardContent>
</Card>
```

### Form Elements

All inputs use the shadcn defaults which map to our theme:

- Background: `bg-background`
- Border: `border-input`
- Focus ring: `ring-ring`

---

## Animation Patterns

### Transitions

Use smooth, space-inspired animations:

```css
/* Standard transition */
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

/* Slide transitions for story branches */
transition:
	transform 0.5s cubic-bezier(0.4, 0, 0.2, 1),
	opacity 0.3s ease-out;
```

### Motion Guidelines

1. **Enter**: Fade in + slight upward motion
2. **Exit**: Fade out + slide left (for story branches)
3. **Hover**: Subtle scale (1.02) or glow
4. **Focus**: Ring animation

### Starfield Animation

The landing page features an animated starfield background:

- Multiple layers of stars at different speeds
- Subtle parallax on scroll
- Gentle twinkling effect

---

## Spacing & Layout

### Container Widths

| Context          | Max Width  | Class       |
| ---------------- | ---------- | ----------- |
| Landing hero     | Full bleed | `w-full`    |
| Content sections | 1280px     | `max-w-7xl` |
| Reading content  | 768px      | `max-w-3xl` |
| Dialogs          | 512px      | `max-w-lg`  |

### Spacing Scale

Use Tailwind's spacing with these common patterns:

- **Section padding**: `py-24` or `py-32`
- **Card padding**: `p-6`
- **Content gaps**: `gap-8` or `gap-12`
- **Tight spacing**: `gap-2` or `gap-4`

---

## Iconography

Use **Lucide Icons** (included via shadcn):

```svelte
<script>
	import { Rocket, Map, Sparkles, BookOpen } from '@lucide/svelte';
</script>
```

### Icon Usage

| Icon       | Meaning                |
| ---------- | ---------------------- |
| `Rocket`   | Launch, begin journey  |
| `Map`      | Story map, navigation  |
| `Sparkles` | Magic, creation        |
| `BookOpen` | Stories, reading       |
| `Globe`    | Worlds                 |
| `Users`    | Multiplayer, community |
| `Compass`  | Exploration            |

---

## Atmospheric Effects

### Glow Effects

Apply to elements that need emphasis:

```css
/* Gold glow for CTAs */
box-shadow: 0 0 20px oklch(0.9536 0.0872 97.9082 / 0.4);

/* Subtle text glow */
text-shadow: 0 0 30px oklch(0.9536 0.0872 97.9082 / 0.3);
```

### Gradient Backgrounds

```css
/* Subtle card gradient */
background: linear-gradient(
	135deg,
	oklch(0.2662 0.0251 244.0621) 0%,
	oklch(0.2132 0.0183 245.2123) 100%
);

/* Gold accent gradient */
background: linear-gradient(
	135deg,
	oklch(0.9536 0.0872 97.9082) 0%,
	oklch(0.507 0.0558 99.0646) 100%
);
```

---

## Responsive Design

### Breakpoints

Follow Tailwind defaults:

- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Mobile Considerations

- Hero text scales down gracefully
- Cards stack in single column
- Navigation collapses to hamburger menu
- Touch targets minimum 44px

---

## Accessibility

### Color Contrast

All text combinations meet WCAG AA standards:

- Foreground on background: ✓
- Primary-foreground on primary: ✓
- Muted-foreground on card: ✓

### Focus States

All interactive elements have visible focus rings using `ring-ring`.

### Motion

Respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
	* {
		animation-duration: 0.01ms !important;
		transition-duration: 0.01ms !important;
	}
}
```

---

## Quick Reference

### Common Patterns

```svelte
<!-- Gold CTA button -->
<Button class="shadow-lg shadow-primary/25">Get Started</Button>

<!-- Card with hover glow -->
<Card class="transition-shadow hover:shadow-lg hover:shadow-primary/10">

<!-- Muted secondary text -->
<p class="text-muted-foreground text-sm">Caption here</p>

<!-- Gold accent border -->
<div class="border-l-4 border-l-primary pl-4">

<!-- Story text styling -->
<p class="font-mono leading-relaxed text-lg">
```

### Don't Do

- Don't use gold (`--primary`) for large backgrounds
- Don't mix serif and sans-serif in UI elements
- Don't animate everything—be purposeful
- Don't forget spacing between sections
- Don't use pure white text—use `--foreground`
