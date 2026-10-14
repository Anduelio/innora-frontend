import { http, HttpResponse } from 'msw'
import {
  DESK_SOURCES,
  PAYMENT_METHODS,
  type CreateReservationInput,
  type Payment,
  type RecordPaymentInput,
  type Reservation,
  type SaveUserInput,
  type StaffUser,
  type UpdateReservationInput,
} from '@/types/domain'
import { TODAY } from '@/lib/date/today'
import { freeRoomsForStay, typeFreeForStay } from '@/lib/inventory'
import { hasPermission } from '@/lib/permissions'
import { stayNights } from '@/lib/reservation'
import { authed, fail, login, logout, toCurrentUser } from '@/mocks/auth'
import { getDb, persist, publish, subscribe } from '@/mocks/db'
import { settingsHandlers } from '@/mocks/settingsHandlers'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function find(id: unknown): Reservation | undefined {
  return getDb().reservations.find((item) => item.id === id)
}

function nowAtHotel(): string {
  const time = new Date().toLocaleTimeString('sv-SE', { timeZone: 'Europe/Tirane' })
  return `${TODAY}T${time}+02:00`
}

function log(reservation: Reservation, actor: StaffUser, action: string, detail?: string) {
  reservation.history = [...(reservation.history ?? []), { at: nowAtHotel(), actor: actor.name, action, detail }]
}

function updated(reservation: Reservation) {
  publish({ type: 'reservation.updated', reservation })
  return HttpResponse.json(reservation)
}

function roomFits(reservation: Pick<Reservation, 'checkIn' | 'checkOut' | 'roomTypeId'>, roomId: string, ignoreId?: string) {
  const db = getDb()
  return freeRoomsForStay(reservation.checkIn, reservation.checkOut, db.rooms, db.reservations, {
    roomTypeId: reservation.roomTypeId,
    ignoreId,
  }).some((room) => room.id === roomId)
}

function activeOwners(users: StaffUser[]): number {
  return users.filter((user) => user.role === 'owner' && user.isActive).length
}

