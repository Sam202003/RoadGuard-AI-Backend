# Road Guard — Backend Architecture (Enterprise Blueprint)

> AI-powered roadside assistance & vehicle breakdown platform.
>
> This document is the authoritative architectural blueprint for the Road Guard backend.
> It describes structure, boundaries, contracts, communication patterns, infrastructure,
> security, observability, and the migration path from a **modular monolith** to a
> **fully distributed microservices** topology.
>
> **No business logic.** Only enterprise-level architecture, folder shape, contracts, and patterns.

---

## Table of Contents

1. [Architecture Philosophy](#1-architecture-philosophy)
2. [High-Level System Topology](#2-high-level-system-topology)
3. [Complete Monorepo Folder Tree](#3-complete-monorepo-folder-tree)
4. [Per-Service Internal Structure](#4-per-service-internal-structure)
5. [Service Responsibilities](#5-service-responsibilities)
6. [Inter-Service Communication](#6-inter-service-communication)
7. [Event-Driven Architecture](#7-event-driven-architecture)
8. [Database Architecture](#8-database-architecture)
9. [AI Architecture (LangChain · RAG · Agents)](#9-ai-architecture)
10. [Security Architecture](#10-security-architecture)
11. [Scaling Strategy](#11-scaling-strategy)
12. [DevOps & Infrastructure Strategy](#12-devops--infrastructure-strategy)
13. [Monolith → Microservices Migration Path](#13-monolith--microservices-migration-path)
14. [Deployment-Ready Considerations](#14-deployment-ready-considerations)
15. [Best Practices & Engineering Standards](#15-best-practices--engineering-standards)

---

## 1. Architecture Philosophy

Road Guard is designed as a **Modular Monolith with Microservice DNA** — every "service"
inside `apps/` is a self-contained, independently deployable bounded context that today
lives inside a shared monorepo and a shared deployment plane, but can be peeled off
into its own runtime, repo, and team-owned cluster without architectural rewrite.

The architecture is governed by **eight non-negotiable principles**:

| # | Principle | Practical Meaning |
|---|-----------|-------------------|
| 1 | **Domain-Driven Design (DDD)** | Each service owns one bounded context (Auth, Vehicle, Breakdown, etc.). No cross-domain database joins. |
| 2 | **Clean / Hexagonal Architecture** | Domain core is framework-agnostic. Express/Fastify, MongoDB, Kafka are *adapters*, not dependencies. |
| 3 | **Feature-First Organization** | Inside a service, code is grouped by feature module — not by technical layer at the top level. |
| 4 | **Contract-First Communication** | Services talk through versioned contracts (`packages/contracts`) and versioned events (`packages/events`). |
| 5 | **Event-Driven by Default** | Synchronous calls only for read-paths and request/response. State changes flow via Kafka/RabbitMQ events. |
| 6 | **Stateless Compute, Stateful Edges** | Services are stateless; state lives in MongoDB, Redis, Kafka, S3, Vector DB. |
| 7 | **Twelve-Factor + Cloud-Native** | Config via env, logs as streams, immutable releases, horizontal scaling, graceful shutdown. |
| 8 | **Observability is a First-Class Citizen** | Every request carries a `traceId`. Logs, metrics, traces are correlated end-to-end. |

### Why a Modular Monolith first?

- **Velocity** — One repo, one CI, one deploy. Founding teams ship faster.
- **Refactor safety** — Boundaries enforced by lint rules (`eslint-plugin-boundaries`) and TS path aliases, not network calls.
- **Cost** — One Kubernetes namespace, one observability stack, predictable AWS bill.
- **Optionality** — When a service hits scale, ownership, or compliance pressure, it extracts in days, not months, because contracts already exist.

---

## 2. High-Level System Topology

```
                                ┌──────────────────────────────────────────┐
                                │              CLIENT SURFACES              │
                                │  Web · Mobile (future) · Admin · Provider │
                                │            Portal · IoT (future)          │
                                └──────────────────┬───────────────────────┘
                                                   │ HTTPS / WSS
                                                   ▼
                                ┌──────────────────────────────────────────┐
                                │           AWS CloudFront (CDN)           │
                                │              AWS WAF + Shield            │
                                └──────────────────┬───────────────────────┘
                                                   ▼
                                ┌──────────────────────────────────────────┐
                                │     NGINX Ingress  /  AWS ALB / NLB      │
                                └──────────────────┬───────────────────────┘
                                                   ▼
                          ┌────────────────────────────────────────────────┐
                          │              API GATEWAY (apps/api-gateway)    │
                          │   Auth · Rate limit · Routing · Versioning ·   │
                          │   Request shaping · Schema validation · Tracing│
                          └──────┬──────────────────────────────────┬──────┘
                                 │ REST / gRPC                      │ WSS
                                 ▼                                  ▼
   ┌─────────────────────────────────────────────────┐   ┌─────────────────────┐
   │              DOMAIN SERVICES (apps/*)            │   │  REALTIME SERVICE   │
   │  auth · user · provider · vehicle · breakdown ·  │◀─▶│  Socket.IO Cluster  │
   │  payment · notification · ai · media · admin ·   │   │  (Redis Adapter)    │
   │  analytics · tracking                            │   └──────────┬──────────┘
   └───────┬──────────────────────────────┬──────────┘              │
           │ Sync (REST/gRPC)             │ Async (events)          │
           ▼                              ▼                          ▼
   ┌───────────────┐            ┌────────────────────┐   ┌────────────────────┐
   │   MongoDB     │            │  Kafka / RabbitMQ  │   │   Redis Cluster    │
   │  (per-svc DB) │            │  Event Backbone    │   │  Cache · Sessions ·│
   │  Replica Set  │            │  Topics per domain │   │  Pub/Sub · Locks   │
   └───────────────┘            └────────────────────┘   └────────────────────┘
                                           │
                                           ▼
                          ┌────────────────────────────────────┐
                          │       AI PLANE (apps/ai-service)   │
                          │  OpenAI · LangChain · RAG · Agents │
                          │  Vector DB (Pinecone / Weaviate /  │
                          │  Milvus / Qdrant pluggable)        │
                          └────────────────────────────────────┘
                                           │
                                           ▼
                          ┌────────────────────────────────────┐
                          │      STORAGE & EXTERNAL PLANE       │
                          │  S3 · CloudFront CDN · SES · SNS ·  │
                          │  Twilio · Stripe/Razorpay · Maps    │
                          └────────────────────────────────────┘
```

---

## 3. Complete Monorepo Folder Tree

The repository is a **PNPM + Turborepo** (or Nx) monorepo. Each app is independently buildable, testable, and deployable. Shared code lives in `packages/`.

```
roadguard-backend/
├── apps/
│   ├── api-gateway/                  # Public entrypoint, edge routing, auth, rate limit
│   ├── auth-service/                 # Identity, JWT, OTP, sessions, RBAC, devices
│   ├── user-service/                 # End-user profiles, memberships, preferences
│   ├── provider-service/             # Mechanics, KYC, ratings, earnings, availability
│   ├── vehicle-service/              # Vehicles, insurance, docs, maintenance history
│   ├── breakdown-service/            # Roadside request lifecycle, dispatch engine
│   ├── tracking-service/             # GPS ingest, geofencing, ETA, live routes
│   ├── payment-service/              # Wallets, subscriptions, invoices, gateways
│   ├── notification-service/         # Push, SMS, WhatsApp, Email orchestration
│   ├── ai-service/                   # AI assistant, RAG, agents, image diagnosis
│   ├── media-service/                # S3 uploads, presigned URLs, CDN, transcoding
│   ├── analytics-service/            # Dashboards, KPIs, reporting, AI analytics
│   ├── admin-service/                # Admin console APIs, CMS, moderation, audit
│   └── realtime-service/             # Socket.IO gateway, presence, live channels
│
├── packages/
│   ├── config/                       # Centralized typed env loader, feature flags
│   ├── database/                     # Mongoose connection, base repo, transactions
│   ├── logger/                       # Winston/Pino + OTel correlation
│   ├── cache/                        # Redis abstraction (client, locks, ratelimit)
│   ├── messaging/                    # Kafka/RabbitMQ producers, consumers, retries
│   ├── auth/                         # JWT, RBAC guards, policy DSL, OTP helpers
│   ├── types/                        # Cross-service TS types & enums
│   ├── utils/                        # Pure helpers (date, string, crypto, geo)
│   ├── validators/                   # Zod schemas reused across services
│   ├── contracts/                    # OpenAPI/gRPC/JSON-Schema service contracts
│   ├── events/                       # Versioned event schemas (Avro/JSON-Schema)
│   ├── ai-core/                      # LangChain primitives, RAG, prompt registry
│   ├── monitoring/                   # OTel SDK, metrics, health probes
│   └── shared-business/              # Cross-cutting domain rules (pricing, geo math)
│
├── infrastructure/
│   ├── docker/                       # Dockerfiles per service + dev compose
│   │   ├── api-gateway.Dockerfile
│   │   ├── auth-service.Dockerfile
│   │   ├── ...                       # (one per app)
│   │   └── docker-compose.dev.yml
│   ├── kubernetes/
│   │   ├── base/                     # Shared kustomize bases
│   │   ├── overlays/
│   │   │   ├── dev/
│   │   │   ├── staging/
│   │   │   └── production/
│   │   ├── helm/
│   │   │   ├── roadguard-umbrella/   # Umbrella chart
│   │   │   └── charts/               # Per-service sub-charts
│   │   ├── ingress/                  # NGINX / ALB ingress manifests
│   │   ├── policies/                 # NetworkPolicies, PodSecurity, OPA Gatekeeper
│   │   └── secrets/                  # SealedSecrets / ExternalSecrets manifests
│   ├── terraform/
│   │   ├── modules/
│   │   │   ├── vpc/
│   │   │   ├── eks/
│   │   │   ├── mongodb-atlas/
│   │   │   ├── msk-kafka/
│   │   │   ├── elasticache-redis/
│   │   │   ├── s3-cloudfront/
│   │   │   ├── iam/
│   │   │   └── observability/
│   │   ├── environments/
│   │   │   ├── dev/
│   │   │   ├── staging/
│   │   │   └── prod/
│   │   └── backends/                 # Remote state config (S3 + DynamoDB lock)
│   ├── nginx/                        # Ingress configs, rate-limit zones
│   ├── pm2/                          # ecosystem.config.js per service (non-K8s)
│   └── scripts/                      # Bootstrap, seed, migrate, rotate-keys
│
├── deployments/
│   ├── argocd/                       # GitOps app-of-apps manifests
│   ├── flagger/                      # Canary / blue-green release configs
│   └── helmfile.yaml
│
├── ci/
│   ├── github-actions/
│   │   ├── workflows/
│   │   │   ├── ci.yml                # Lint, typecheck, test, build per affected app
│   │   │   ├── cd-dev.yml
│   │   │   ├── cd-staging.yml
│   │   │   ├── cd-prod.yml
│   │   │   ├── security-scan.yml     # Trivy, Snyk, gitleaks, SBOM
│   │   │   ├── contract-tests.yml
│   │   │   └── infra-plan.yml        # terraform plan on PR
│   │   └── reusable/                 # Reusable composite actions
│   └── pipelines/                    # Alt CI definitions (GitLab/Buildkite)
│
├── observability/
│   ├── otel-collector/               # OTel collector config
│   ├── prometheus/
│   │   ├── rules/                    # Alerting & recording rules
│   │   └── scrape-configs/
│   ├── grafana/
│   │   ├── dashboards/               # JSON dashboards per service
│   │   └── datasources/
│   ├── loki/                         # Centralized log aggregation
│   ├── tempo/                        # Distributed tracing backend
│   └── alertmanager/
│
├── docs/
│   ├── architecture/                 # ADRs, C4 diagrams, this file
│   ├── api/                          # Aggregated OpenAPI specs
│   ├── events/                       # AsyncAPI specs
│   ├── runbooks/                     # On-call runbooks per service
│   ├── onboarding/                   # Dev onboarding guides
│   └── adr/                          # Architecture Decision Records (ADR-0001…)
│
├── tools/
│   ├── codegen/                      # OpenAPI/AsyncAPI → TS client/types
│   ├── scripts/                      # Repo-wide maintenance scripts
│   └── generators/                   # Plop/Nx generators for new services
│
├── tests/
│   ├── e2e/                          # Cross-service end-to-end suites
│   ├── load/                         # k6 / Artillery load tests
│   ├── contract/                     # Pact provider/consumer tests
│   └── chaos/                        # Chaos Mesh / Litmus experiments
│
├── .github/                          # PR templates, CODEOWNERS, issue forms
├── .husky/                           # Pre-commit / pre-push hooks
├── .editorconfig
├── .eslintrc.cjs                     # With eslint-plugin-boundaries
├── .prettierrc
├── .nvmrc
├── .npmrc
├── tsconfig.base.json                # Root TS config + path aliases
├── turbo.json                        # Turborepo pipeline
├── pnpm-workspace.yaml
├── package.json
├── commitlint.config.js
├── renovate.json
├── README.md
└── ARCHITECTURE.md                   # This document
```

---

## 4. Per-Service Internal Structure

Every service in `apps/*` follows the **same canonical Clean Architecture layout** so
that a developer who knows one service knows them all. Differences between services
live only in their `modules/` folder.

### 4.1 Canonical Service Skeleton

```
apps/<service-name>/
├── src/
│   ├── main.ts                       # Bootstrap: load config, wire DI, start server
│   ├── app.ts                        # HTTP app factory (Express/Fastify)
│   ├── server.ts                     # Lifecycle: listen, graceful shutdown, health
│   │
│   ├── modules/                      # ◀── FEATURE-FIRST domain modules
│   │   └── <feature>/                # e.g. otp, sessions, profiles, ratings
│   │       ├── <feature>.module.ts
│   │       ├── <feature>.controller.ts
│   │       ├── <feature>.routes.ts
│   │       ├── <feature>.service.ts
│   │       ├── <feature>.repository.ts
│   │       ├── <feature>.schema.ts   # Mongoose model
│   │       ├── <feature>.dto.ts
│   │       ├── <feature>.validator.ts
│   │       ├── <feature>.mapper.ts   # Domain ↔ persistence ↔ DTO mappers
│   │       ├── <feature>.policy.ts   # Authorization policies
│   │       ├── events/
│   │       │   ├── <feature>.producer.ts
│   │       │   └── <feature>.consumer.ts
│   │       └── __tests__/
│   │           ├── unit/
│   │           ├── integration/
│   │           └── fixtures/
│   │
│   ├── controllers/                  # (Thin orchestrators if non-module-scoped)
│   ├── routes/                       # Versioned route registration (/v1, /v2)
│   │   ├── v1/
│   │   └── v2/
│   ├── services/                     # Cross-module application services
│   ├── repositories/                 # Shared repos (BaseRepository extensions)
│   ├── schemas/                      # Shared/global Mongoose schemas
│   ├── models/                       # Domain models / value objects
│   ├── dtos/                         # Shared request/response DTOs
│   ├── validators/                   # Shared Zod/Joi validators
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── rbac.middleware.ts
│   │   ├── tenant.middleware.ts
│   │   ├── rate-limit.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── correlation.middleware.ts # traceId / requestId
│   │   ├── audit.middleware.ts
│   │   └── validation.middleware.ts
│   │
│   ├── events/
│   │   ├── producers/                # Outbound event emitters
│   │   ├── consumers/                # Inbound event handlers
│   │   ├── handlers/                 # Domain event handlers (in-process)
│   │   └── schemas/                  # Versioned event payload schemas
│   │
│   ├── sockets/                      # (only realtime-service uses heavily)
│   │   ├── gateways/
│   │   ├── namespaces/
│   │   ├── rooms/
│   │   ├── handlers/
│   │   └── middleware/
│   │
│   ├── queues/
│   │   ├── producers/                # BullMQ / SQS producers
│   │   ├── workers/                  # Background workers
│   │   └── processors/               # Job-specific processors
│   │
│   ├── jobs/                         # Cron / scheduled tasks
│   │   ├── scheduler.ts
│   │   └── definitions/
│   │
│   ├── workers/                      # Long-running background processes
│   │
│   ├── adapters/                     # ◀── Outbound ports' implementations
│   │   ├── http/                     # Internal service HTTP clients
│   │   ├── grpc/
│   │   ├── kafka/
│   │   ├── redis/
│   │   ├── s3/
│   │   ├── twilio/
│   │   ├── stripe/
│   │   └── openai/
│   │
│   ├── integrations/                 # 3rd-party SDK wrappers (one folder per vendor)
│   │   ├── maps/                     # Google Maps / Mapbox
│   │   ├── kyc/                      # KYC provider
│   │   ├── insurance/
│   │   └── telematics/
│   │
│   ├── policies/                     # ABAC/RBAC policy definitions
│   ├── permissions/                  # Permission catalog & scope mappings
│   │
│   ├── config/
│   │   ├── index.ts                  # Typed config from packages/config
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── kafka.config.ts
│   │   ├── openapi.config.ts
│   │   └── feature-flags.ts
│   │
│   ├── container/                    # IoC / DI container wiring
│   │   ├── container.ts              # tsyringe / awilix / InversifyJS
│   │   └── tokens.ts
│   │
│   ├── infrastructure/               # Framework-coupled implementations
│   │   ├── http/
│   │   ├── persistence/
│   │   ├── messaging/
│   │   └── cache/
│   │
│   ├── domain/                       # Pure domain layer (entities, value objects)
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── aggregates/
│   │   ├── repositories/             # Interfaces (ports)
│   │   ├── services/                 # Domain services (stateless)
│   │   └── events/                   # Domain events (in-process)
│   │
│   ├── application/                  # Use-cases / command + query handlers (CQRS-lite)
│   │   ├── commands/
│   │   ├── queries/
│   │   └── handlers/
│   │
│   ├── interfaces/                   # TS interfaces & ports (DDD ports)
│   ├── constants/
│   ├── errors/                       # Typed domain & HTTP errors
│   ├── types/                        # Service-local TS types
│   └── utils/
│
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   ├── contract/                     # Pact contracts
│   ├── load/
│   └── fixtures/
│
├── docs/
│   ├── README.md
│   ├── openapi.yaml                  # Service-specific OpenAPI spec
│   ├── asyncapi.yaml                 # Events spec
│   ├── erd.md
│   └── runbook.md
│
├── prisma/ or migrations/            # Schema migrations (if applicable)
├── Dockerfile
├── .dockerignore
├── package.json
├── tsconfig.json
├── jest.config.ts
├── nodemon.json
└── README.md
```

### 4.2 Module Anatomy (Recap)

Each `modules/<feature>` folder is a **mini-hexagon**:

- `controller` → HTTP/transport adapter
- `service` → application layer (use cases)
- `repository` → persistence port + adapter
- `schema/model` → persistence representation
- `dto` → transport representation
- `validator` → input contract
- `mapper` → translation between layers
- `policy` → authorization rules
- `events/` → outbound producers + inbound consumers
- `__tests__/` → co-located tests

This ensures **extracting a module into its own microservice** later requires only:
moving the folder, lifting its consumed events/contracts into `packages/`, and
generating a Dockerfile + Helm chart.

---

## 5. Service Responsibilities

Each service is a **single bounded context** with its own database namespace, its
own event topics, and its own deployment lifecycle.

### 5.1 `api-gateway`
- **Role**: Public-facing edge for all HTTP/WSS traffic.
- **Owns**: Routing, auth verification (JWT introspection), rate limiting, request
  shaping, response caching, schema validation, API versioning, request fan-out,
  CORS, helmet, IP allow/deny, distributed-trace propagation.
- **Does NOT own**: Business logic, persistence.
- **Talks to**: All domain services via internal mesh (REST/gRPC).

### 5.2 `auth-service`
- **Role**: Single source of truth for identity & access.
- **Modules**: `password-auth`, `otp-auth`, `oauth-social`, `sessions`,
  `refresh-tokens`, `devices`, `rbac`, `mfa`, `password-reset`, `account-lockout`.
- **Storage**: Mongo (users, sessions, devices), Redis (OTP, blacklist, rate-limits).
- **Emits**: `auth.user.registered`, `auth.user.logged_in`, `auth.session.revoked`.

### 5.3 `user-service`
- **Role**: End-user profile domain.
- **Modules**: `profiles`, `addresses`, `emergency-contacts`, `preferences`,
  `memberships`, `referrals`, `consents`.
- **Storage**: Mongo.
- **Consumes**: `auth.user.registered` → bootstraps profile.

### 5.4 `provider-service`
- **Role**: Mechanic / service-provider domain.
- **Modules**: `onboarding`, `kyc`, `documents`, `availability`, `service-areas`,
  `ratings`, `earnings`, `payouts`, `fleet-providers` (future).
- **Storage**: Mongo + S3 (documents).
- **Emits**: `provider.kyc.approved`, `provider.availability.changed`.

### 5.5 `vehicle-service`
- **Role**: Vehicle registry & lifecycle.
- **Modules**: `vehicles`, `insurance`, `documents`, `maintenance-history`,
  `inspections`, `telematics` (future IoT).
- **Storage**: Mongo + S3.

### 5.6 `breakdown-service`
- **Role**: Core domain — roadside assistance request lifecycle.
- **Modules**: `requests`, `dispatch`, `lifecycle` (state machine), `cancellations`,
  `feedback`, `ai-diagnosis-orchestration` (calls `ai-service`).
- **Storage**: Mongo (requests, state log) + Redis (dispatch locks, candidate sets).
- **Emits**: `breakdown.requested`, `breakdown.assigned`, `breakdown.started`,
  `breakdown.completed`, `breakdown.cancelled`.

### 5.7 `tracking-service`
- **Role**: Real-time geo plane.
- **Modules**: `gps-ingest`, `live-routes`, `eta`, `geofencing`,
  `replay`, `heatmaps`.
- **Storage**: Mongo (with `2dsphere` indexes), Redis Geo (live positions),
  optional time-series store (Mongo TS / Timescale) for replay.
- **Emits**: `tracking.location.updated`, `tracking.geofence.entered/exited`.

### 5.8 `realtime-service`
- **Role**: WebSocket gateway, fan-out of live events to clients.
- **Modules**: `socket-gateway`, `presence`, `rooms`, `chat`, `live-tracking-bridge`,
  `notifications-bridge`.
- **Stack**: Socket.IO + Redis adapter (sticky-session-free horizontal scaling).
- **Consumes**: events from all services; pushes to user/provider/admin rooms.

### 5.9 `ai-service`
- **Role**: All AI capabilities. (See §9 for full AI architecture.)
- **Modules**: `chat-assistant`, `voice-assistant`, `image-diagnosis`, `rag`,
  `agents`, `prompt-registry`, `multilingual`, `safety-guardrails`,
  `feedback-loop`, `model-router`.
- **Storage**: Vector DB (Pinecone/Weaviate/Qdrant/Milvus), Mongo (chat history,
  prompts, evals), S3 (raw artifacts).

### 5.10 `payment-service`
- **Role**: Money movement & monetization.
- **Modules**: `wallets`, `subscriptions`, `invoices`, `payouts`, `refunds`,
  `gateways` (Stripe, Razorpay, PayPal adapters), `disputes`, `tax`.
- **Storage**: Mongo (with strict audit collection, append-only).
- **Idempotency**: Required on every external gateway interaction.

### 5.11 `notification-service`
- **Role**: Omnichannel delivery.
- **Modules**: `push` (FCM/APNs), `sms` (Twilio/MSG91), `whatsapp`, `email`
  (SES/SendGrid), `in-app`, `templates`, `preferences`, `delivery-tracking`,
  `digest-engine`.
- **Pattern**: Strategy + adapter; channel selection based on user preferences
  and message priority.

### 5.12 `media-service`
- **Role**: File & media plane.
- **Modules**: `uploads`, `presigned-urls`, `transcoding`, `image-processing`,
  `cdn-invalidation`, `virus-scan` (ClamAV), `metadata-extraction`.
- **Storage**: S3 + CloudFront.

### 5.13 `analytics-service`
- **Role**: Read-model + analytics plane.
- **Modules**: `dashboards`, `kpis`, `reports`, `funnels`, `cohorts`,
  `ai-analytics`, `etl`, `data-export`.
- **Storage**: Mongo aggregations + (future) ClickHouse / BigQuery / Snowflake
  for OLAP. Built off the event stream — never queries other services' DBs.

### 5.14 `admin-service`
- **Role**: Internal control plane.
- **Modules**: `admins`, `cms`, `moderation`, `audit-logs`, `feature-flags`,
  `system-config`, `support-tools`, `impersonation` (with guardrails).
- **Strict**: All actions audit-logged immutably.

---

## 6. Inter-Service Communication

Road Guard uses **three communication patterns**, chosen explicitly per use case.

### 6.1 Synchronous: REST + gRPC

| Use case | Protocol | Why |
|----------|----------|-----|
| Client ↔ Gateway | REST/JSON over HTTPS | Universal, browser-friendly |
| Gateway ↔ Service | REST (v1) → gRPC (v2 internal) | Performance & typed contracts |
| Service ↔ Service (read) | gRPC | Strongly typed, low latency, multiplexed |
| Service ↔ Service (admin) | REST | Debuggability |

- All synchronous calls use **circuit breakers** (Opossum), **timeouts**,
  **retries with exponential backoff + jitter**, and **bulkheads**.
- **Service discovery**: Kubernetes DNS (`<service>.<ns>.svc.cluster.local`) +
  optionally Consul/Istio for advanced policies.
- **API versioning**: `/api/v1`, `/api/v2` — never break a published version.

### 6.2 Asynchronous: Kafka (primary) + RabbitMQ (task queues)

- **Kafka** → durable event log, fan-out, replay, event sourcing readiness.
- **RabbitMQ** (or BullMQ on Redis) → short-lived task queues (send-email,
  process-image), retries, DLQs.

### 6.3 Realtime: Socket.IO

- Client ↔ `realtime-service` only.
- Backend services **never** speak WebSockets directly to clients; they emit
  events that `realtime-service` consumes and fans out into rooms.

### 6.4 Contract Governance

- All HTTP APIs are defined in **OpenAPI 3.1** (in `packages/contracts/openapi/`).
- All events are defined in **AsyncAPI 2.6** with **JSON-Schema / Avro** payloads
  (in `packages/events/schemas/`).
- **Codegen** produces typed clients and server stubs into `packages/contracts/generated/`.
- **Pact contract tests** run on every PR — consumer-driven, blocking on break.

```
Service A ──► Contract (versioned) ──► Service B
                    │
                    ▼
           Pact Broker (CI gate)
```

---

## 7. Event-Driven Architecture

### 7.1 Event Backbone

- **Primary**: Apache Kafka (AWS MSK in prod).
- **Schema Registry**: Confluent / Apicurio — enforces forward & backward compatibility.
- **Format**: JSON for v1, **Avro/Protobuf** recommended for v2.

### 7.2 Topic Strategy

Topic naming convention:

```
<env>.<domain>.<aggregate>.<event-version>
e.g.  prod.breakdown.request.v1
      prod.payment.invoice.v1
      prod.tracking.location.v1
```

Each domain owns a small set of topics; events are **facts**, named in **past tense**.

### 7.3 Canonical Event Envelope

Every event carries a standardized envelope (defined once in `packages/events`):

```
{
  "id":           "uuid",
  "type":         "breakdown.request.created",
  "version":      "1.0.0",
  "occurredAt":   "ISO-8601",
  "producer":     "breakdown-service",
  "traceId":      "w3c-traceparent",
  "tenantId":     "optional",
  "correlationId":"uuid",
  "causationId":  "uuid",
  "schema":       "$ref to JSON-Schema",
  "data":         { ... }
}
```

### 7.4 Reliability Patterns

| Pattern | Purpose |
|---------|---------|
| **Outbox Pattern** | Atomic write of state + event row inside Mongo transaction; a relay publishes to Kafka. |
| **Idempotent Consumers** | Every consumer dedupes by `event.id` in Redis (TTL'd) or Mongo. |
| **Dead-Letter Topics** | `<topic>.DLT` per topic; alerted in Grafana. |
| **Saga Orchestration** | Long-running multi-service workflows (e.g. payment → assignment → notification) coordinated by a Saga in `breakdown-service`. |
| **Event Replay** | Topics retain 7–30 days; analytics & new consumers can replay from offset 0. |
| **Compaction** | Reference data topics (e.g. `provider.profile.snapshot.v1`) use log compaction. |

### 7.5 Example Flow — A New Breakdown Request

```
[Client]
   │ POST /v1/breakdowns
   ▼
[api-gateway] ──auth──► [auth-service]
   │
   ▼
[breakdown-service]
   │ Tx: insert Request + outbox row "breakdown.request.created"
   │
   ├── emits ► Kafka: breakdown.request.v1
   │
   ├──► [ai-service]      (consume → run diagnosis on uploaded media)
   ├──► [tracking-service](consume → start tracking session)
   ├──► [notification-service] (consume → alert nearby providers)
   ├──► [analytics-service](consume → KPI update)
   └──► [realtime-service](consume → push to user room)
```

No service blocks another. Failures retry. Replays are safe (idempotency).

---

## 8. Database Architecture

### 8.1 Database-per-Service

Each service has a **logical database** (in MongoDB) it exclusively owns.
No cross-service joins; cross-service reads happen via APIs or read-models
built from events.

| Service | DB | Caches |
|---------|----|--------|
| auth-service       | `rg_auth`         | Redis (OTP, sessions, blacklist) |
| user-service       | `rg_users`        | Redis (profile cache) |
| provider-service   | `rg_providers`    | Redis (availability map) |
| vehicle-service    | `rg_vehicles`    | — |
| breakdown-service  | `rg_breakdowns`   | Redis (dispatch locks, candidates) |
| tracking-service   | `rg_tracking`     | Redis Geo (live positions) |
| payment-service    | `rg_payments`     | Redis (idempotency keys) |
| notification-service | `rg_notifications` | Redis (rate, throttle) |
| ai-service         | `rg_ai` + Vector DB | Redis (embedding cache) |
| media-service      | `rg_media` + S3   | CloudFront |
| analytics-service  | `rg_analytics` (+ ClickHouse later) | — |
| admin-service      | `rg_admin`        | — |

### 8.2 MongoDB Design Principles

- **Replica Sets** in every environment for HA.
- **Sharding** ready: shard keys chosen per collection (e.g. `tenantId + _id`
  for multi-tenant collections; `geohash` for `tracking`).
- **Indexes** declared in code, validated at startup, audited via CI.
- **Transactions** only where strictly necessary (outbox + aggregate root writes).
- **Schema versioning**: every document carries `schemaVersion`; migrations are
  online and additive.

### 8.3 Redis Usage Matrix

| Purpose | Pattern |
|---------|---------|
| Session store | Hash per session, TTL |
| OTP & nonce | String with TTL |
| Rate limiting | Token bucket / sliding window via Lua |
| Distributed locks | Redlock |
| Pub/Sub | Socket.IO adapter, ephemeral signals |
| Geo (live positions) | Redis GEO commands |
| Caching | Cache-aside + read-through, namespaced keys |
| Job queues | BullMQ |
| Idempotency keys | TTL'd strings |

### 8.4 Queue Storage

- **BullMQ on Redis** — short-running jobs (send-sms, transcode-image).
- **Kafka** — durable, ordered events; **the source of truth** for inter-service flow.
- **RabbitMQ** (optional) — RPC-like task queues with priority & complex routing.

### 8.5 Vector Database

- Abstraction layer in `packages/ai-core/vector/` with adapters for Pinecone,
  Weaviate, Qdrant, Milvus.
- One collection per knowledge domain (`vehicle-manuals`, `troubleshooting-kb`,
  `provider-handbook`, `policy-docs`).
- Metadata filtering on `tenantId`, `language`, `vehicleType`.

### 8.6 Event Sourcing Readiness

- Today: **CRUD + Event Notification** (events emitted alongside state writes).
- Tomorrow: opt-in **event-sourced aggregates** in critical domains
  (breakdown, payment) — Kafka topics already act as the log.
- `packages/events/sourcing/` reserved for snapshot/projection plumbing.

### 8.7 Audit Logging

- **Append-only** `audit_logs` collection per service, plus a global
  `prod.audit.log.v1` Kafka topic streamed to long-term cold storage (S3 + Athena).
- Captures: actor, action, target, before/after diff, traceId, IP, userAgent.

### 8.8 Read/Write Separation Readiness

- All repositories accept `readPreference` ("primary" / "secondaryPreferred").
- Hot read paths (analytics, dashboards) configured to prefer secondaries.
- Future: **CQRS** read-models built by analytics-service consuming events.

---

## 9. AI Architecture

The `ai-service` is a **plane**, not a single endpoint. It is the only service
allowed to talk to LLM providers.

```
┌─────────────────────────── ai-service ───────────────────────────┐
│                                                                   │
│   ┌──────────┐    ┌──────────┐    ┌──────────────┐               │
│   │  Chat    │    │  Voice   │    │ Image-Vision │               │
│   │ Assistant│    │ Assistant│    │  Diagnosis   │               │
│   └────┬─────┘    └─────┬────┘    └──────┬───────┘               │
│        │                │                │                        │
│        ▼                ▼                ▼                        │
│   ┌────────────────────────────────────────────┐                 │
│   │            Agent Orchestrator               │ ◀── LangChain   │
│   │  (tools · memory · planner · safety)       │                  │
│   └────────────────┬───────────────────────────┘                 │
│                    ▼                                              │
│   ┌──────────────────────────┐   ┌────────────────────────┐      │
│   │  Prompt Registry         │   │  Model Router          │      │
│   │  (versioned, A/B tested) │   │  (OpenAI/Anthropic/    │      │
│   └──────────────────────────┘   │  local · cost-aware)   │      │
│                                  └────────────────────────┘      │
│                                                                   │
│   ┌────────────────────────────────────────────┐                 │
│   │            RAG Pipeline                     │                 │
│   │  Ingest → Chunk → Embed → Store → Retrieve  │                 │
│   │     → Rerank → Compose → Generate           │                 │
│   └────────────────┬───────────────────────────┘                 │
│                    ▼                                              │
│   ┌─────────────────────────┐   ┌─────────────────────────┐      │
│   │     Vector DB Adapter   │   │  Guardrails / Safety    │      │
│   │ Pinecone/Weaviate/Qdrant│   │  PII redaction · policy │      │
│   └─────────────────────────┘   └─────────────────────────┘      │
│                                                                   │
│   ┌────────────────────────────────────────────┐                 │
│   │   Evaluation & Feedback Loop                │                 │
│   │   (offline evals · online thumbs · drift)   │                 │
│   └────────────────────────────────────────────┘                 │
└───────────────────────────────────────────────────────────────────┘
```

Key principles:

- **Provider-agnostic** via a `ModelRouter` adapter (OpenAI, Anthropic, Bedrock,
  Vertex, local Llama/Mistral).
- **Prompt-as-Code**: every prompt is versioned in `packages/ai-core/prompts/`
  and rolled out behind feature flags.
- **RAG-first** for any factual answer; pure generation only for chit-chat.
- **Tooling**: agents call internal services through **typed tools** that wrap
  internal contracts (cannot call arbitrary endpoints).
- **Multilingual**: language detected per request, prompts/templates localized.
- **Safety**: input/output guardrails, PII scrubbing, jailbreak detection,
  cost/latency budgets per request.
- **Observability**: every LLM call emits a structured trace with prompt,
  response, tokens, cost, latency, evaluation score.

---

## 10. Security Architecture

Security is layered (defense-in-depth).

### 10.1 Edge

- AWS WAF + Shield (DDoS, OWASP Top 10 rules).
- CloudFront with signed URLs for media.
- TLS 1.3 everywhere; HSTS preloaded.
- Strict CORS allowlist per client surface.

### 10.2 API Gateway

- **JWT verification** (RS256, JWKS rotated).
- **mTLS** for service-to-service (Istio / Linkerd).
- **Rate limits**: global, per-IP, per-user, per-endpoint (Redis token bucket).
- **Schema validation** before reaching services.
- **Bot protection** (hCaptcha / Cloudflare Turnstile on sensitive endpoints).
- **API versioning** + sunset headers.

### 10.3 AuthN / AuthZ

- **JWT access tokens** (short-lived, 10–15 min) + **refresh tokens** (rotating,
  family-tracked, reuse-detection revokes the family).
- **Device fingerprinting** + per-device session ledger.
- **MFA**: TOTP, SMS OTP, WhatsApp OTP, magic links.
- **RBAC + ABAC hybrid**: roles (`user`, `provider`, `admin`, `fleet-owner`)
  + attribute checks (resource ownership, tenant, geofence).
- **Policy DSL** in `packages/auth/policies/` — central, testable.

### 10.4 Data Security

- **Encryption at rest**: MongoDB native encryption, S3 SSE-KMS, EBS encryption.
- **Encryption in transit**: TLS everywhere, including intra-cluster.
- **Field-level encryption** (CSFLE) for PII (phone, ID numbers, KYC).
- **Tokenization** for payment data (PCI scope reduced — never store PANs).
- **Secret management**: AWS Secrets Manager / HashiCorp Vault, never in env files in prod.
- **Key rotation**: automated, audited.

### 10.5 Application Security

- `helmet` on every HTTP service (CSP, X-Frame-Options, etc.).
- Strict input validation (Zod) at the boundary.
- Output encoding for any rendered surface.
- **CSRF** protection on cookie-based flows; tokenized.
- Audit logs immutable + signed.

### 10.6 Upload Security

- Presigned uploads to S3 (gateway never streams files).
- MIME sniffing + size limits at presign issuance.
- **Async virus scan** (ClamAV) before object becomes "public".
- Re-encoding for images (strip EXIF, normalize).

### 10.7 Fraud & Abuse Hooks

- `fraud-detection` module hooks in `payment-service` and `breakdown-service`
  (velocity rules, device reputation, geo anomalies).
- Pluggable rules engine; integrates with `ai-service` for anomaly scoring.

### 10.8 Compliance Readiness

- GDPR / DPDP: data export, right-to-erasure, consent ledger in `user-service`.
- PCI-DSS scope kept minimal via tokenization.
- SOC 2: audit logs + access reviews + change management via GitOps.

### 10.9 Supply Chain

- SBOMs generated per image (Syft).
- Image scanning (Trivy) blocks `HIGH/CRITICAL` CVEs in CI.
- Signed images (Cosign) + admission controller verifies signatures.
- Dependency updates via Renovate, auto-merge after green CI.

---

## 11. Scaling Strategy

### 11.1 Horizontal Scaling

- Every service is **stateless** → scale by replica count.
- **HPA** on CPU + custom metrics (RPS, queue depth, p95 latency).
- **KEDA** for event-driven autoscaling (scale workers on Kafka lag).
- **Cluster Autoscaler** + spot/on-demand mix for cost efficiency.

### 11.2 Read Scaling

- MongoDB **secondaries** for reads.
- Aggressive **Redis caching** (cache-aside, read-through) with cache stampede
  protection (single-flight via Redlock).
- **CDN** caching for public/static content and signed media.
- Future: dedicated **CQRS read models** in analytics-service.

### 11.3 Write Scaling

- Sharding on high-volume collections (`tracking`, `events`, `audit_logs`).
- **Outbox + Kafka** decouples write throughput from downstream consumers.
- Batching where semantics allow (GPS pings, analytics events).

### 11.4 Realtime Scaling

- Socket.IO horizontally scaled with Redis adapter; no sticky sessions needed.
- Per-room fan-out so a million connections don't all receive every event.
- Heartbeats + idle disconnect to bound memory.

### 11.5 AI Scaling

- LLM calls queued, rate-limited per tenant, with **cost ceilings**.
- Embedding generation batched.
- Vector DB sharded by tenant/domain.
- **Cache** common prompts/responses with semantic similarity threshold.

### 11.6 Geographical Scaling

- Multi-AZ from day 1.
- Multi-Region ready: stateless services replicable; data layer uses Atlas
  Global Clusters / Aurora Global / DynamoDB Global Tables (future).
- Edge POPs via CloudFront for static & API caching.

### 11.7 Multi-Tenant Scaling (Future)

- Tenant ID propagated through every request (`x-tenant-id` header → context).
- Every Mongo query, Redis key, S3 prefix, Kafka topic partition keyed by tenant.
- "Silo" tier (dedicated DB) available for enterprise fleets; "pool" tier
  (shared DB, tenant-scoped) for SMB.

---

## 12. DevOps & Infrastructure Strategy

### 12.1 Local Development

- `docker-compose.dev.yml` brings up: Mongo, Redis, Kafka, Zookeeper, MinIO
  (S3-compatible), Mailhog, Vector DB.
- `pnpm dev` (Turborepo) runs only affected apps with hot reload.
- Mock external providers via WireMock / MSW.

### 12.2 Containerization

- **Multi-stage Dockerfiles**: builder → pruned runtime (~80–150MB).
- Non-root users, read-only filesystems, minimal base (`node:lts-alpine`
  or distroless).
- Health checks (`/healthz`, `/readyz`).

### 12.3 Orchestration

- **Kubernetes (EKS)** as the runtime.
- **Helm umbrella chart** with per-service sub-charts.
- **Kustomize overlays** for env-specific patches.
- **Service Mesh** (Istio or Linkerd): mTLS, traffic shifting, retries, observability.
- **NetworkPolicies** for least-privilege intra-cluster comms.
- **PodSecurity Standards** = `restricted`.

### 12.4 Infrastructure as Code

- **Terraform** modules for VPC, EKS, MSK (Kafka), ElastiCache (Redis),
  Atlas / DocumentDB (Mongo), S3, CloudFront, IAM, KMS, Secrets Manager,
  WAF, Route53, observability stack.
- Remote state in S3 with DynamoDB locking.
- `terraform plan` runs on every PR; `apply` gated by manual approval in prod.

### 12.5 CI/CD

GitHub Actions pipelines:

| Workflow | Trigger | Gates |
|----------|---------|-------|
| `ci.yml` | PR | Lint, typecheck, unit, integration, contract tests, SBOM, Trivy, gitleaks |
| `cd-dev.yml` | merge → `develop` | Build images, push ECR, ArgoCD sync to `dev` |
| `cd-staging.yml` | merge → `main` | Deploy `staging`, run e2e + load smoke |
| `cd-prod.yml` | tag `vX.Y.Z` | Manual approval, canary via Flagger, automated rollback |
| `infra-plan.yml` | PR touching `infrastructure/terraform/**` | Terraform plan comment on PR |
| `security-scan.yml` | nightly | Full Trivy + Snyk + dependency audit |

- **GitOps** with ArgoCD: cluster state = Git state. No `kubectl apply` by humans.
- **Progressive Delivery**: Flagger canary based on success rate + latency SLIs.

### 12.6 Environments

- `dev` → ephemeral, auto-rebuilt, mock 3rd parties.
- `staging` → production-like, real sandbox 3rd parties, blue/green capable.
- `prod` → canary releases, SLO-gated, on-call.
- Optional **preview environments** per PR (namespace-per-PR).

### 12.7 Secret Management

- Secrets in **AWS Secrets Manager** / **Vault**.
- Injected via **External Secrets Operator** into Kubernetes.
- No `.env` files in container images. Local dev uses `.env.local`
  (git-ignored, generated by `pnpm run env:pull`).

### 12.8 Observability Stack

| Pillar | Tool |
|--------|------|
| Logs | Winston/Pino → Loki / CloudWatch (structured JSON, traceId-correlated) |
| Metrics | Prometheus (RED + USE) → Grafana |
| Traces | OpenTelemetry → Tempo / X-Ray |
| Alerts | Alertmanager → PagerDuty / Opsgenie |
| Errors | Sentry per service |
| Synthetic | Checkly / Grafana Synthetic monitors |
| Cost | Kubecost + AWS Cost Explorer |

**Golden Signals** dashboards per service: latency, traffic, errors, saturation.

**SLOs** defined per service in `observability/prometheus/rules/slo-*.yaml`.
Error budgets gate releases.

### 12.9 Backup & DR

- MongoDB Atlas continuous backups + cross-region snapshot copy.
- S3 versioning + Object Lock for audit/media buckets.
- Kafka topics with replication factor 3, MRR (multi-region) for critical topics.
- **Runbooks** per service in `docs/runbooks/`; **GameDays** quarterly.
- **RPO** ≤ 5 min, **RTO** ≤ 30 min for tier-1 services.

---

## 13. Monolith → Microservices Migration Path

Today's "modular monolith" can be deployed in **three modes** without code changes:

### Mode A — Single Process (Day-1, low traffic)
- One Node.js process boots multiple modules via a composite entrypoint.
- Internal calls bypass HTTP (in-process function calls), still through DI.
- Kafka still used for cross-module events (forces decoupling early).

### Mode B — Process-per-Service in One Cluster (Day-30+, current target)
- Each `apps/*` runs as its own pod; communicates over the mesh.
- Same repo, same CI, independent deploys per service.

### Mode C — Repo-per-Service / Team-Owned Microservices (Year-2+)
- A service graduates: its folder + its tests + its contracts are split out.
- `packages/contracts` and `packages/events` are published as versioned npm
  packages from the monorepo; the spun-out service consumes them.
- No code rewrite is needed because:
  - Domain layer is framework-agnostic.
  - Persistence, messaging, and HTTP are already adapters.
  - Contracts are explicit; events versioned.
  - Each service already owns its database.

### What enables painless migration

| Enabler | Where |
|---------|-------|
| Hexagonal layering | every `apps/*/src/domain` + `application` + `infrastructure` |
| DB-per-service | §8.1 |
| Contracts in code | `packages/contracts` |
| Versioned events | `packages/events` |
| Service-mesh-ready | Helm + Istio |
| Outbox pattern | guaranteed atomicity at split time |
| Boundary lint rules | `eslint-plugin-boundaries` forbids `apps/A` importing `apps/B` |

---

## 14. Deployment-Ready Considerations

- **12-Factor compliance**: config via env, logs to stdout, stateless processes,
  port binding, disposability, dev/prod parity.
- **Graceful shutdown**: SIGTERM → stop accepting new requests → drain in-flight
  → close DB/Kafka/Redis → exit.
- **Health probes**: `/livez` (process alive), `/readyz` (deps reachable),
  `/healthz` (deep check).
- **Zero-downtime deploys**: rolling updates + readiness gating + connection draining.
- **Backpressure**: queue depth + consumer lag alarms; circuit breakers in adapters.
- **Migrations**: forward-only, online, backward-compatible; multi-deploy pattern
  (add column → backfill → switch reads → remove old column).
- **Feature flags**: LaunchDarkly / Unleash / in-house — gate every risky change.
- **Idempotency**: required on every state-changing public endpoint.
- **Rate limit & quota** budgets per tenant.
- **Cost guardrails**: budgets per service per env; alerts wired to Slack.

---

## 15. Best Practices & Engineering Standards

### 15.1 Code

- **TypeScript strict mode**, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`.
- **DI** via `tsyringe` / `awilix` / `InversifyJS` — no `new SomeService()` in business code.
- **Repository pattern** — domain never imports Mongoose directly.
- **Adapter pattern** — every 3rd-party SDK behind an internal interface.
- **DTOs** for transport; **entities** for domain; **mappers** between them.
- **Zod** for runtime validation at the boundary; types inferred.
- **No magic strings** — use enums or constants.
- **Errors** are typed (`DomainError`, `NotFoundError`, etc.) and mapped to HTTP centrally.

### 15.2 Testing

- **Test pyramid**: many unit, fewer integration, even fewer e2e.
- **Contract tests** are mandatory for every cross-service interaction.
- **Property-based testing** (fast-check) for domain invariants.
- **Test containers** for integration tests against real Mongo/Redis/Kafka.
- Coverage threshold ≥ 80% on changed lines, enforced in CI.

### 15.3 Repository Hygiene

- **Conventional Commits** + commitlint.
- **CODEOWNERS** per `apps/*`.
- **PR template** with: change summary, impact, rollout plan, rollback plan,
  observability changes.
- **ADR** required for any decision that future engineers would ask "why?".
- **No direct push to `main`** — protected branch, signed commits, status checks.

### 15.4 Performance Discipline

- p95 latency budget per endpoint, enforced via SLOs.
- N+1 queries fail in CI via static analysis.
- All hot paths must use indexes verified by `explain()` in CI.
- Profile-before-optimize; benchmarks in `tests/load/`.

### 15.5 Documentation

- Every service has a `README.md` + `runbook.md` + OpenAPI + AsyncAPI.
- Architecture changes require an **ADR** in `docs/adr/`.
- C4 diagrams kept current (System → Container → Component → Code).
- This file (`ARCHITECTURE.md`) is updated on every cross-cutting change.

### 15.6 Operational Excellence

- **On-call rotations** with documented runbooks.
- **Incident management** (Severity 1–4) with public post-mortems.
- **Chaos engineering** via Litmus / Chaos Mesh — at least one GameDay per quarter.
- **Release notes** auto-generated from Conventional Commits.
- **Capacity planning** reviewed quarterly against growth projections.

---

## Appendix A — Service Quick Reference

| Service | Port (dev) | DB | Topics Owned | Sync API |
|---------|-----------|----|--------------|----------|
| api-gateway        | 3000 | —              | — | REST |
| auth-service       | 3001 | rg_auth        | `auth.user.*`, `auth.session.*` | REST + gRPC |
| user-service       | 3002 | rg_users       | `user.profile.*`, `user.membership.*` | REST + gRPC |
| provider-service   | 3003 | rg_providers   | `provider.*` | REST + gRPC |
| vehicle-service    | 3004 | rg_vehicles    | `vehicle.*` | REST + gRPC |
| breakdown-service  | 3005 | rg_breakdowns  | `breakdown.*` | REST + gRPC |
| tracking-service   | 3006 | rg_tracking    | `tracking.*` | REST + gRPC |
| payment-service    | 3007 | rg_payments    | `payment.*`, `wallet.*` | REST + gRPC |
| notification-service | 3008 | rg_notifications | `notification.*` | REST |
| ai-service         | 3009 | rg_ai + Vector | `ai.diagnosis.*`, `ai.chat.*` | REST + gRPC |
| media-service      | 3010 | rg_media       | `media.*` | REST |
| analytics-service  | 3011 | rg_analytics   | (consumer-only) | REST |
| admin-service      | 3012 | rg_admin       | `admin.audit.*` | REST |
| realtime-service   | 3013 | —              | (consumer-only) | WSS |

---

## Appendix B — Future Roadmap Hooks (already wired in)

- **IoT / Telematics**: `vehicle-service/integrations/telematics/` + `tracking-service` accepts device-level payloads.
- **White-label / Multi-tenant**: `tenantId` plumbed via middleware in every service; data partitioned by tenant.
- **Fleet Enterprise**: `provider-service/modules/fleet-providers/` reserved; analytics-service ready for fleet KPIs.
- **Predictive Maintenance**: `ai-service/modules/predictive-maintenance/` reserved; consumes `vehicle.*` and `tracking.*` events.
- **Insurance Integrations**: `vehicle-service/integrations/insurance/` adapter slot.
- **AI Agents Marketplace**: `ai-service/modules/agents/` already supports pluggable agents and tools.
- **Offline Sync**: client SDK + `sync-service` (future) using CRDT-friendly event log; `events/` envelope is already idempotent and ordered.

---

**End of Architecture Document**
