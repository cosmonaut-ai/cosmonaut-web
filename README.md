# Cosmonaut Web

SvelteKit frontend for [Cosmonaut AI](https://cosmonaut-ai.com), an AI-powered interactive storytelling platform. The app is built as a static single-page application and talks to the Cosmonaut API over REST and SSE.

## Repository Role

Cosmonaut is split across several public repositories:

- [`cosmonaut-web`](https://github.com/cosmonaut-ai/cosmonaut-web): SvelteKit frontend.
- [`cosmonaut-api`](https://github.com/cosmonaut-ai/cosmonaut-api): Backend API and workers.
- [`cosmonaut-infra`](https://github.com/cosmonaut-ai/cosmonaut-infra): Terraform infrastructure.
- [`cosmonaut-android`](https://github.com/cosmonaut-ai/cosmonaut-android): Native Android client.

## Stack

- SvelteKit 2 and Svelte 5
- TypeScript
- Tailwind CSS 4 and shadcn-svelte components
- TanStack Query for server state
- AWS Amplify for Cognito authentication
- adapter-static for S3 + CloudFront hosting
- PostHog and Sentry for analytics and error tracking

## Local Setup

Prerequisites:

- Node.js 20+
- npm

```bash
npm ci
cp .env.example .env
npm run dev
```

The dev server runs at `http://localhost:5173`.

Authentication is mocked automatically when Cognito variables are not set. For API-backed local development, set `PUBLIC_API_BASE_URL=http://localhost:8000` and run [`cosmonaut-api`](https://github.com/cosmonaut-ai/cosmonaut-api) locally.

All `PUBLIC_` variables are embedded into the browser bundle at build time. Do not put private credentials in them.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server. |
| `npm run build` | Build the static production app into `build/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run check` | Run `svelte-check`. |
| `npm run lint` | Run Prettier check and ESLint. |
| `npm run verify` | Format, type-check, lint, and build. |

## Project Structure

```text
src/
├── lib/
│   ├── api/           # Typed API clients
│   ├── auth/          # Cognito and local mock auth state
│   ├── components/    # shadcn-svelte primitives and feature components
│   ├── config/        # Environment and tier configuration
│   ├── queries/       # TanStack Query hooks
│   ├── types/         # Shared TypeScript types
│   └── utils/         # Analytics, logging, transforms, toast helpers
└── routes/            # SvelteKit routes
```

## Documentation

Start with [`docs/README.md`](docs/README.md). The most useful references are:

- [`ARCHITECTURE.md`](ARCHITECTURE.md): app structure and conventions.
- [`auth-info.md`](auth-info.md): authentication flow and public configuration notes.
- [`docs/design-system/index.md`](docs/design-system/index.md): design system entry point.
- [`docs/subscription-frontend-guide.md`](docs/subscription-frontend-guide.md): subscription and usage UI integration.
- [`docs/audio-implementation.md`](docs/audio-implementation.md): audio narration UI integration.

## Deployment

GitHub Actions deploys pushes to `main` as production and `develop` as development. Deployment builds the static app, syncs it to S3, and invalidates CloudFront.

Documentation-only commits should use `[skip ci]` when they do not need a deployment.

## Security

Frontend configuration is public by design. Cognito IDs, Cognito domains, Sentry DSNs, and PostHog project tokens are client-visible values. Private credentials must stay in GitHub Actions secrets, ignored local files, or backend secret stores.

See [`SECURITY.md`](SECURITY.md) for disclosure and secret-handling guidance.

## Contributing

Issues and pull requests are welcome. Please run the relevant checks, include screenshots for UI changes, and keep generated build output out of commits.

## License

Apache-2.0. See [`LICENSE`](LICENSE).
