# Color System

## Dark Theme (Primary)

The application uses dark mode exclusively, creating an immersive, focused environment.

| Token                    | OKLCH Value                     | Usage                                                 |
| ------------------------ | ------------------------------- | ----------------------------------------------------- |
| `--background`           | `oklch(0.2132 0.0183 245.2123)` | Page backgrounds, deep space                          |
| `--foreground`           | `oklch(0.9762 0.0067 233.6393)` | Primary text, high contrast                           |
| `--card`                 | `oklch(0.2662 0.0251 244.0621)` | Elevated surfaces, panels                             |
| `--card-foreground`      | `oklch(0.9762 0.0067 233.6393)` | Text on cards                                         |
| `--primary`              | `oklch(0.9536 0.0872 97.9082)`  | **Gold accent** - CTAs, highlights, active states     |
| `--primary-foreground`   | `oklch(0.2132 0.0183 245.2123)` | Text on gold backgrounds                              |
| `--secondary`            | `oklch(0.377 0.0482 247.087)`   | Subtle backgrounds, secondary actions                 |
| `--secondary-foreground` | `oklch(0.9361 0.0331 243.9581)` | Text on secondary surfaces                            |
| `--muted`                | `oklch(0.3304 0.0391 242.2081)` | Disabled states, subtle dividers                      |
| `--muted-foreground`     | `oklch(0.7828 0.0254 238.5072)` | Secondary text, captions                              |
| `--accent`               | `oklch(0.507 0.0558 99.0646)`   | **Warm gold variant** - hover states, soft highlights |
| `--accent-foreground`    | `oklch(0.9331 0.0122 96.429)`   | Text on accent                                        |
| `--border`               | `oklch(0.3872 0.0379 241.7598)` | Borders, dividers                                     |
| `--destructive`          | `oklch(0.7362 0.2217 339.8177)` | Errors, dangerous actions                             |

## Color Usage Guidelines

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

## Anti-Patterns

- Don't use gold (`--primary`) for large backgrounds
- Don't use pure white text-use `--foreground`
