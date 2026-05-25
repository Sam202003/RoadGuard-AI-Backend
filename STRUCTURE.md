# Road Guard Backend — Project Structure Index

Generated monorepo scaffold. See [ARCHITECTURE.md](./ARCHITECTURE.md) for design rationale.

## Top-level

| Path | Purpose |
|------|---------|
| `apps/` | 14 microservice-ready applications |
| `packages/` | 14 shared libraries |
| `infrastructure/` | Docker, K8s, Terraform, NGINX, PM2 |
| `deployments/` | GitOps (ArgoCD), canary (Flagger) |
| `ci/` | GitHub Actions workflows |
| `observability/` | Prometheus, Grafana, Loki, Tempo, OTel |
| `docs/` | ADRs, API specs, runbooks |
| `tools/` | Codegen, generators, scaffold script |
| `tests/` | Cross-cutting e2e, contract, load, chaos |

## Apps (14)

Each app follows **Clean Architecture** with `src/modules/<feature>/` per domain module.

- `api-gateway` — routing, auth-proxy, rate-limit, versioning
- `auth-service` — password, OTP, OAuth, sessions, RBAC, MFA, devices
- `user-service` — profiles, addresses, memberships, consents
- `provider-service` — onboarding, KYC, availability, ratings, earnings
- `vehicle-service` — vehicles, insurance, maintenance, telematics
- `breakdown-service` — requests, dispatch, lifecycle, AI diagnosis hook
- `tracking-service` — GPS, ETA, geofencing, replay
- `payment-service` — wallets, subscriptions, invoices, gateways
- `notification-service` — push, SMS, WhatsApp, email, templates
- `ai-service` — chat, voice, RAG, agents, image diagnosis
- `media-service` — uploads, S3, CDN, virus scan
- `analytics-service` — dashboards, KPIs, ETL, reports
- `admin-service` — CMS, moderation, audit, feature flags
- `realtime-service` — Socket.IO, presence, chat, live bridges

## Packages (14)

- `config` — typed env, feature flags
- `database` — Mongoose, base repository
- `logger` — structured logging + trace correlation
- `cache` — Redis client, locks, rate limits
- `messaging` — Kafka/RabbitMQ producers & consumers
- `auth` — JWT, RBAC, OTP helpers
- `types` — shared TypeScript types
- `utils` — pure utilities
- `validators` — Zod schemas
- `contracts` — OpenAPI/gRPC contracts
- `events` — versioned event schemas & envelope
- `ai-core` — LangChain, RAG, prompts, vector adapters
- `monitoring` — OTel, health probes, metrics
- `shared-business` — cross-domain rules (pricing, geo)

## Per-service layout (canonical)

```
apps/<service>/
├── src/
│   ├── main.ts | app.ts | server.ts
│   ├── modules/<feature>/     # Feature-first hexagons
│   ├── domain/                # Entities, aggregates, ports
│   ├── application/           # Commands, queries, handlers
│   ├── infrastructure/        # Adapters (HTTP, DB, messaging)
│   ├── adapters/              # External integrations
│   ├── events/                # Producers, consumers, schemas
│   ├── middleware/            # Auth, RBAC, audit, rate-limit
│   ├── routes/v1|v2/
│   ├── sockets/               # (realtime-service)
│   ├── queues/ | jobs/ | workers/
│   └── config/ | container/
├── tests/
├── docs/                      # openapi.yaml, asyncapi.yaml, runbook
├── Dockerfile
└── package.json
```

## Regenerate

```bash
node tools/scripts/scaffold-structure.mjs
```

Safe to re-run — skips existing files.
