import { http, HttpResponse } from 'msw'
import { DESK_SOURCES, type CreateReservationInput, type Reservation, type UpdateReservationInput } from '@/types/domain'
import { addDaysIso } from '@/lib/date/calendar'
import { guestMatches } from '@/lib/guestBook'
import { isArrivalOn, isDepartureOn, isInHouseOn } from '@/lib/desk'
import { getDb, listGuests, publish, resetDb, subscribe } from '@/mocks/db'

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
    const arriving = url.searchParams.get('arriving_on')
    const departing = url.searchParams.get('departing_on')
    const inHouse = url.searchParams.get('in_house_on')
    let list = getDb().reservations
    if (arriving || departing || inHouse) {
      list = list.filter((reservation) => {
        if (arriving && !isArrivalOn(reservation, arriving)) return false
        if (departing && !isDepartureOn(reservation, departing)) return false
        if (inHouse && !isInHouseOn(reservation, inHouse)) return false
        return true
      })
    } else {
      const from = url.searchParams.get('from') ?? '0000-01-01'
      const to = url.searchParams.get('to') ?? '9999-12-31'
      list = list.filter((reservation) => reservation.checkOut > from && reservation.checkIn < to)
    }
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
      return HttpResponse.json({ message: 'Dhoma është e zënë për këto data.' }, { status: 422 })
    }
    const db = getDb()
    const reservation: Reservation = {
      id: `r${db.seq++}`,
      roomId: body.roomId ?? '',
      roomTypeId: body.roomTypeId,
      guestName: body.guestName.trim(),
      phonePrefix: body.phonePrefix,
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
      return HttpResponse.json({ message: 'Dhoma është e zënë për këto data.' }, { status: 422 })
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
    const url = new URL(request.url)
    const filters = {
      q: url.searchParams.get('q') ?? '',
      withPhone: url.searchParams.get('withPhone') === '1',
    }
    const filtered = listGuests().filter((guest) => guestMatches(guest, filters))
    if (url.searchParams.get('no_pagination') === '1') return HttpResponse.json(filtered)
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1') || 1)
    const perPage = Math.max(
      1,
      Number(url.searchParams.get('page_size') ?? url.searchParams.get('per_page') ?? '4') || 4,
    )
    const lastPage = Math.max(1, Math.ceil(filtered.length / perPage))
    const current = Math.min(page, lastPage)
    const start = (current - 1) * perPage
    return HttpResponse.json({
      success: true,
      data: filtered.slice(start, start + perPage),
      meta: {
        current_page: current,
        last_page: lastPage,
        per_page: perPage,
        total: filtered.length,
      },
    })
  }),

  http.post('/api/guests', async ({ request }) => {
    const body = (await request.json()) as { name?: string; phonePrefix?: string; phone?: string }
    const name = body.name?.trim() ?? ''
    if (!name) return HttpResponse.json({ message: 'Shkruani emrin e klientit.' }, { status: 422 })
    const phone = (body.phone ?? '').replace(/\D/g, '')
    const key = `${body.phonePrefix ?? ''}${phone}`.replace(/\D/g, '')
    const taken =
      phone.length > 0 &&
      listGuests().some((guest) => `${guest.phonePrefix ?? ''}${guest.phone}`.replace(/\D/g, '') === key)
    if (taken) return HttpResponse.json({ message: 'Ky telefon është i regjistruar.' }, { status: 422 })
    const db = getDb()
    const guest = {
      id: `g${db.guestSeq++}`,
      name,
      phonePrefix: body.phonePrefix?.trim() || null,
      phone,
      stays: 0,
      lastStay: null,
    }
    db.directory.push(guest)
    return HttpResponse.json({ success: true, data: guest }, { status: 201 })
  }),

  http.put('/api/guests/:id', async ({ params, request }) => {
    const body = (await request.json()) as { name?: string; phonePrefix?: string; phone?: string }
    const name = body.name?.trim() ?? ''
    if (!name) return HttpResponse.json({ message: 'Shkruani emrin e klientit.' }, { status: 422 })
    const id = String(params.id)
    const current = listGuests().find((guest) => guest.id === id)
    if (!current) return HttpResponse.json({ message: 'Nuk u gjet.' }, { status: 404 })
    const phone = (body.phone ?? '').replace(/\D/g, '')
    const db = getDb()
    const next = {
      ...current,
      name,
      phonePrefix: phone ? body.phonePrefix?.trim() || null : current.phonePrefix,
      phone,
    }
    const index = db.directory.findIndex((guest) => guest.id === id)
    if (index >= 0) db.directory[index] = next
    else db.directory.push(next)
    return HttpResponse.json({ success: true, data: next })
  }),

  http.delete('/api/guests/:id', ({ params }) => {
    const id = String(params.id)
    const current = listGuests().find((guest) => guest.id === id)
    if (!current) return HttpResponse.json({ message: 'Nuk u gjet.' }, { status: 404 })
    if (current.stays > 0) {
      return HttpResponse.json({ message: 'Klienti ka qëndrime dhe nuk fshihet.' }, { status: 422 })
    }
    const db = getDb()
    db.directory = db.directory.filter((guest) => guest.id !== id)
    return new HttpResponse(null, { status: 204 })
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
