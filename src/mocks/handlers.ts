import { http, HttpResponse } from 'msw'
import { DESK_SOURCES, type CreateReservationInput, type Reservation, type UpdateReservationInput } from '@/types/domain'
import { addDaysIso } from '@/lib/date/calendar'
import { getDb, publish, resetDb, subscribe, toGuests } from '@/mocks/db'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function overlaps(checkIn: string, checkOut: string, other: Reservation, ignoreId?: string): boolean {
  if (other.id === ignoreId || other.status === 'CANCELLED') return false
  return checkOut > other.checkIn && checkIn < other.checkOut
}

function roomTaken(roomId: string, checkIn: string, checkOut: string, ignoreId?: string): boolean {
  return getDb().reservations.some(
    (reservation) => reservation.roomId === roomId && overlaps(checkIn, checkOut, reservation, ignoreId),
  )
}

export const handlers = [
  http.get('/api/rooms', () => HttpResponse.json(getDb().rooms)),

  http.get('/api/reservations', ({ request }) => {
    const url = new URL(request.url)
    const from = url.searchParams.get('from') ?? '0000-01-01'
    const to = url.searchParams.get('to') ?? '9999-12-31'
    const list = getDb().reservations.filter(
      (reservation) => reservation.checkOut > from && reservation.checkIn < to,
    )
    return HttpResponse.json(list)
  }),

  http.post('/api/reservations', async ({ request }) => {
    await delay(250)
    const body = (await request.json()) as CreateReservationInput
    const checkOut = addDaysIso(body.checkIn, body.nights)
    if (body.source && !DESK_SOURCES.includes(body.source)) {
      return HttpResponse.json(
        { message: 'Booking.com nuk shkruhet këtu. Zgjidhni telefon, recepsion, WhatsApp ose direkt.' },
        { status: 422 },
      )
    }
    if (body.roomId && roomTaken(body.roomId, body.checkIn, checkOut)) {
      return HttpResponse.json({ message: 'Dhoma është e zënë për këto data.' }, { status: 409 })
    }
    const db = getDb()
    const reservation: Reservation = {
      id: `r${db.seq++}`,
      roomId: body.roomId ?? '',
      roomTypeId: body.roomTypeId,
      guestName: body.guestName.trim(),
      phone: body.phone?.trim() ?? '',
      persons: body.persons,
      checkIn: body.checkIn,
      checkOut,
      status: 'RESERVED',
      source: body.source ?? 'DIREKT',
      totalCents: body.totalCents,
      paidCents: 0,
      notes: body.notes?.trim() || undefined,
      expectedArrival: '14:00',
      createdAt: new Date().toISOString(),
    }
    db.reservations.push(reservation)
    publish({ type: 'reservation.created', reservation })
    return HttpResponse.json(reservation, { status: 201 })
  }),

  http.patch('/api/reservations/:id', async ({ params, request }) => {
    await delay(250)
    const patch = (await request.json()) as UpdateReservationInput
    const db = getDb()
    const current = db.reservations.find((reservation) => reservation.id === params.id)
    if (!current) return HttpResponse.json({ message: 'Nuk u gjet.' }, { status: 404 })
    const next: Reservation = {
      ...current,
      ...patch,
      notes: patch.notes === undefined ? current.notes : patch.notes.trim() || undefined,
    }
    if (roomTaken(next.roomId, next.checkIn, next.checkOut, current.id)) {
      return HttpResponse.json({ message: 'Dhoma është e zënë për këto data.' }, { status: 409 })
    }
    Object.assign(current, next)
    publish({ type: 'reservation.updated', reservation: current })
    return HttpResponse.json(current)
  }),

  http.post('/api/reservations/:id/check-in', async ({ params }) => {
    await delay(200)
    const current = getDb().reservations.find((reservation) => reservation.id === params.id)
    if (!current) return HttpResponse.json({ message: 'Nuk u gjet.' }, { status: 404 })
    if (current.status !== 'RESERVED') {
      return HttpResponse.json({ message: 'Hyrja nuk mund të regjistrohet.' }, { status: 409 })
    }
    current.status = 'IN_HOUSE'
    publish({ type: 'reservation.updated', reservation: current })
    return HttpResponse.json(current)
  }),

  http.post('/api/reservations/:id/check-out', async ({ params }) => {
    await delay(200)
    const current = getDb().reservations.find((reservation) => reservation.id === params.id)
    if (!current) return HttpResponse.json({ message: 'Nuk u gjet.' }, { status: 404 })
    if (current.status !== 'IN_HOUSE') {
      return HttpResponse.json({ message: 'Dalja nuk mund të regjistrohet.' }, { status: 409 })
    }
    current.status = 'COMPLETED'
    publish({ type: 'reservation.updated', reservation: current })
    return HttpResponse.json(current)
  }),

  http.post('/api/reservations/:id/cancel', async ({ params }) => {
    await delay(200)
    const current = getDb().reservations.find((reservation) => reservation.id === params.id)
    if (!current) return HttpResponse.json({ message: 'Nuk u gjet.' }, { status: 404 })
    current.status = 'CANCELLED'
    publish({ type: 'reservation.updated', reservation: current })
    return HttpResponse.json(current)
  }),

  http.get('/api/guests', ({ request }) => {
    const guests = toGuests(getDb().reservations)
    const url = new URL(request.url)
    if (url.searchParams.get('no_pagination') === '1') return HttpResponse.json(guests)
    const query = (url.searchParams.get('q') ?? '').trim().toLowerCase()
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1)
    const perPage = Math.max(1, Number(url.searchParams.get('per_page') ?? '4') || 4)
    const filtered = query
      ? guests.filter((guest) => guest.name.toLowerCase().includes(query) || guest.phone.includes(query))
      : guests
    const start = (page - 1) * perPage
    return HttpResponse.json({
      items: filtered.slice(start, start + perPage),
      page,
      hasMore: start + perPage < filtered.length,
    })
  }),

  http.get('/api/sync/status', () => HttpResponse.json(getDb().sync)),

  http.post('/api/sync/retry', async () => {
    await delay(200)
    const sync = getDb().sync
    sync.ok = true
    sync.lastSyncAt = new Date().toISOString()
    sync.message = undefined
    publish({ type: 'sync.status', status: sync })
    return HttpResponse.json(sync)
  }),

  http.post('/api/sync/fail', () => {
    const sync = getDb().sync
    sync.ok = false
    sync.message = 'Problem me lidhjen'
    publish({ type: 'sync.status', status: sync })
    return HttpResponse.json(sync)
  }),

  http.post('/api/__reset', () => {
    resetDb()
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/stream', () => {
    const encoder = new TextEncoder()
    let unsubscribe = () => {}
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        unsubscribe = subscribe((event) => {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
          } catch {
            unsubscribe()
          }
        })
      },
      cancel() {
        unsubscribe()
      },
    })
    return new HttpResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  }),
]
