# Step 3 — Express Foundation

## Run

```bash
pnpm install
pnpm build
pnpm dev
```

## Test health

```bash
curl http://localhost:3000/api/v1/health
```

## Test 404

```bash
curl http://localhost:3000/api/v1/unknown
```
