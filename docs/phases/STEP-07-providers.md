# Step 7 — Provider Module

## Prerequisites

Register/login with `role: "PROVIDER"` then onboard.

## Endpoints

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/v1/providers` | PROVIDER |
| GET | `/api/v1/providers/me` | PROVIDER |
| PATCH | `/api/v1/providers/me` | PROVIDER |
| PATCH | `/api/v1/providers/availability` | PROVIDER |
| PATCH | `/api/v1/providers/location` | PROVIDER |
| GET | `/api/v1/providers/nearby` | Any authenticated user |

## Nearby search

```
GET /api/v1/providers/nearby?longitude=72.8777&latitude=19.0760&radiusKm=10
```
