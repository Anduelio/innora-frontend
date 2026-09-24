# API contract

Base URL in development: `http://127.0.0.1:8000`. The Vite app calls `/api/...` on port 5173 and proxies.

Success body: `{ "success": true, "message": "<text>", "data": <resource or array> }`.
Business failure: HTTP 422 `{ "message": "<text>", "errors": { "<field>": ["<text>"] } }`.
Auth failure: HTTP 401 or 422 `{ "success": false, "message": "<text>" }`.
Dates are `YYYY-MM-DD`. Money is integer cents. Checkout is the departure date and is not an occupied night.

## Auth

Passport password grant. The desk stores the Bearer token and sends `Authorization: Bearer …`.

| Method | Path | Body | Result |
| --- | --- | --- | --- |
| POST | `/api/login` | `{ "email", "password" }` | `{ "data": { "user", "authorization" } }` |
| POST | `/api/auth/refresh` | `{ "refresh_token" }` | `{ "data": { "authorization" } }` |
| POST | `/api/auth/password` | `{ "current_password", "new_password", "new_password_confirmation" }` | updated user |
| POST | `/api/logout` | | revokes the current token |
| GET | `/api/me` | | `{ "data": { "name", "email", "role", "permissions" } }` |

All routes below require `auth:api`. Sensitive folio and report routes also use `permission:…`.

## Desk

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/rooms?no_pagination=1` | `Room[]`: `id` (room number), `type`, `typeName`, `operationalStatus`, `floor`, `beds`, `amenities`, `blocks` |
| POST | `/api/rooms` | create one physical room |
| POST | `/api/rooms/bulk` | `{ roomTypeId, numbers[] }` and optional numeric `from`/`to` |
| PUT | `/api/rooms/{number}` | edit number, type, floor, building, notes |
| POST | `/api/rooms/{number}/status` | `{ operationalStatus }` |
| POST | `/api/rooms/{number}/blocks` | `{ startsOn, endsOn, type, reason }`. `endsOn` is exclusive |
| DELETE | `/api/room-blocks/{id}` | remove a block |
| GET/POST | `/api/room-types` | room type, beds, amenities, occupancy, base price |
| PUT | `/api/room-types/{id}` | update a room type |
| GET | `/api/amenities` | amenity catalog |
| GET/PUT | `/api/settings/hotel` | `{ checkInTime, checkOutTime }` as `HH:MM` |
| GET | `/api/reservations/{id}/folio` | primary folio with items and payments |
| GET | `/api/folios/{id}` | folio detail |
| POST | `/api/folios/{id}/charges` | `{ chargeCategoryId, description, quantity, unitCents, serviceDate? }` |
| POST | `/api/folio-items/{id}/void` | `{ reason }` |
| POST | `/api/folios/{id}/payments` | `{ method, amountCents, paidAt?, reference?, notes? }` |
| GET | `/api/charge-categories` | charge category catalog |
| GET | `/api/reports/revenue` | posted charges by service date (`preset` or `from`/`to`) |
| GET | `/api/reports/payments` | money received by method |
| GET | `/api/reports/outstanding` | open folios with balance |
| GET | `/api/reports/source` | revenue by reservation source |
| GET | `/api/reports/daily` | daily operations and finance |
| GET | `/api/reports/occupancy` | occupancy, ADR, RevPAR |
| GET | `/api/reports/channel` | Booking.com commission when supplied |
| GET | `/api/reports/dashboard` | outstanding total for the desk |
| GET | `/api/reports/export/{type}` | CSV or printable HTML (`format=pdf`) |
| GET | `/api/channels/catalog` | provider fields: which are required and which are secret |
| GET | `/api/channels` | saved connections; secrets are masked |
| POST | `/api/channels` | `{ providerCode, isActive, credentials }`. A blank secret keeps the stored value. One active connection per property |
| DELETE | `/api/channels/{id}` | removes that property's connection |
| POST | `/api/reservations/{id}/assign` | `{ roomId }` physical room number |
| GET | `/api/reservations?from&to&no_pagination=1` | stays that overlap `[from, to)` |
| POST | `/api/reservations` | `{ roomId }` or `{ roomTypeId }` when the room is not chosen yet. 422 if that inventory is taken |
| PATCH | `/api/reservations/{id}` | edit room, guest, dates, persons, total, notes |
| POST | `/api/reservations/{id}/check-in` | only from confirmed/pending |
| POST | `/api/reservations/{id}/check-out` | only from checked_in |
| POST | `/api/reservations/{id}/cancel` | sets cancelled |
| GET | `/api/guests?no_pagination=1` | `{ id, name, phone, stays, lastStay }` |
| GET | `/api/sync/status` | `{ ok, lastSyncAt, message? }` |
| POST | `/api/sync/retry` | requeues the availability job for the property |
| POST | `/api/sync/fail` | local demo only: marks the connection unhealthy |

### Create body

```json
{
  "roomId": "105",
  "guestName": "Elira Duka",
  "phone": "+355 69 000 0000",
  "persons": 2,
  "source": "TELEFON",
  "checkIn": "2026-09-21",
  "nights": 2,
  "totalCents": 18000,
  "notes": ""
}
```

`source` is `TELEFON`, `RECEPSION`, `WHATSAPP`, or `DIREKT`. Omitted means `DIREKT`. `BOOKING` returns 422. `checkOut` is `checkIn + nights`.

### Reservation resource

`id`, `roomId`, `guestName`, `phone`, `persons`, `checkIn`, `checkOut`, `status`, `source`, `totalCents`, `paidCents`, `notes`, `expectedArrival`, `externalRef`, `createdAt`.

`status` and `source` use the UI enums in D6, not the database enums.

## Availability rule returned as 422

`Dhoma është e zënë për këto data.`

The same rule rejects a second overlapping active stay on that physical room, including stays that only share a middle night. The checkout morning of an existing stay is free.
