# Domain

One hotel (Vila Dea, Sarandë). English table and column names.

## Relationships

```
properties 1──* users
properties 1──* room_types 1──* rooms
properties 1──* guests 1──* reservations
reservations 1──* reservation_rooms *──1 rooms
reservations 1──* reservation_rooms *──1 room_types
rooms 1──* room_blocks
channel_connections 1──* sync_logs
```

`reservation_rooms` is the stay line. Milestone 1 writes exactly one line per reservation, with a required physical room, because the calendar is room-by-room. A later Booking.com import may create the line with a room type first and assign `room_id` when the desk places the guest.

## Status

Database: `pending`, `confirmed`, `checked_in`, `checked_out`, `cancelled`, `no_show`.

Shown in the UI as:

| Database | UI |
| --- | --- |
| pending, confirmed | RESERVED |
| checked_in | IN_HOUSE |
| checked_out | COMPLETED |
| cancelled, no_show | CANCELLED |

Direct create starts as `confirmed`.

## Source

Database: `booking_com`, `direct`, `phone`, `whatsapp`, `walk_in`.

Shown as `BOOKING`, `DIREKT`, `TELEFON`, `WHATSAPP`, `RECEPSION`.

A direct stay is not stored as a Booking.com reservation. It only reduces the room-type inventory a future provider may push.

## Availability

For a physical room, a date is blocked when an active stay covers it or a room block covers it. Active means status is not `cancelled` or `no_show`. The checkout date is free.

For a room type on a night:

```
sellable rooms of that type (active, not out of service)
− rooms with an active stay that night
− rooms blocked that night
```

Out-of-service rooms are not sellable. Milestone 1 has the column and the count, and no out-of-service screen yet.

## Guests

A guest is found by normalized phone when a phone is present, otherwise created by name. The guest list is stored rows, with stay counts derived from reservations.

## Channel tables (empty in normal use)

`channel_connections` holds the future provider (`channex` or `beds24`) for the property. `sync_logs` records each availability push attempt. No credentials are required in Milestone 1.
