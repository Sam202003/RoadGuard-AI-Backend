# Demo users & providers seed

Populates MongoDB with sample **customers**, **providers** (with full provider profiles), and one **admin**.

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

Connect with the same `MONGODB_URI` → database `roadguard` → collections `users`, `providers`.

## Notes

- Emails use domain `@roadguard.demo` so they are easy to spot and remove.
- Script is **idempotent**: re-running skips accounts that already exist.
- Use `--reset` to wipe all `@roadguard.demo` users and providers, then re-seed.
- **Do not use these passwords in production.**
