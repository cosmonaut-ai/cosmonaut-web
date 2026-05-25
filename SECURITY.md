# Security Policy

Please do not report security issues in public GitHub issues.

Report vulnerabilities or accidental secret exposure to `support@cosmonaut-ai.com` with the affected repository, file path, and reproduction details.

## Secret Handling

- Do not commit `.env`, `.envrc`, Sentry auth tokens, AWS credentials, or local build artifacts.
- Frontend values prefixed with `PUBLIC_` are shipped to browsers and must not contain server-side secrets.
- Public Cognito IDs, domains, Sentry DSNs, and analytics project tokens are client-visible configuration, not private credentials.
