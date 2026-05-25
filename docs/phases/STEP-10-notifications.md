# Step 10 — Notification System

## APIs

| Method | Path |
|--------|------|
| GET | `/api/v1/notifications` |
| GET | `/api/v1/notifications/unread-count` |
| PATCH | `/api/v1/notifications/:id/read` |
| PATCH | `/api/v1/notifications/read-all` |

Query: `page`, `limit`, `sort`, `unreadOnly`, `type`

## Socket events

- `notification:new`
- `notification:read`
- `notification:count:update`

## Auto-triggers

Breakdown module → `BreakdownNotificationsIntegration` on create, assign, status change, cancel.

MVP delivery: **IN_APP** only. Push/SMS/Email/WhatsApp providers stubbed.
