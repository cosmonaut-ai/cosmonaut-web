# Architecture

`cosmonaut-web` is a SvelteKit 2 / Svelte 5 single-page application for an AI-powered interactive storytelling platform. It uses `adapter-static` (fully client-side, no SSR) and communicates with a separate FastAPI backend via REST + SSE.

## Folder Structure

```
src/
├── lib/
│   ├── api/                          # Typed service layer (one module per domain)
│   │   ├── core.ts                   # Shared fetch helpers, auth headers, error handling
│   │   ├── worlds.ts                 # World CRUD operations
│   │   ├── nodes.ts                  # Node fetch, choose, streaming text generation
│   │   ├── voices.ts                 # TTS voice list + audio generation
│   │   ├── subscription.ts           # Usage, checkout, billing portal
│   │   └── feedback.ts               # Feedback submission
│   ├── auth/
│   │   └── auth.svelte.ts            # Module-level $state auth store (Amplify/Cognito)
│   ├── components/
│   │   ├── ui/                       # shadcn-svelte primitives (auto-generated)
│   │   ├── shared/                   # Cross-feature reusable components
│   │   │   ├── SEO.svelte
│   │   │   ├── AppFooter.svelte
│   │   │   ├── ConstellationDivider.svelte
│   │   │   ├── FlowNode.svelte
│   │   │   └── UserMenu.svelte
│   │   └── features/                 # Domain-scoped components
│   │       ├── worlds/               # World cards, hero, details, share modal
│   │       ├── stories/              # Story card, node view, streaming hook, choices
│   │       ├── narrator/             # Audio narration, player bar, voice picker
│   │       ├── auth/                 # Sign-in/up forms, verification, password reset
│   │       ├── subscription/         # Pricing, usage bars, upgrade prompts, settings sections
│   │       └── landing/              # Hero, features, demo story, starfield canvas
│   ├── config/
│   │   ├── index.ts                  # Environment variables, Cognito config
│   │   └── tiers.ts                  # Subscription tier definitions
│   ├── queries/                      # TanStack Query hooks
│   │   ├── keys.ts                   # Unified query key factory (queryKeys.*)
│   │   ├── client.ts                 # QueryClient configuration
│   │   ├── worlds.ts                 # useWorlds, useWorld, useCreateWorld, etc.
│   │   ├── nodes.ts                  # useNode, useWorldNodes, useChooseOption, etc.
│   │   ├── voices.ts                 # useVoices
│   │   ├── subscription.ts           # useUser, useCheckout, useBillingPortal
│   │   ├── feedback.ts               # useFeedback
│   │   └── index.ts                  # Barrel re-export for queries + queryKeys
│   ├── types/
│   │   ├── api.ts                    # API domain types (World, StoryNode, Choice, etc.)
│   │   └── subscription.ts           # Subscription types (UsageInfo, tiers)
│   └── utils/                        # Pure utility functions
│       ├── analytics.ts              # Google Analytics (gtag) wrappers
│       ├── date.ts                   # Date formatting
│       ├── logger.ts                 # Structured logging
│       ├── nodeTransform.ts          # StoryNode → SvelteFlow graph layout
│       └── toast.ts                  # Sonner toast helpers
└── routes/                           # SvelteKit file-based routing
    ├── +layout.svelte                # Global layout, auth guard, header/footer
    ├── +page.svelte                  # Landing page
    ├── dashboard/                    # User's worlds list
    ├── worlds/
    │   ├── new/                      # World creation form
    │   └── [worldId]/
    │       ├── +layout.svelte        # World-scoped layout (header, loading, error)
    │       ├── +page.svelte          # World home page
    │       ├── graph/                # SvelteFlow story map (lazy-loaded)
    │       └── nodes/[nodeId]/       # Story node view
    ├── login/                        # Auth page (orchestrates forms from features/auth/)
    ├── settings/                     # Account + subscription management
    ├── pricing/                      # Pricing plans
    ├── feedback/                     # User feedback form
    └── about|privacy|terms/          # Static legal pages
```

## State Management Tiers

1. **Local `$state`** — Component-scoped UI state (form inputs, toggles, modals).
2. **Module-level `$state`** — Auth store (`$lib/auth/auth.svelte.ts`), accessed via `useAuth()`.
3. **TanStack Query** — All server state. The single source of truth for API data.
4. **`$derived`** — Computed values from the above, never stored separately.

Guideline: Never duplicate TanStack Query cache data into local `$state`. Use `$derived` to compute display values from query results. Use `$state.raw()` for API response objects that are replaced wholesale (not deeply mutated).

## Data Fetching Conventions

- **All API data** flows through TanStack Query hooks in `$lib/queries/`.
- **No `load()` functions** or form actions — this is a client-side SPA.
- API functions in `$lib/api/` are thin typed wrappers around `fetch()`.
- Streaming text generation uses SSE via `$lib/api/nodes.ts → generateNodeText()`.

## Query Key Convention

All query keys are defined in `$lib/queries/keys.ts` via the `queryKeys` factory:

```typescript
queryKeys.worlds.all; // ['worlds']
queryKeys.worlds.detail(id); // ['worlds', id]
queryKeys.nodes.all(worldId); // ['worlds', worldId, 'nodes']
queryKeys.nodes.detail(w, n); // ['worlds', worldId, 'nodes', nodeId]
queryKeys.voices.all; // ['voices']
queryKeys.usage.all; // ['usage']
```

Keys are hierarchical so prefix-based invalidation works correctly.

## Naming Conventions

- **Components**: PascalCase (`.svelte` files)
- **Modules**: camelCase (`.ts` / `.svelte.ts` files)
- **Query hooks**: `use<Entity>` (e.g., `useWorlds`, `useNode`)
- **Mutation hooks**: `use<Action>` (e.g., `useCreateWorld`, `useChooseOption`)
- **Query keys**: `queryKeys.<entity>.<scope>` pattern
- **API functions**: Verb-first (e.g., `getWorld`, `createWorld`, `deleteWorld`)

## Theming

- CSS variables defined in `src/routes/layout.css` using oklch color space.
- Tailwind 4 with `@theme inline` for token integration.
- Light/dark mode + named themes via `mode-watcher`.
- No hardcoded hex values — use `var(--*)` or Tailwind tokens.

## Backward-Compatibility Routes

- `/worlds` → Redirects to `/dashboard`
- `/worlds/[worldId]/map` → Redirects to `/worlds/[worldId]/graph`

These exist for external link compatibility and should be kept as thin redirects.
