# Step 6 — Vehicle Module

## Endpoints (all require `Authorization: Bearer <accessToken>`)

| Method | Path |
|--------|------|
| POST | `/api/v1/vehicles` |
| GET | `/api/v1/vehicles` |
| GET | `/api/v1/vehicles/:id` |
| PATCH | `/api/v1/vehicles/:id` |
| DELETE | `/api/v1/vehicles/:id` |

## Create example

```bash
curl -X POST http://localhost:3000/api/v1/vehicles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleType": "CAR",
    "brand": "Toyota",
    "model": "Camry",
    "year": 2022,
    "registrationNumber": "MH12AB1234",
    "fuelType": "PETROL",
    "transmissionType": "AUTOMATIC",
    "color": "White",
    "isPrimaryVehicle": true
  }'
```