export const handlers = [
  ...settingsHandlers,

  http.post('/api/login', async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as { email?: string; password?: string }
    if (!body.email?.trim() || !body.password) return fail(422, 'CREDENTIALS_REQUIRED', 'Shkruani email-in dhe fjalëkalimin.')
    return login(body.email, body.password)
  }),

  http.post('/api/logout', ({ request }) => {
    logout(request)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/me', authed(null, (_info, user) => HttpResponse.json(toCurrentUser(user)))),


  http.get('/api/users', authed('users.manage', () => HttpResponse.json(getDb().users))),

  http.post(
    '/api/users',
    authed('users.manage', async ({ request }) => {
      await delay(250)
      const body = (await request.json()) as SaveUserInput
      const db = getDb()
      const email = body.email?.trim().toLowerCase() ?? ''
      if (!body.name?.trim()) return fail(422, 'NAME_REQUIRED', 'Shkruani emrin e përdoruesit.')
      if (!EMAIL.test(email)) return fail(422, 'EMAIL_INVALID', 'Shkruani një email të saktë.')
      if (db.users.some((user) => user.email.toLowerCase() === email)) {
        return fail(409, 'EMAIL_TAKEN', 'Ky email përdoret tashmë nga një llogari tjetër.')
      }
      if (!body.password || body.password.length < 8) {
        return fail(422, 'PASSWORD_WEAK', 'Fjalëkalimi duhet të ketë të paktën 8 shenja.')
      }
      const user: StaffUser = {
        id: db.userSeq++,
        name: body.name.trim(),
        email,
        role: body.role === 'owner' ? 'owner' : 'staff',
        isActive: true,
        lastLoginAt: null,
      }
      db.users.push(user)
      db.passwords[user.id] = body.password
      persist(db)
      return HttpResponse.json(user, { status: 201 })
    }),
  ),

  http.patch(
    '/api/users/:id',
    authed('users.manage', async ({ params, request }, actor) => {
      await delay(200)
      const db = getDb()
      const user = db.users.find((item) => item.id === Number(params.id))
      if (!user) return fail(404, 'NOT_FOUND', 'Përdoruesi nuk u gjet.')
      const body = (await request.json()) as SaveUserInput
      const self = user.id === actor.id
      if (self && (body.isActive === false || (body.role && body.role !== user.role))) {
        return fail(409, 'SELF_LOCKOUT', 'Nuk mund të çaktivizoni ose të ulni rolin e llogarisë tuaj.')
      }
      const next: StaffUser = {
        ...user,
        name: body.name?.trim() || user.name,
        role: body.role ?? user.role,
        isActive: body.isActive ?? user.isActive,
      }
      const others = db.users.filter((item) => item.id !== user.id)
      if (activeOwners([...others, next]) === 0) {
        return fail(409, 'LAST_OWNER', 'Duhet të mbetet të paktën një pronar aktiv.')
      }
      if (body.password !== undefined) {
        if (body.password.length < 8) return fail(422, 'PASSWORD_WEAK', 'Fjalëkalimi duhet të ketë të paktën 8 shenja.')
        db.passwords[user.id] = body.password
      }
      Object.assign(user, next)
      if (!user.isActive) {
        for (const [token, session] of Object.entries(db.sessions)) {
          if (session.userId === user.id) delete db.sessions[token]
        }
      }
      persist(db)
      return HttpResponse.json(user)
    }),
  ),

  http.get(
    '/api/reservations',
    authed('desk.use', ({ request }) => {
      const url = new URL(request.url)
      const from = url.searchParams.get('from') ?? '0000-01-01'
      const to = url.searchParams.get('to') ?? '9999-12-31'
      return HttpResponse.json(getDb().reservations.filter((item) => item.checkOut > from && item.checkIn < to))
    }),
  ),

  http.post(
    '/api/reservations',
    authed('reservations.manage', async ({ request }, actor) => {
      await delay(250)
      const body = (await request.json()) as CreateReservationInput
      const db = getDb()
      if (!DESK_SOURCES.includes(body.source)) {
        return fail(422, 'SOURCE_NOT_ALLOWED', 'Rezervimet e Booking.com vijnë vetë nga sinkronizimi.')
      }
      if (!body.guestName.trim()) return fail(422, 'GUEST_REQUIRED', 'Shkruani emrin e mysafirit.')
      if (body.checkOut <= body.checkIn) return fail(422, 'DATES_INVALID', 'Largimi duhet të jetë pas mbërritjes.')
      if (typeFreeForStay(body.roomTypeId, body.checkIn, body.checkOut, db.rooms, db.reservations) < 1) {
        return fail(409, 'NO_AVAILABILITY', 'Nuk ka dhomë të lirë për këto data.')
      }
      if (body.roomId && !roomFits(body, body.roomId)) {
        return fail(409, 'ROOM_TAKEN', 'Dhoma u rezervua sapo nga dikush tjetër. Zgjidhni një dhomë tjetër.')
      }
      const id = `r${db.seq++}`
      const nights = Math.max(1, stayNights(body))
      const reservation: Reservation = {
        id,
        code: `DH-2026-${String(db.seq).padStart(4, '0')}`,
        roomId: body.roomId ?? '',
        roomTypeId: body.roomTypeId,
        guestName: body.guestName.trim(),
        phone: body.phone?.trim() ? `${body.phonePrefix ?? ''} ${body.phone.trim()}`.trim() : '',
        email: body.email?.trim() || null,
        currency: body.currency,
        persons: body.persons,
        checkIn: body.checkIn,
        checkOut: body.checkOut,
        status: 'RESERVED',
        source: body.source,
        totalCents: body.pricePerNightCents * nights,
        paidCents: 0,
        notes: body.notes?.trim() || undefined,
        expectedArrival: body.checkIn === TODAY ? undefined : '14:00',
        history: [],
        createdAt: new Date().toISOString(),
      }
      log(reservation, actor, 'created')
      const first = body.initialPayment
      if (first && first.amountCents > 0) {
        const payment: Payment = {
          id: `p${db.paymentSeq++}`,
          reservationId: id,
          guestName: reservation.guestName,
          kind: 'payment',
          method: first.method,
          amountCents: Math.min(first.amountCents, reservation.totalCents),
          currency: reservation.currency,
          paidAt: first.paidAt,
          recordedBy: actor.name,
        }
        db.payments.push(payment)
        reservation.paidCents = payment.amountCents
        log(reservation, actor, 'payment_recorded', String(payment.amountCents))
      }
      db.reservations.push(reservation)
      publish({ type: 'reservation.created', reservation })
      return HttpResponse.json(reservation, { status: 201 })
    }),
  ),

  http.patch(
    '/api/reservations/:id',
    authed('reservations.manage', async ({ params, request }, actor) => {
      await delay(250)
      const current = find(params.id)
      if (!current) return fail(404, 'NOT_FOUND', 'Rezervimi nuk u gjet.')
      if (current.source === 'BOOKING') {
        return fail(403, 'CHANNEL_OWNED', 'Ndryshimet e këtij rezervimi bëhen në Booking.com.')
      }
      const patch = (await request.json()) as UpdateReservationInput
      const db = getDb()
      const next: Reservation = { ...current, ...patch, notes: patch.notes?.trim() || current.notes }
      if (next.checkOut <= next.checkIn) return fail(422, 'DATES_INVALID', 'Largimi duhet të jetë pas mbërritjes.')
      if (typeFreeForStay(next.roomTypeId, next.checkIn, next.checkOut, db.rooms, db.reservations, current.id) < 1) {
        return fail(409, 'NO_AVAILABILITY', 'Nuk ka dhomë të lirë për këto data.')
      }
      if (next.roomId && !roomFits(next, next.roomId, current.id)) {
        return fail(409, 'ROOM_TAKEN', 'Dhoma është e zënë për këto data.')
      }
      const datesChanged = next.checkIn !== current.checkIn || next.checkOut !== current.checkOut
      Object.assign(current, next)
      log(current, actor, datesChanged ? 'dates_changed' : 'edited')
      return updated(current)
    }),
  ),

  http.post(
    '/api/reservations/:id/assign-room',
    authed('reservations.manage', async ({ params, request }, actor) => {
      await delay(200)
      const current = find(params.id)
      if (!current) return fail(404, 'NOT_FOUND', 'Rezervimi nuk u gjet.')
      const { roomId } = (await request.json()) as { roomId?: string }
      if (!roomId) return fail(422, 'ROOM_REQUIRED', 'Zgjidhni dhomën.')
      if (!roomFits(current, roomId, current.id)) {
        return fail(409, 'ROOM_TAKEN', 'Kjo dhomë nuk është e lirë për të gjitha netët.')
      }
      const from = current.roomId
      current.roomId = roomId
      log(current, actor, 'room_assigned', from ? `${from} → ${roomId}` : roomId)
      return updated(current)
    }),
  ),

  http.post(
    '/api/reservations/:id/check-in',
    authed('reservations.manage', async ({ params }, actor) => {
      await delay(200)
      const current = find(params.id)
      if (!current) return fail(404, 'NOT_FOUND', 'Rezervimi nuk u gjet.')
      if (!current.roomId) return fail(409, 'ROOM_REQUIRED', 'Caktoni dhomën para check-in.')
      if (current.status !== 'RESERVED' || current.checkIn > TODAY) {
        return fail(409, 'INVALID_STATE', 'Check-in lejohet vetëm nga dita e mbërritjes.')
      }
      current.status = 'IN_HOUSE'
      log(current, actor, 'checked_in')
      return updated(current)
    }),
  ),

  http.post(
    '/api/reservations/:id/check-out',
    authed('reservations.manage', async ({ params }, actor) => {
      await delay(200)
      const current = find(params.id)
      if (!current) return fail(404, 'NOT_FOUND', 'Rezervimi nuk u gjet.')
      if (current.status !== 'IN_HOUSE') return fail(409, 'INVALID_STATE', 'Mysafiri nuk është në hotel.')
      current.status = 'COMPLETED'
      log(current, actor, 'checked_out')
      return updated(current)
    }),
  ),

  http.post(
    '/api/reservations/:id/no-show',
    authed('reservations.manage', async ({ params }, actor) => {
      await delay(200)
      const current = find(params.id)
      if (!current) return fail(404, 'NOT_FOUND', 'Rezervimi nuk u gjet.')
      if (current.status !== 'RESERVED' || TODAY <= current.checkIn) {
        return fail(409, 'INVALID_STATE', 'Mospërfaqësimi shënohet nga dita pas mbërritjes.')
      }
      current.status = 'NO_SHOW'
      log(current, actor, 'no_show')
      return updated(current)
    }),
  ),

  http.post(
    '/api/reservations/:id/cancel',
    authed('reservations.manage', async ({ params, request }, actor) => {
      await delay(200)
      const current = find(params.id)
      if (!current) return fail(404, 'NOT_FOUND', 'Rezervimi nuk u gjet.')
      if (current.source === 'BOOKING') {
        return fail(403, 'CHANNEL_OWNED', 'Rezervimet e Booking.com anulohen nga mysafiri ose në Booking.com.')
      }
      const { reason } = (await request.json()) as { reason?: string }
      if (!reason?.trim()) return fail(422, 'REASON_REQUIRED', 'Shkruani arsyen e anulimit.')
      current.status = 'CANCELLED'
      current.cancelReason = reason.trim()
      log(current, actor, 'cancelled', current.cancelReason)
      return updated(current)
    }),
  ),

  http.get(
    '/api/payments',
    authed('payments.record', ({ request }) => {
      const url = new URL(request.url)
      const from = url.searchParams.get('from') ?? '0000-01-01'
      const to = url.searchParams.get('to') ?? '9999-12-31'
      const method = url.searchParams.get('method')
      const list = getDb()
        .payments.filter((item) => item.paidAt >= from && item.paidAt <= to && (!method || item.method === method))
        .sort((a, b) => b.paidAt.localeCompare(a.paidAt) || b.id.localeCompare(a.id))
      return HttpResponse.json(list)
    }),
  ),

  http.post(
    '/api/reservations/:id/payments',
    authed('payments.record', async ({ params, request }, actor) => {
      await delay(200)
      const db = getDb()
      const current = find(params.id)
      if (!current) return fail(404, 'NOT_FOUND', 'Rezervimi nuk u gjet.')
      const body = (await request.json()) as RecordPaymentInput
      if (body.kind === 'refund' && !hasPermission(actor.role, 'payments.refund')) {
        return fail(403, 'FORBIDDEN', 'Rimbursimet i regjistron vetëm pronari.')
      }
      if (!PAYMENT_METHODS.includes(body.method)) return fail(422, 'METHOD_INVALID', 'Zgjidhni mënyrën e pagesës.')
      if (!Number.isFinite(body.amountCents) || body.amountCents <= 0) {
        return fail(422, 'AMOUNT_INVALID', 'Shkruani shumën që morët.')
      }
      if (body.kind === 'refund' && body.amountCents > current.paidCents) {
        return fail(422, 'REFUND_TOO_LARGE', 'Rimbursimi nuk mund të jetë më i madh se sa është paguar.')
      }
      const payment: Payment = {
        id: `p${db.paymentSeq++}`,
        reservationId: current.id,
        guestName: current.guestName,
        kind: body.kind,
        method: body.method,
        amountCents: body.amountCents,
        currency: current.currency,
        paidAt: body.paidAt || TODAY,
        recordedBy: actor.name,
      }
      db.payments.push(payment)
      current.paidCents += body.kind === 'refund' ? -body.amountCents : body.amountCents
      log(current, actor, body.kind === 'refund' ? 'refund_recorded' : 'payment_recorded', String(body.amountCents))
      return updated(current)
    }),
  ),

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
      headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' },
    })
  }),
]
