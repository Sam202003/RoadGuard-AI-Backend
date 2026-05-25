# Step 1 — Monorepo Foundation

## Active workspace

| Package | Role |
|---------|------|
| `apps/api` | MVP backend bootstrap |
| `packages/config` | Zod-validated environment |
| `packages/types` | Shared TypeScript types |

## Commands

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm dev
```

## Verify

Expected console output:

```
[roadguard-api] bootstrap ok | env=development port=3000 log=debug
[roadguard] Step 1 complete — proceed to Step 2 (TypeScript) / Step 3 (Express)
```
