# API documentation

OpenAPI 3.0 specification and Swagger UI for the Road Guard REST API.

## Local

After starting the API (`pnpm dev` from backend monorepo):

- **Swagger UI:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **OpenAPI JSON:** [http://localhost:3000/api-docs/openapi.json](http://localhost:3000/api-docs/openapi.json)
- **OpenAPI YAML:** [http://localhost:3000/api-docs/openapi.yaml](http://localhost:3000/api-docs/openapi.yaml)

## Authentication in Swagger UI

1. Call `POST /auth/login` (or use demo credentials from `SEED-DEMO-DATA.md`).
2. Copy `data.tokens.accessToken` from the response.
3. Click **Authorize** in Swagger UI.
4. Enter: `Bearer <accessToken>`

## Files

| File | Purpose |
|------|---------|
| `openapi.yaml` | OpenAPI 3.0 spec |
| `register-swagger.ts` | Express mount at `/api-docs` |

The YAML file is copied to `dist/docs/` during `pnpm build`.
