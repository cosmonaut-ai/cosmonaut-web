# Claude Code Instructions

## Linting & Verification

Always run the full verification pipeline before committing changes:

```bash
npm run verify
```

This runs: `format` -> `svelte-check` -> `eslint --fix` -> `build`
