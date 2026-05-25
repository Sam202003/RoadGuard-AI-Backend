# Demo users & providers seed

Populates MongoDB with sample **customers**, **providers**, **vehicles**, **breakdown requests** (roadside assistance complaints), **notifications**, and one **admin**.

## Prerequisites

- MongoDB reachable (local Compass or **MongoDB Atlas**)
- `apps/api/.env` has correct `MONGODB_URI` and `MONGODB_DB_NAME=roadguard`

## Run

From backend repo root:

```bash
cd RoadGuard-AI-Backend
pnpm seed:demo
```

Delete existing demo users and re-create:

```bash
pnpm seed:demo -- --reset
```

Or from `apps/api`:

```bash
cd apps/api
pnpm seed:demo
```

## Demo login (all accounts)

| Field | Value |
|-------|--------|
| **Password** | `Demo@12345` |

### Customers

| Name | Email |
|------|--------|
| Priya Sharma | `priya.sharma@roadguard.demo` |
| Rahul Mehta | `rahul.mehta@roadguard.demo` |
| Ananya Desai | `ananya.desai@roadguard.demo` |
| Karan Iyer | `karan.iyer@roadguard.demo` |

### Service providers (already onboarded)

| Business | Type | Email |
|----------|------|--------|
| Patil Roadside Mechanics | MECHANIC | `vikram.patil@roadguard.demo` |
| Kulkarni Tow & Rescue | TOWING | `sneha.kulkarni@roadguard.demo` |
| Singh Battery Assist | BATTERY_SUPPORT | `arjun.singh@roadguard.demo` |
| Joshi Fuel On-Demand | FUEL_DELIVERY | `meera.joshi@roadguard.demo` |
| Verma EV Rapid Help | EV_SUPPORT | `rohan.verma@roadguard.demo` |

Providers are seeded as **AVAILABLE** / **ONLINE** (except Rohan: BUSY) with GPS near Mumbai/Pune for breakdown assignment tests.

### Admin

| Email |
|--------|
| `admin@roadguard.demo` |

## MongoDB Compass

Connect with the same `MONGODB_URI` → database `roadguard` → collections:

| Collection | Demo content |
|------------|----------------|
| `users` | 4 customers + 5 providers + 1 admin |
| `providers` | Full provider profiles (GPS, KYC verified) |
| `vehicles` | 1 vehicle per customer (`DEMO-MH-*` plates) |
| `breakdownrequests` | 20 requests (mixed statuses) |
| `notifications` | 9 in-app notifications |

### Provider job queue (login as provider → **Requests** or **Dashboard**)

| Provider | Completed (done) | Active (in progress) |
|----------|------------------|-------------------------|
| `vikram.patil@roadguard.demo` | 3 | Flat tyre assigned, brake job in progress |
| `sneha.kulkarni@roadguard.demo` | 2 | Engine tow on the way, engine assigned |
| `arjun.singh@roadguard.demo` | 2 | Battery job on the way |
| `meera.joshi@roadguard.demo` | 2 | Fuel assigned, brake inspection arrived |
| `rohan.verma@roadguard.demo` | 1 | EV assist in progress, hybrid arrived |

Filter by status **COMPLETED** on the Requests page to see finished jobs.

### Sample customer requests

| Customer | Issue | Status |
|----------|--------|--------|
| Priya | Flat tyre | COMPLETED |
| Priya | Battery failure | ON_THE_WAY (live tracking) |
| Rahul | Out of fuel | PROVIDER_ASSIGNED |
| Rahul | Brake failure | ARRIVED |
| Ananya | Engine failure | PROVIDER_ASSIGNED |
| Ananya | EV battery low | IN_PROGRESS |
| Karan | Accident | CANCELLED |

## Notes

- Emails use domain `@roadguard.demo` so they are easy to spot and remove.
- Script is **idempotent**: re-running skips records that already exist.
- Use `--reset` to wipe all `@roadguard.demo` users, vehicles, requests, and notifications, then re-seed.
- **Do not use these passwords in production.**
