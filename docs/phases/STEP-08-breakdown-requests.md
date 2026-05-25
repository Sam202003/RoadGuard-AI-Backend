# Step 8 — Breakdown Request Engine

## Routes

| Method | Path | Roles |
|--------|------|-------|
| POST | `/api/v1/breakdown-requests` | CUSTOMER |
| GET | `/api/v1/breakdown-requests` | All authenticated (scoped by role) |
| GET | `/api/v1/breakdown-requests/:id` | Owner / assigned provider / ADMIN |
| PATCH | `/api/v1/breakdown-requests/:id/status` | PROVIDER (assigned), ADMIN |
| PATCH | `/api/v1/breakdown-requests/:id/assign-provider` | ADMIN |
| PATCH | `/api/v1/breakdown-requests/:id/cancel` | CUSTOMER (own), ADMIN |

## Module layout

`apps/api/src/modules/breakdown-requests/` — controllers, services, repositories, schemas, validators, routes, utils, constants.

## Create flow

1. Validate vehicle ownership via `VehicleService`.
2. Persist request (`CREATED` → `SEARCHING_PROVIDER`).
3. Geo search for nearest **AVAILABLE** + **ONLINE** provider matching issue type.
4. Auto-assign if found (`PROVIDER_ASSIGNED`, ETA/distance, provider → `BUSY`).

## Status transitions

`CREATED` → `SEARCHING_PROVIDER` → `PROVIDER_ASSIGNED` → `ON_THE_WAY` → `ARRIVED` → `IN_PROGRESS` → `COMPLETED` / `CANCELLED` (terminal).
