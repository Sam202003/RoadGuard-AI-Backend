# Step 4 — Infrastructure (MongoDB, Logger, Redis)

## Prerequisites

```bash
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d mongodb redis
```

## Run

```bash
pnpm install
pnpm build
pnpm dev
```

## Test

```bash
curl http://localhost:3000/api/v1/health
```

Expected `data.infrastructure.mongodb.connected` and `redis.connected` both `true`.

## Env

See `apps/api/.env.example` — `MONGODB_URI`, `REDIS_URL`, `LOG_LEVEL`.
