# Architecture

Innora is one product in two folders.

| App | Path | Role |
| --- | --- | --- |
| React + Vite | this folder | Albanian reception UI. Design stays. |
| Laravel 13 | `../Innora-backend` | Reservations, availability, auth, channel sync |

The React app does not calculate authoritative availability. It displays API data and sends intents (create, edit, check-in, check-out, cancel). Overlap and inventory rules live in `ReservationManager`, inside a transaction that locks the physical room.

The backend module map is `../Innora-backend/docs/ARCHITECTURE.md`.

## Request path

Browser → Vite (`localhost:5173`) → proxy `/api` and `/sanctum` → Laravel (`127.0.0.1:8000`).

When `VITE_USE_MOCKS` is not `false`, MSW answers `/api` in the browser. Set it to `false` to use Laravel. Playwright keeps mocks on so the visual tests do not need MySQL.

## Backend layout

- Controllers stay thin: the authenticated user goes to a manager, and `App\Traits\ApiTrait` returns `{ success, message, data }`.
- Form Requests validate input. Expected business failures use `HasMessages::throwValidationError` (HTTP 422) and `messages.*` keys in `lang/en` and `lang/sq`.
- API Resources match the existing TypeScript models. Resources are not wrapped a second time.
- `App\Managers\Reservations\ReservationManager` creates, updates, checks in, checks out, cancels, and imports external stays.
- A stay typed at the desk is `TELEFON`, `RECEPSION`, `WHATSAPP`, or `DIREKT`. `BOOKING` is rejected on create. Booking.com stays enter only through `importExternal`.
- `App\Managers\Hotel\AvailabilityManager` answers “is this physical room free?” and “how many units of this room type are left?”.
- Lists use property visibility, then the filter pipeline (`from` / `to` overlap). `DataManager` is a singleton.
- `App\Channels\Contracts\ChannelProvider` is the only door to a future connectivity provider. Milestone 1 binds `NullChannelProvider`, which writes a `sync_logs` row and does not call the network.
- After commit, `SyncAvailabilityJob` runs that provider. The stay is already saved.

## Frontend layout

Pages, calendar, and SCSS modules stay as generated. HTTP lives in `src/lib/api`. Components do not call `fetch`. TanStack Query remains the server-state cache. Zustand keeps calendar view and open dialogs only.

| Screen | Folder | Job |
| --- | --- | --- |
| Hyrje | `features/hyrje` | Login |
| Përmbledhje | `features/permbledhje` | Today: arrivals and departures |
| Kalendari | `features/kalendari` | Rooms by night. The main screen |
| Rezervimet | `features/rezervimet` | Searchable list |
| Dhomat | `features/dhomat` | Room board |
| Klientët | `features/klientet` | Name and phone |
| Cilësimet | `features/cilesimet` | “Sinkronizuar” or “Problem me lidhjen” |

## What is still mock-only

- Drag geometry, toasts, and layout.
- `POST /api/sync/fail` exists so the settings warning can be demonstrated. It flips the latest sync log; it does not call Booking.com.
- SSE `/api/stream` is optional. Mutations already refresh the query cache. A missing stream must not break the desk.
