# Security Policy

Please do not report security issues in public GitHub issues.

Report vulnerabilities or accidental secret exposure to `support@cosmonaut-ai.com`. Include the affected repository, file path, relevant commit or release, reproduction details, and impact if known.

## Scope

This policy covers the SvelteKit frontend, static deployment configuration, documentation, and public client configuration in this repository.

## Secret Handling

- Do not commit `.env`, `.envrc`, Sentry auth tokens, AWS credentials, private test fixtures, or local build artifacts.
- Frontend values prefixed with `PUBLIC_` are shipped to browsers and must not contain server-side secrets.
- Public Cognito IDs, Cognito domains, Sentry DSNs, and analytics project tokens are client-visible configuration, not private credentials. They should still be scoped to the correct environment.

## Public Contributions

When opening a pull request, scrub screenshots, console logs, session traces, and reproduction steps for personal data, unpublished generated story content, and any token-like values that are not explicitly public configuration.
