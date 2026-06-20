# Deploy Road Guard — Render (API) + Vercel (web)

For **10–15 users**: Starter web service on Render (~$7/mo, no sleep) + Vercel Hobby + MongoDB Atlas M0 (free).

---

## 1. MongoDB Atlas (5 min)

1. [mongodb.com/atlas](https://www.mongodb.com/atlas) → free M0 cluster  
2. Database user + password  
3. Network access → allow `0.0.0.0/0` (pilot only; restrict later)  
4. Copy connection string → `MONGODB_URI`

---

## 2. Render — backend

### Option A — Blueprint (`render.yaml` in repo)

1. Push `RoadGuard-AI-Backend` to GitHub  
2. [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**  
3. Connect repo → Render reads `render.yaml` (includes **Redis** + API web service)  
4. Set when prompted:
   - **`MONGODB_URI`**
   - **`CORS_ORIGIN`** — your Vercel URL, e.g. `https://your-app.vercel.app` (**required**, no wildcard in production)
   - **`FIELD_ENCRYPTION_KEY`** — `openssl rand -base64 32`
5. Deploy  

### Option B — Manual Web Service

| Setting | Value |
|---------|--------|
| **Environment** | Node |
| **Root directory** | `.` (repo root) |
| **Build command** | `corepack enable && corepack prepare pnpm@9.15.0 --activate && pnpm install --prod=false && pnpm build` |
| **Start command** | `pnpm start` |
| **Health check path** | `/api/v1/health` |
| **Plan** | **Starter** (recommended — no sleep; WebSockets stay reliable) |

Add a **Redis** instance (Starter) in the same region and link `REDIS_URL`.

### Environment variables (Render → Environment)

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `20` |
| `TRUST_PROXY` | `true` |
| `MONGODB_URI` | Atlas connection string |
| `MONGODB_DB_NAME` | `roadguard` |
| `REDIS_ENABLED` | `true` |
| `REDIS_URL` | Redis connection string from Render Redis |
| `SOCKET_REDIS_ADAPTER` | `true` |
| `JWT_ACCESS_SECRET` | long random string (16+ chars) |
| `JWT_REFRESH_SECRET` | different long random string |
| `FIELD_ENCRYPTION_KEY` | `openssl rand -base64 32` |
| `CORS_ORIGIN` | `https://your-app.vercel.app` (comma-separated for multiple origins) |
| `SOCKET_ENABLED` | `true` |
| `SOCKET_PATH` | `/socket.io` |

`PORT` is set automatically by Render — do not override.

After deploy, note URL: **`https://roadguard-api.onrender.com`** (yours may differ).

```bash
curl https://YOUR-SERVICE.onrender.com/api/v1/health
```

Expect `data.infrastructure.redis.connected: true` when Redis is configured.

### Post-deploy: encrypt existing bank details (if any)

```bash
FIELD_ENCRYPTION_KEY=<same-as-render> pnpm --filter @roadguard/api migrate:encrypt-bank
```

See [MIGRATION-P1-SECURITY.md](./MIGRATION-P1-SECURITY.md) for full migration notes.

---

## 3. Vercel — frontend

1. Push `RoadGuard-AI-Frontend` to GitHub  
2. [vercel.com](https://vercel.com) → import repo (uses root `vercel.json`)  
3. Environment variables:

| Key | Value |
|-----|--------|
| `NEXT_PUBLIC_API_BASE_URL` | `https://YOUR-SERVICE.onrender.com/api/v1` |
| `NEXT_PUBLIC_SOCKET_URL` | `https://YOUR-SERVICE.onrender.com` |
| `NEXT_PUBLIC_SOCKET_PATH` | `/socket.io` |
| `RG_SESSION_SECRET` | `openssl rand -base64 32` (32+ chars, server-only) |

4. Deploy → copy URL `https://xxx.vercel.app`

---

## 4. Link CORS

In Render, update:

```
CORS_ORIGIN=https://xxx.vercel.app
```

Redeploy if needed. Test register/login from Vercel.

---

## 5. Pilot checklist (10–15 users)

- [ ] Health URL returns `"success": true` and Redis connected  
- [ ] Register customer + provider on Vercel  
- [ ] Admin approves provider KYC before provider goes online  
- [ ] Provider onboard: `POST /api/v1/providers` with Bearer token (until UI exists)  
- [ ] Customer: vehicle → breakdown → provider assigned → live map  
- [ ] Provider: job detail → **Start tracking** (allow location)  
- [ ] DevTools → WS to `wss://YOUR-SERVICE.onrender.com/socket.io`  
- [ ] Session cookie `rg-session` is HttpOnly (Application → Cookies)

---

## Cost (pilot)

| Service | ~/month |
|---------|---------|
| Render Starter (API) | ~$7 |
| Render Starter (Redis) | ~$10 |
| Vercel Hobby | $0 |
| Atlas M0 | $0 |
| **Total** | **~$17** |

Free Render tier works but **sleeps** when idle — first visit slow; not ideal for live tracking demos.

---

## Fly.io files

`Dockerfile` / `fly.toml` are optional — ignore them if you use Render only.
