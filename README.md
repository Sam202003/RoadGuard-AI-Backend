# Road Guard — Backend (MVP)

AI-powered roadside assistance platform. **Step-by-step MVP build** — see `docs/phases/`.

## Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9

## Quick start (Step 1)

```bash
cd RoadGuard-AI-Backend
pnpm install
pnpm build
pnpm dev
```

## Monorepo layout (active)

```
apps/api/              # MVP API — single entry point for now
packages/config/       # Environment (Zod + dotenv)
packages/types/        # Shared types
```

Enterprise scaffold (`apps/auth-service`, …) remains on disk for future phases but is **outside** the active pnpm workspace until needed.

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm install` | Install all workspace dependencies |
| `pnpm build` | Build packages + api |
| `pnpm dev` | Run api in watch mode |
| `pnpm typecheck` | TypeScript check |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier write |

## Architecture

Full enterprise blueprint: [ARCHITECTURE.md](./ARCHITECTURE.md)

## Current step

**Step 10 — Notifications** ✅ (in-app, realtime, breakdown auto-notify)

**Step 9 — Real-Time (Socket.IO)** ✅ (tracking, presence, breakdown live events)

**Step 8 — Breakdown Requests** ✅ (lifecycle, geo assignment, role-based APIs)

**Step 7 — Providers** ✅ (onboarding, geo search, availability)

**Step 6 — Vehicles** ✅ (CRUD, ownership, pagination, soft delete)

**Step 5 — Auth + User** ✅ (register, login, JWT, refresh, roles)

**Step 4 — Infrastructure** ✅ (MongoDB, Pino logger, Redis, base repository)

```bash
docker compose -f infrastructure/docker/docker-compose.dev.yml up -d mongodb redis
pnpm dev
curl http://localhost:3000/api/v1/health
```

## Deploy (pilot / 10–15 users)

**Render (API) + Vercel (web) + MongoDB Atlas** — see [docs/DEPLOY-RENDER-VERCEL.md](./docs/DEPLOY-RENDER-VERCEL.md) and `render.yaml`.
