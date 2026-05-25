# Overview

## Brand Overview

**Cosmonaut** is a choose-your-own-adventure platform where users create and explore unique story worlds. The name evokes space exploration and navigating the infinite possibilities of narrative universes.

### Core Concept

> "Every story is a world waiting to be explored."

The visual identity bridges the elegance of space exploration with the warmth of storytelling. The interface should feel like a command center for narrative discovery-modern, precise, yet inviting.

---

## Visual Identity

### Mood & Atmosphere

- **Modern & Minimalistic**: Clean interfaces with purposeful elements
- **Digital Elegance**: Refined, precise, with subtle technological undertones
- **Warm Exploration**: Despite the dark palette, the experience should feel inviting
- **Art-Heavy**: Every page is a destination-visuals are not decoration, they're atmosphere

### Design Principles

1. **Breathing Space** - Generous whitespace lets content shine. Don't crowd the cosmos.
2. **Gold for Significance** - Reserve `--primary` (gold) for CTAs, active states, and moments that matter.
3. **Depth Through Layers** - Use card elevations, subtle gradients, and atmospheric effects to create dimensionality.
4. **Purposeful Motion** - Animations should feel like traveling through space-smooth, considered, never jarring.

---

## Component Library

**Always use shadcn-svelte components** when available. These components are pre-configured to work with our theme and provide consistent behavior across the application.

### Available Components

The following shadcn-svelte components are installed and should be used:

- **Button** - All interactive buttons
- **Card** - Content containers
- **Dialog** - Modal dialogs
- **Input** - Text inputs
- **Textarea** - Multi-line text
- **Label** - Form labels
- **Select** - Dropdown selects
- **Badge** - Status indicators
- **Alert** - Alert messages
- **Separator** - Dividers
- **Skeleton** - Loading placeholders
- **Spinner** - Loading indicators
- **Sonner** - Toast notifications

### When to Create Custom Components

Only create custom components when:

1. No shadcn-svelte component exists for the use case
2. The component is highly specific to our domain (e.g., `WorldCard`, `StoryCard`)
3. The component composes multiple shadcn components into a reusable pattern

Custom components should still use shadcn primitives internally where applicable.
