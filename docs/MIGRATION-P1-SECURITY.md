# P1 Security Remediation — Migration Notes

**Date:** 19 June 2026  
**Scope:** RG-009, RG-014, RG-016/017, RG-018, RG-019

---

## 1. Secure session cookies (RG-009)

### What changed
- Frontend middleware now validates an **HMAC-signed HttpOnly** cookie (`rg-session`) instead of forgeable `rg-auth=1` flags.
- Login/register/refresh still return JWT tokens in JSON (**backward compatible**).
- After auth, the client calls `POST /api/auth/session` to set the signed cookie on the Vercel domain.

### Migration steps
1. Set `RG_SESSION_SECRET` on Vercel (32+ characters). Generate with:
   ```bash
   openssl rand -base64 32
   ```
2. Redeploy the frontend.
3. Existing users: on next page load, Redux rehydration calls `setTokens()` which syncs the new session cookie automatically.
4. Legacy `rg-auth` / `rg-auth-role` cookies are cleared on logout and no longer set.

---

## 2. Provider KYC enforcement (RG-014)

### What changed
- PROVIDER self-registration remains allowed; new providers start with `kycStatus: PENDING`.
- Providers **cannot go online** or receive assignments until an admin sets KYC to `VERIFIED`.
- New admin endpoint: `PATCH /api/v1/admin/providers/:id/kyc-status` with body `{ "kycStatus": "VERIFIED" | "PENDING" | "REJECTED" }`.

### Migration steps
1. Verify existing demo/production providers in MongoDB have `kycStatus: VERIFIED` if they should remain active (demo seed already sets this).
2. Use the admin UI **Approve KYC** button on the provider detail sheet, or call the API directly.
3. No database migration required.

---

## 3. Production Redis (RG-016 / RG-017)

### What changed
- `render.yaml` now provisions a **Redis instance** and sets:
  - `REDIS_ENABLED=true`
  - `SOCKET_REDIS_ADAPTER=true`
  - `REDIS_URL` from the Redis service connection string

### Migration steps (existing Render deployments)
1. Add a Redis instance in Render (Starter plan) or apply the updated blueprint.
2. Set environment variables on the API service:
   ```
   REDIS_ENABLED=true
   SOCKET_REDIS_ADAPTER=true
   REDIS_URL=<redis connection string>
   ```
3. Redeploy the API. Health check should show `redis.connected: true`.
4. **Note:** Socket presence is still in-memory per instance; Redis adapter enables **multi-instance Socket.IO fan-out**. Full Redis-backed presence is a future enhancement.

---

## 4. Restrictive CORS (RG-018)

### What changed
- Production startup **fails** if `CORS_ORIGIN=*` or empty.
- `CORS_ORIGIN` must be a comma-separated list of explicit URLs (e.g. `https://app.vercel.app`).

### Migration steps
1. On Render, set:
   ```
   CORS_ORIGIN=https://your-app.vercel.app
   ```
2. For preview deployments, add comma-separated origins or use a staging API with matching CORS.
3. Redeploy the API.

---

## 5. Bank details encryption (RG-019)

### What changed
- Provider `bankDetails.accountNumber` and `ifscCode` are encrypted at rest with **AES-256-GCM** when `FIELD_ENCRYPTION_KEY` is set.
- Plaintext values remain readable (backward compatible) until migrated.
- New writes encrypt automatically.

### Migration steps
1. Generate a 32-byte key:
   ```bash
   openssl rand -base64 32
   ```
2. Set `FIELD_ENCRYPTION_KEY` on the API (Render / `.env`).
3. Run the one-time migration against existing data:
   ```bash
   cd RoadGuard-AI-Backend
   FIELD_ENCRYPTION_KEY=<your-key> pnpm --filter @roadguard/api migrate:encrypt-bank
   ```
4. **Back up the key securely** — loss of the key makes encrypted data unrecoverable.
5. Production startup requires `FIELD_ENCRYPTION_KEY` to be set.

---

## Environment variable checklist

| Variable | Where | Required in prod |
|----------|-------|------------------|
| `RG_SESSION_SECRET` | Vercel (frontend) | Yes |
| `FIELD_ENCRYPTION_KEY` | Render (API) | Yes |
| `CORS_ORIGIN` | Render (API) | Yes (explicit URLs) |
| `REDIS_URL` | Render (API) | Yes if `REDIS_ENABLED=true` |
| `REDIS_ENABLED` | Render (API) | Recommended `true` |
| `SOCKET_REDIS_ADAPTER` | Render (API) | Recommended `true` with Redis |
