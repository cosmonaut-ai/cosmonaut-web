# Cosmonaut Web Documentation

This directory contains frontend implementation guides, design-system notes, and cross-repo integration references.

## Current References

- [`../ARCHITECTURE.md`](../ARCHITECTURE.md): SvelteKit app structure, state management, query conventions, and route notes.
- [`../auth-info.md`](../auth-info.md): Cognito, local mock auth, and API authorization notes.
- [`design-system/index.md`](design-system/index.md): design system entry point.
- [`subscription-frontend-guide.md`](subscription-frontend-guide.md): subscription, usage, checkout, and billing portal behavior.
- [`audio-implementation.md`](audio-implementation.md): text-to-speech voice selection, narration generation, and usage display.
- [`frontend-world-options.md`](frontend-world-options.md): world creation options exposed by the API.

## Design System

The design-system docs are working references for UI development. Prefer the source components in `src/lib/components/` when a doc and implementation drift.

## Maintenance Notes

- Keep examples free of private user data, real session tokens, and unpublished story content.
- Frontend configuration values prefixed with `PUBLIC_` are visible in browser bundles; use them only for public client configuration.
- Mark historical planning notes clearly instead of leaving stale implementation guidance in active docs.
