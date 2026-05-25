# Authentication Notes

Cosmonaut Web uses AWS Amplify Auth with Cognito in deployed environments and a local mock user in development when Cognito environment variables are absent.

## Source of Truth

- Runtime auth store: `src/lib/auth/auth.svelte.ts`
- Login flow state: `src/lib/auth/useLoginFlow.svelte.ts`
- Environment parsing: `src/lib/config/index.ts`
- Example configuration: `.env.example`

## Local Development

The default local workflow does not require Cognito:

```bash
npm ci
cp .env.example .env
npm run dev
```

If Cognito variables are left blank, the app uses a `LOCAL_DEV_USER` identity. You can sign in with any email and password in the login UI.

To connect to a local API, set:

```bash
PUBLIC_API_BASE_URL=http://localhost:8000
PUBLIC_STREAMING_BASE_URL=http://localhost:8000
```

## Deployed Authentication

Deployed environments use Cognito Hosted UI and Amplify Auth. The relevant public configuration values are:

```bash
PUBLIC_COGNITO_USER_POOL_ID=
PUBLIC_COGNITO_CLIENT_ID=
PUBLIC_COGNITO_DOMAIN=
PUBLIC_COGNITO_REDIRECT_URI=
PUBLIC_AWS_REGION=us-east-2
```

These values are public client configuration. They identify the Cognito app client and hosted UI domain, but they are not sufficient to access private backend data without a valid user session.

## API Authorization

Authenticated API calls include an ID token:

```http
Authorization: Bearer <id_token>
```

The API client helpers in `src/lib/api/core.ts` attach auth headers and normalize error handling. Feature code should call the typed API functions instead of duplicating token fetch logic.

## Streaming Session

The API and streaming domains are separate in deployed environments. Before using streaming routes, the app establishes a session with the API so the browser receives the cookies required for the streaming domain. If a streaming request returns `401` or `403`, retry by refreshing the auth/session handshake before surfacing an error.

## Security Checklist

- Do not store tokens manually in `localStorage`.
- Do not put server-side secrets in `PUBLIC_` variables.
- Keep redirect URIs aligned with the Cognito app client configuration.
- Treat screenshots, console logs, and traces as sensitive when they include user identifiers or generated private story content.
