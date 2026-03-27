# Cosmonaut Web

SvelteKit frontend for Cosmonaut AI - an interactive choose-your-own-adventure storytelling platform. Builds as a static SPA deployed to S3 + CloudFront.

## Stack

- **SvelteKit 2** with **Svelte 5** (runes)
- **Tailwind CSS 4** with **shadcn-svelte** components
- **TanStack Query** for data fetching
- **AWS Amplify** for Cognito authentication
- **adapter-static** (fully client-rendered, no SSR)

## Prerequisites

- Node.js 20+
- npm

## Setup

```bash
# Install dependencies
npm ci

# Copy and fill in environment variables
cp .env.example .env
# Edit .env with your Cognito and API values

# Run dev server
npm run dev
```

The dev server runs at `http://localhost:5173`. For local API development, point `PUBLIC_API_BASE_URL` to `http://localhost:8000`.

## Scripts

| Command           | Description                                         |
| ----------------- | --------------------------------------------------- |
| `npm run dev`     | Start dev server                                    |
| `npm run build`   | Production build (static output to `build/`)        |
| `npm run preview` | Preview production build locally                    |
| `npm run check`   | Run svelte-check (type checking)                    |
| `npm run lint`    | Prettier + ESLint                                   |
| `npm run verify`  | Format, type-check, lint, and build (full CI check) |

## Project Structure

```
src/
├── routes/           # SvelteKit file-based routing
│   ├── dashboard/    # World grid
│   ├── worlds/       # World pages, story nodes, graph view
│   ├── settings/     # Account, subscription, usage
│   ├── pricing/      # Plans and pricing
│   ├── login/        # Auth (sign in / sign up / forgot password)
│   └── ...
├── lib/
│   ├── api/          # API client functions
│   ├── auth/         # Cognito auth state (auth.svelte.ts)
│   ├── components/   # UI components (shadcn-svelte + custom)
│   ├── config/       # Tier config, feature config
│   ├── queries/      # TanStack Query hooks
│   ├── types/        # TypeScript types
│   └── utils/        # Helpers
└── hooks.client.ts   # Sentry client-side error tracking
```

## Deployment

Push to `main` (prod) or `develop` (dev) triggers GitHub Actions:
`npm run build` → S3 sync → CloudFront cache invalidation.

See `ARCHITECTURE.md` at the workspace root for the full system overview.
