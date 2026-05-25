# Step 9 — Socket.IO Real-Time Tracking

## Endpoint

- Path: `SOCKET_PATH` (default `/socket.io`)
- Auth: JWT access token in `handshake.auth.token` or `Authorization: Bearer`

## Rooms

| Room | Members |
|------|---------|
| `request:<requestId>` | Customer, assigned provider, admin (after `request:join`) |
| `customer:<customerId>` | Customer sockets |
| `provider:<providerId>` | Provider sockets |
| `admin:monitoring` | Admin sockets |

## Client events

`auth:connect`, `provider:location:update`, `request:join`, `request:leave`, `provider:online`, `provider:offline`, `heartbeat`

## Server events

`auth:connected`, `request:created`, `request:status:updated`, `provider:assigned`, `provider:location:updated`, `tracking:eta:updated`, `provider:online:status`, `request:cancelled`, `error:event`, `heartbeat:ack`

## Env

See `apps/api/.env.example` — `SOCKET_ENABLED`, `SOCKET_REDIS_ADAPTER`, rate limit and heartbeat settings.

## Redis scaling

Set `SOCKET_REDIS_ADAPTER=true` when running multiple API instances (requires Redis connected).
