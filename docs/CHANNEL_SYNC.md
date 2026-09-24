# Channel sync

Milestone 1 does not call Booking.com, Channex, or Beds24.

```
Booking.com  ↔  provider (later)  ↔  Laravel  ↔  React calendar
```

## Boundary

`App\Contracts\ChannelProvider`

- `pushAvailability(Property $property): void`

That is the only method bound in Milestone 1. Rates, restrictions, and inbound reservation webhooks stay behind the same contract later. They must not be copied into `ReservationManager`.

`NullChannelProvider` writes `sync_logs` with status `succeeded` and does not open a socket.

## Outbound (direct stay)

1. Validate the physical room and the room-type count.
2. Lock the room row.
3. Insert the reservation and its `reservation_rooms` line.
4. Commit.
5. Dispatch `SyncAvailabilityJob`.
6. The provider runs. Success or failure is a `sync_logs` row.
7. Retry is safe: the job pushes the current inventory, it does not create a second stay.

A stay typed at the desk is never inserted as `source = booking_com`. `POST /api/reservations` rejects `BOOKING`.

## Inbound (tested, no HTTP yet)

`ReservationManager::importExternal` is the future webhook handler’s only write path.

- New external id → create a stay (`booking_com`) and assign a free physical room of the mapped type when one exists.
- Same external id → update dates and guest (modification).
- Cancellation → status `cancelled`, inventory freed.
- Repeating the same create payload does not insert a second row.

## What the operator sees

Settings shows whether the last sync log succeeded. Copy stays in Albanian (“Sinkronizuar” / “Problem me lidhjen”). The screen does not name webhooks, OTAs, or inventory APIs.
