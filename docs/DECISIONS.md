# Decisions

## D1 — Do not move the React app

The approved frontend lives in `Reception application in Albanian` and is the Cursor workspace. Moving it into `hotel-reservation/frontend` would break the open workspace, Vite, and tests.

The Laravel API is a sibling folder:

`/Users/almotech-elio/Projects/Innora-backend`

## D2 — One property, physical rooms are the calendar

The calendar rows are physical rooms. A stay can be saved against a room type before a room number is chosen. See D12.

## D3 — Checkout does not occupy the next night

A stay occupies `[check_in, check_out)`. A departure on 21 September leaves that room free on the night of 21 September.

## D4 — Cancelled and no-show do not block inventory

`cancelled` and `no_show` are excluded from overlap checks and from sellable-inventory consumption.

## D5 — The local database is authoritative

A direct reservation is committed before any channel job runs. A failed provider call does not roll back the stay. Milestone 1 records that job in `sync_logs` through a null provider. No Channex or Beds24 client yet.

## D6 — UI contract stays stable

React types stay `RESERVED | IN_HOUSE | COMPLETED | CANCELLED` and `DIREKT | BOOKING | TELEFON | WHATSAPP | RECEPSION`. The API resource maps English database enums to those values. Database columns and PHP enums stay English.

## D7 — Public room id is the room number

The calendar already uses `"101"` as `roomId`. The rooms API returns that number as `id`. The numeric primary key stays internal.

## D8 — JSON envelope

Laravel responses use `{ "success", "message", "data" }` on success. Expected business failures are HTTP 422 from `throwValidationError`, with `message` and `errors`. The React client unwraps `data`. Operator-facing copy comes from `lang/sq` (`APP_LOCALE=sq`). Mock Service Worker still returns the raw resource and is only for UI tests.

## D9 — Booking value is not the folio

`reservations.total_cents` is the agreed booking value. Posted charges, payments, and the balance live on the folio. `paid_cents` is a cache of posted payments. Reports never treat the booking total as cash received that day.

## D10 — Authentication

Laravel Passport password grant. Login returns `user` plus `authorization` (`access_token`, `refresh_token`). The Vite app stores tokens and sends `Authorization: Bearer …`. Routes use `auth:api`. Roles are `owner` and `reception` with permissions declared on `UserRole`. `permission` middleware and manager checks enforce them. Owner bypasses via `Gate::before`. Seeded desk password is `Admin1234.2`.

## D11 — The desk does not type Booking.com

`POST /api/reservations` accepts `TELEFON`, `RECEPSION`, `WHATSAPP`, or `DIREKT`. Omitted source is `DIREKT`. `BOOKING` is a validation error. A Booking.com stay is created only by `ReservationManager::importExternal`.

## D12 — Room type inventory and physical rooms

A reservation requires a room type. The physical room can be empty until reception assigns it. Availability counts unassigned stays against the type, then the remaining free rooms. Operational status is not the reservation status. Checkout marks the room `dirty`. Check-in requires `ready` or `inspected`.

Channel room ids will live in `channel_room_type_maps`. The reception role may edit room types until a separate manager role exists.

## D13 — Channel credentials live on the property

Beds24 is the only channel in the catalog for now. The list can take another provider later. Tokens are entered in Cilësimet and stored encrypted on `channel_connections`. The API masks secrets. The public base URL may be set with `BEDS24_BASE_URL`. Saving a connection does not call Beds24 yet.

## D14 — Checkout requires a settled folio unless the owner overrides

Reception may check out only when the folio balance is zero. That closes the folio. An owner with `folios.checkout_outstanding` may check out with a balance; the folio stays open and the stay appears under outstanding balances.

## D15 — Financial vocabulary and KPIs

- Booking value: `reservations.total_cents`
- Charges / revenue: posted non-voided `folio_items` by service date
- Payments: posted non-voided `payments` by paid_at
- Outstanding: open folios with balance above zero

Occupancy = rooms sold / available room nights (active rooms, excluding out of order and blocked nights).
ADR = room revenue / sold nights excluding complimentary (amount 0).
RevPAR = room revenue / available room nights.
These reports are revenue and payments. They are not profit or P&L.
