# Deploy Road Guard — Vercel (frontend) + Fly.io (backend)

## Architecture

| Part | Host | URL example |
|------|------|-------------|
| Next.js app | **Vercel** | `https://roadguard.vercel.app` |
| API + Socket.IO | **Fly.io** | `https://roadguard-api.fly.dev` |
| MongoDB | **MongoDB Atlas** | connection string |
| Redis (recommended) | **Upstash** | `rediss://...` |

---

## Part 1 — MongoDB Atlas (manual)

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Database user + password.
3. Network access: for a quick demo, allow `0.0.0.0/0` (tighten later).
4. Copy connection string, e.g.  
   `mongodb+srv://USER:PASS@cluster.mongodb.net/roadguard?retryWrites=true&w=majority`

---

## Part 2 — Redis (optional but recommended for production)

1. Create a database at [upstash.com](https://upstash.com) (free tier).
2. Copy the **Redis URL** (`rediss://...`).

If you skip Redis, set `REDIS_ENABLED=false` on Fly (auth works; prefer Redis for production sockets).

---

## Part 3 — Fly.io (backend)

### Prerequisites

- [flyctl](https://fly.io/docs/hands-on/install-flyctl/) installed
- `fly auth login`

### Deploy

```bash
cd RoadGuard-AI-Backend
fly launch --no-deploy
# Use existing fly.toml when prompted, app name e.g. roadguard-api
```

Set secrets (replace values):

```bash
fly secrets set \
  MONGODB_URI='mongodb+srv://...' \
  MONGODB_DB_NAME='roadguard' \
  REDIS_URL='rediss://...' \
  REDIS_ENABLED='true' \
  JWT_ACCESS_SECRET='your-long-random-access-secret-min-16' \
  JWT_REFRESH_SECRET='your-long-random-refresh-secret-min-16' \
  CORS_ORIGIN='https://YOUR-APP.vercel.app' \
  SOCKET_ENABLED='true'
```

Deploy:

```bash
fly deploy
fly status
curl https://roadguard-api.fly.dev/api/v1/health
```

Note your API URL: `https://<your-app>.fly.dev`

### Fly tips

- `primary_region = 'bom'` in `fly.toml` is Mumbai; change if needed (`sin`, `iad`, …).
- Socket.IO works on Fly with `min_machines_running = 1` (single machine avoids sticky-session issues without Redis adapter).
- Set `TRUST_PROXY=true` (already in `fly.toml` `[env]`).

---

## Part 4 — Vercel (frontend)

### Connect repo

1. Push `RoadGuard-AI-Frontend` to GitHub.
2. [vercel.com](https://vercel.com) → **Add New Project** → import repo.
3. **Root Directory**: leave as repository root (where `vercel.json` lives).
4. Framework: Next.js (auto-detected from `vercel.json`).

### Environment variables

In Vercel → Project → Settings → Environment Variables:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://<your-app>.fly.dev/api/v1` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://<your-app>.fly.dev` |
| `NEXT_PUBLIC_SOCKET_PATH` | `/socket.io` |
| `NEXT_PUBLIC_MAP_PROVIDER` | `leaflet` |

Redeploy after changing env vars.

### CORS on Fly

After first Vercel deploy, copy the exact URL (e.g. `https://roadguard-xxx.vercel.app`) and update:

```bash
fly secrets set CORS_ORIGIN='https://roadguard-xxx.vercel.app'
```

For preview deployments, you can use `CORS_ORIGIN=*` temporarily (not for production).

---

## Part 5 — Smoke test

1. Open Vercel URL → register as customer.
2. Add vehicle → create breakdown request.
3. Register provider → onboard via API (until UI exists):

```bash
curl -X POST https://<your-app>.fly.dev/api/v1/providers \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"providerType":"MECHANIC","serviceRadiusKm":25,"currentLocation":{"type":"Point","coordinates":[72.8777,19.0760]}}'
```

4. Assign provider (auto on create, or admin flow).
5. Provider: open job → **Start tracking** (allow location).
6. Customer: open request detail → live map + socket **Live** indicator.

DevTools → Network → WS should connect to `wss://<your-app>.fly.dev/socket.io`.

---

## Costs (rough)

| Service | Free tier |
|---------|-----------|
| Vercel | Hobby OK for demos |
| Fly.io | Small VM; watch auto-stop settings |
| MongoDB Atlas | M0 free |
| Upstash | Free tier |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Login fails from Vercel | API down, wrong `NEXT_PUBLIC_API_BASE_URL`, or CORS |
| Socket offline | Wrong `NEXT_PUBLIC_SOCKET_URL`, or API not deployed |
| Fly health check fails | Mongo connection; check `fly logs` |
| Geolocation on provider phone | Site must be **HTTPS** (Vercel + Fly are fine) |
