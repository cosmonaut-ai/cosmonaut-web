# Typography

## Font Families

| Family             | Variable       | Usage                                 |
| ------------------ | -------------- | ------------------------------------- |
| **Inter**          | `--font-sans`  | Body text, UI elements, buttons       |
| **JetBrains Mono** | `--font-mono`  | Story text, narrative content, code   |
| **Georgia**        | `--font-serif` | Editorial moments, quotes (sparingly) |

## Type Scale

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

## Typography Treatments

### Hero Text with Glow

```css
.hero-title {
	@apply text-6xl font-bold tracking-tight;
	text-shadow: 0 0 40px oklch(0.9536 0.0872 97.9082 / 0.3);
}
```

### Story Narrative

```css
.story-text {
	@apply font-mono text-lg leading-relaxed;
}
```

## Anti-Patterns

- Don't mix serif and sans-serif in UI elements
