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
3. Connect repo → Render reads `render.yaml`  
4. Set **`MONGODB_URI`** and **`CORS_ORIGIN`** when prompted (`CORS_ORIGIN` = Vercel URL after step 3, or `*` for first test)  
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

### Environment variables (Render → Environment)

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `20` |
| `TRUST_PROXY` | `true` |
| `MONGODB_URI` | Atlas connection string |
| `MONGODB_DB_NAME` | `roadguard` |
| `REDIS_ENABLED` | `false` |
| `JWT_ACCESS_SECRET` | long random string (16+ chars) |
| `JWT_REFRESH_SECRET` | different long random string |
| `CORS_ORIGIN` | `https://your-app.vercel.app` |
| `SOCKET_ENABLED` | `true` |
| `SOCKET_PATH` | `/socket.io` |

`PORT` is set automatically by Render — do not override.

After deploy, note URL: **`https://roadguard-api.onrender.com`** (yours may differ).

```bash
curl https://YOUR-SERVICE.onrender.com/api/v1/health
```

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

- [ ] Health URL returns `"success": true`  
- [ ] Register customer + provider on Vercel  
- [ ] Provider onboard: `POST /api/v1/providers` with Bearer token (until UI exists)  
- [ ] Customer: vehicle → breakdown → provider assigned → live map  
- [ ] Provider: job detail → **Start tracking** (allow location)  
- [ ] DevTools → WS to `wss://YOUR-SERVICE.onrender.com/socket.io`  

---

## Cost (pilot)

| Service | ~/month |
|---------|---------|
| Render Starter | ~$7 |
| Vercel Hobby | $0 |
| Atlas M0 | $0 |
| **Total** | **~$7** |

Free Render tier works but **sleeps** when idle — first visit slow; not ideal for live tracking demos.

---

## Fly.io files

`Dockerfile` / `fly.toml` are optional — ignore them if you use Render only.
