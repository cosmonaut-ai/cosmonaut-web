You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

Do not attempt to resize the browser window programmatically — use DevTools device emulation or Playwright for responsive testing instead.

## General Guidelines

### 🔍 Search First, Assume Never

When in doubt — search. If your knowledge of a library, API, pattern, or behavior is uncertain or potentially outdated, use available search tools to verify before proceeding. A well-researched implementation beats a confident wrong one every time. This applies to documentation, error messages, version-specific behavior, and edge cases alike.

### 🧠 Understand Before You Touch

Before making any changes, take the time to deeply understand the codebase. Read the relevant files, trace function calls, identify side effects, and map dependencies. Understand _why_ the code is written the way it is — not just _what_ it does. Quality over quantity: a single well-reasoned, correct change is worth far more than several hasty ones that require follow-up fixes.

Ask yourself:

- What does this code currently do, end-to-end?
- What are the downstream effects of changing it?
- Are there edge cases or existing patterns I should respect?

Do not begin writing code until you can answer these confidently.

### 💬 Communicate Proactively

Ambiguity is the enemy of good code. If a requirement is unclear, the intended behavior is vague, or you're weighing multiple valid approaches, **ask before acting**. A quick clarifying question upfront saves significant rework later. Surface assumptions, flag potential conflicts with existing patterns, and confirm scope when tasks feel underspecified.

Err on the side of communicating more, not less.

### 🖥️ Verify Frontend Changes in the Browser

Any change that touches the UI — layout, styles, interactivity, responsiveness — must be verified visually in the browser before considering it complete. Do not rely solely on code review or static reasoning. Check for visual regressions, broken layouts across screen sizes, and interaction states (hover, focus, disabled, loading, error). If browser tooling is available, use it.

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.

## Cursor Cloud specific instructions

### Project overview

Cosmonaut AI (`cosmonaut-web`) is a SvelteKit 2 / Svelte 5 frontend SPA for an AI-powered interactive storytelling platform. It uses `adapter-static` and talks to a separate backend API (not in this repo).

### Dev commands

Standard commands from `package.json`:

- **Dev server:** `npm run dev` (Vite on `localhost:5173`)
- **Lint:** `npm run lint` (Prettier check + ESLint). Note: run `npm run format` first to auto-fix Prettier issues, then `npx eslint . --fix` for ESLint.
- **Type check:** `npm run check` (svelte-check)
- **Build:** `npm run build` (static output to `build/`)
- **Full verify:** `bash scripts/verify.sh` or `npm run verify` (format → svelte-check → lint --fix → build)

### Local dev auth

Authentication is **automatically mocked** when no Cognito env vars are set (the default). The app uses a `LOCAL_DEV_USER` identity — no AWS Cognito setup is needed. You can sign in with any email/password on the login form.

### Backend API

The frontend expects a backend at `http://localhost:8000` (configurable via `PUBLIC_API_BASE_URL`). The backend is in a **separate repository** and is not required for frontend-only development. API calls will fail with "Failed to fetch" when the backend is absent — this is expected.

### Pre-existing lint issues

There is one pre-existing ESLint error in `src/routes/login/ForgotPasswordForm.svelte` (unused variable `passwordsMatch`). This is not caused by your changes.
