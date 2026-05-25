# Step 5 — Auth + User Module

## Endpoints

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/v1/auth/register` | Public |
| POST | `/api/v1/auth/login` | Public |
| POST | `/api/v1/auth/refresh-token` | Public |
| POST | `/api/v1/auth/logout` | Bearer + refreshToken body |
| POST | `/api/v1/auth/logout-all` | Bearer |
| GET | `/api/v1/auth/me` | Bearer |

## Quick test

```bash
# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Sam","lastName":"Test","email":"sam@test.com","phoneNumber":"9876543210","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sam@test.com","password":"password123"}'

# Me
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer <accessToken>"
```
