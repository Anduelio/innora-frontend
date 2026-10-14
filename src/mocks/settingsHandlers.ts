import { http, HttpResponse } from 'msw'
import type {
  AddBlockInput,
  ChannelMapping,
  Contact,
  Room,
  RoomTypeInfo,
  SaveContactInput,
  SaveHotelInput,
  SaveMappingInput,
  SaveRoomInput,
  SaveRoomTypeInput,
  SyncIssue,
  SyncStatus,
} from '@/types/domain'
import { TODAY } from '@/lib/date/today'
import { buildCustomers, contactKey, customerKey } from '@/lib/customers'
import { occupiesNight, nightsOf } from '@/lib/inventory'
import { authed, fail } from '@/mocks/auth'
import { getDb, persist, resetDb } from '@/mocks/db'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/
const CURRENCIES = ['EUR', 'ALL']
const BLOCK_KINDS = ['maintenance', 'out_of_order', 'owner_use', 'internal_hold', 'other']

function nowAtHotel(): string {
  const time = new Date().toLocaleTimeString('sv-SE', { timeZone: 'Europe/Tirane' })
  return `${TODAY}T${time}+02:00`
}


function customerList() {
  const db = getDb()
  return buildCustomers(db.reservations, TODAY, db.contacts)
}

function cleanContact(input: SaveContactInput) {
  return {
    name: (input.name ?? '').trim(),
    phone: (input.phone ?? '').trim(),
    email: input.email?.trim() ? input.email.trim() : null,
    notes: input.notes?.trim() ? input.notes.trim() : null,
  }
}

function contactProblem(input: SaveContactInput): string | null {
  const { name, phone, email } = cleanContact(input)
  if (!name) return 'Shkruani emrin e klientit.'
  if (!phone && !email) return 'Shkruani telefonin ose emailin.'
  if (phone && phone.replace(/\D/g, '').length < 7) return 'Shkruani një numër telefoni të saktë.'
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Shkruani një email të saktë.'
  return null
}

export function isMapped(mapping: ChannelMapping | undefined): boolean {
  return Boolean(mapping?.externalRoomId && mapping.externalRatePlanId)
}

function syncStatus(): SyncStatus {
  const db = getDb()
  const provider = 'Beds24'
  if (!db.channel.connected) {
    return {
      level: 'problem',
      provider,
      connected: false,
      lastInboundAt: null,
      lastOutboundAt: null,
      openIssues: [{ id: 1, type: 'mapping_missing', subject: 'Booking.com nuk është lidhur ende' }],
    }
  }
  const openIssues: SyncIssue[] = db.roomTypes
    .filter((type) => !isMapped(db.mappings.find((mapping) => mapping.roomTypeId === type.id)))
    .map((type) => ({ id: type.id, type: 'mapping_missing' as const, subject: type.name }))
  const synced = db.channel.lastInboundAt !== null && db.channel.lastOutboundAt !== null
  return {
    level: openIssues.length > 0 ? 'problem' : synced ? 'synced' : 'pending',
    provider,
    connected: true,
    accountId: db.channel.accountId,
    lastInboundAt: db.channel.lastInboundAt,
    lastOutboundAt: db.channel.lastOutboundAt,
    openIssues,
  }
}

function roomTypeError(
  body: SaveRoomTypeInput,
  others: RoomTypeInfo[],
  partial: boolean,
): { code: string; message: string } | null {
  if (!partial || body.name !== undefined) {
    if (!body.name?.trim()) return { code: 'NAME_REQUIRED', message: 'Shkruani emrin e tipit.' }
  }
  if (!partial || body.code !== undefined) {
    const code = body.code?.trim().toUpperCase() ?? ''
    if (!/^[A-Z]{2,4}$/.test(code)) return { code: 'CODE_INVALID', message: 'Kodi ka 2 deri 4 shkronja, p.sh. DBL.' }
    if (others.some((type) => type.code === code)) return { code: 'CODE_TAKEN', message: 'Ky kod përdoret nga një tip tjetër.' }
  }
  if (body.maxOccupancy !== undefined && (!Number.isInteger(body.maxOccupancy) || body.maxOccupancy < 1 || body.maxOccupancy > 10)) {
    return { code: 'OCCUPANCY_INVALID', message: 'Kapaciteti duhet të jetë nga 1 deri 10 persona.' }
  }
  if (body.basePriceCents !== undefined && (!Number.isFinite(body.basePriceCents) || body.basePriceCents <= 0)) {
    return { code: 'PRICE_INVALID', message: 'Çmimi bazë duhet të jetë më i madh se zero.' }
  }
  return null
}

export const settingsHandlers = [
  http.get('/api/settings/hotel', authed('desk.use', () => HttpResponse.json(getDb().hotel))),

  http.patch(
    '/api/settings/hotel',
    authed('settings.manage', async ({ request }) => {
      await delay(250)
      const body = (await request.json()) as SaveHotelInput
      const db = getDb()
      if (body.name !== undefined && !body.name.trim()) return fail(422, 'NAME_REQUIRED', 'Shkruani emrin e hotelit.')
      if (body.city !== undefined && !body.city.trim()) return fail(422, 'CITY_REQUIRED', 'Shkruani qytetin.')
      if (body.currency !== undefined && !CURRENCIES.includes(body.currency)) {
        return fail(422, 'CURRENCY_INVALID', 'Monedha nuk njihet.')
      }
      for (const time of [body.checkInTime, body.checkOutTime]) {
        if (time !== undefined && !TIME.test(time)) return fail(422, 'TIME_INVALID', 'Ora duhet të jetë si 14:00.')
      }
      db.hotel = {
        ...db.hotel,
        name: body.name?.trim() ?? db.hotel.name,
        city: body.city?.trim() ?? db.hotel.city,
        currency: body.currency ?? db.hotel.currency,
        checkInTime: body.checkInTime ?? db.hotel.checkInTime,
        checkOutTime: body.checkOutTime ?? db.hotel.checkOutTime,
      }
      persist(db)
      return HttpResponse.json(db.hotel)
    }),
  ),

  http.get('/api/rooms', authed('desk.use', () => HttpResponse.json(getDb().rooms))),
  http.get('/api/room-types', authed('desk.use', () => HttpResponse.json(getDb().roomTypes))),

  http.post(
    '/api/room-types',
    authed('settings.manage', async ({ request }) => {
      await delay(250)
      const body = (await request.json()) as SaveRoomTypeInput
      const db = getDb()
      const problem = roomTypeError(body, db.roomTypes, false)
      if (problem) return fail(422, problem.code, problem.message)
      const type: RoomTypeInfo = {
        id: db.roomTypeSeq++,
        code: (body.code ?? '').trim().toUpperCase(),
        name: (body.name ?? '').trim(),
        maxOccupancy: body.maxOccupancy ?? 2,
        basePriceCents: body.basePriceCents ?? 5000,
        currency: db.hotel.currency,
        sort: db.roomTypes.length + 1,
      }
      db.roomTypes.push(type)
      db.mappings.push({ roomTypeId: type.id, externalRoomId: null, externalRatePlanId: null, isActive: false })
      persist(db)
      return HttpResponse.json(type, { status: 201 })
    }),
  ),

  http.patch(
    '/api/room-types/:id',
    authed('settings.manage', async ({ params, request }) => {
      await delay(250)
      const db = getDb()
      const type = db.roomTypes.find((item) => item.id === Number(params.id))
      if (!type) return fail(404, 'NOT_FOUND', 'Tipi nuk u gjet.')
      const body = (await request.json()) as SaveRoomTypeInput
      const problem = roomTypeError(body, db.roomTypes.filter((item) => item.id !== type.id), true)
      if (problem) return fail(422, problem.code, problem.message)
      if (body.maxOccupancy !== undefined && body.maxOccupancy < type.maxOccupancy) {
        const tooMany = db.reservations.find(
          (item) =>
            item.roomTypeId === type.id &&
            (item.status === 'RESERVED' || item.status === 'IN_HOUSE') &&
            item.checkOut > TODAY &&
            item.persons > (body.maxOccupancy ?? 0),
        )
        if (tooMany) {
          return fail(409, 'OCCUPANCY_IN_USE', `${tooMany.guestName} ka ${tooMany.persons} persona; kapaciteti nuk mund të jetë më i vogël.`)
        }
      }
      if (body.name !== undefined) type.name = body.name.trim()
      if (body.code !== undefined) type.code = body.code.trim().toUpperCase()
      if (body.maxOccupancy !== undefined) type.maxOccupancy = body.maxOccupancy
      if (body.basePriceCents !== undefined) type.basePriceCents = body.basePriceCents
      for (const room of db.rooms) {
        if (room.roomTypeId !== type.id) continue
        room.type = type.name
        room.capacity = type.maxOccupancy
      }
      persist(db)
      return HttpResponse.json(type)
    }),
  ),

  http.post(
    '/api/rooms',
    authed('settings.manage', async ({ request }) => {
      await delay(250)
      const body = (await request.json()) as SaveRoomInput
      const db = getDb()
      const id = body.id?.trim() ?? ''
      if (!/^[A-Za-z0-9-]{1,6}$/.test(id)) return fail(422, 'ROOM_ID_INVALID', 'Numri i dhomës ka deri 6 shkronja ose shifra.')
      if (db.rooms.some((room) => room.id.toLowerCase() === id.toLowerCase())) {
        return fail(409, 'ROOM_EXISTS', 'Ekziston një dhomë me këtë numër.')
      }
      const type = db.roomTypes.find((item) => item.id === body.roomTypeId)
      if (!type) return fail(422, 'TYPE_REQUIRED', 'Zgjidhni tipin e dhomës.')
      const room: Room = {
        id,
        roomTypeId: type.id,
        type: type.name,
        capacity: type.maxOccupancy,
        floor: body.floor?.trim() || null,
        notes: body.notes?.trim() || null,
        isActive: true,
        operationalStatus: 'ready',
        blocks: [],
      }
      db.rooms.push(room)
      db.rooms.sort((a, b) => a.id.localeCompare(b.id, 'sq', { numeric: true }))
      persist(db)
      return HttpResponse.json(room, { status: 201 })
    }),
  ),

  http.patch(
    '/api/rooms/:id',
    authed('settings.manage', async ({ params, request }) => {
      await delay(200)
      const db = getDb()
      const room = db.rooms.find((item) => item.id === params.id)
      if (!room) return fail(404, 'NOT_FOUND', 'Dhoma nuk u gjet.')
      const body = (await request.json()) as SaveRoomInput
      if (body.isActive === false && room.isActive !== false) {
        const using = db.reservations.find(
          (item) =>
            item.roomId === room.id && (item.status === 'RESERVED' || item.status === 'IN_HOUSE') && item.checkOut > TODAY,
        )
        if (using) {
          return fail(409, 'ROOM_IN_USE', `Dhoma ${room.id} ka rezervim aktiv (${using.guestName}). Zhvendoseni rezervimin para se ta çaktivizoni.`)
        }
      }
      if (body.roomTypeId !== undefined && body.roomTypeId !== room.roomTypeId) {
        const type = db.roomTypes.find((item) => item.id === body.roomTypeId)
        if (!type) return fail(422, 'TYPE_REQUIRED', 'Zgjidhni tipin e dhomës.')
        const using = db.reservations.find(
          (item) => item.roomId === room.id && (item.status === 'RESERVED' || item.status === 'IN_HOUSE') && item.checkOut > TODAY,
        )
        if (using) return fail(409, 'ROOM_IN_USE', `Dhoma ${room.id} ka rezervim aktiv (${using.guestName}); tipi nuk ndryshohet tani.`)
        room.roomTypeId = type.id
        room.type = type.name
        room.capacity = type.maxOccupancy
      }
      if (body.floor !== undefined) room.floor = body.floor.trim() || null
      if (body.notes !== undefined) room.notes = body.notes.trim() || null
      if (body.isActive !== undefined) room.isActive = body.isActive
      persist(db)
      return HttpResponse.json(room)
    }),
  ),

  http.post(
    '/api/rooms/:id/blocks',
    authed('settings.manage', async ({ params, request }) => {
      await delay(250)
      const db = getDb()
      const room = db.rooms.find((item) => item.id === params.id)
      if (!room) return fail(404, 'NOT_FOUND', 'Dhoma nuk u gjet.')
      const body = (await request.json()) as AddBlockInput
      if (!BLOCK_KINDS.includes(body.type)) return fail(422, 'KIND_INVALID', 'Zgjidhni arsyen e bllokimit.')
      if (!body.startsOn || !body.endsOn || body.endsOn <= body.startsOn) {
        return fail(422, 'DATES_INVALID', 'Data e fundit duhet të jetë pas datës së fillimit.')
      }
      const nights = nightsOf(body.startsOn, body.endsOn)
      const clash = db.reservations.find(
        (item) => item.roomId === room.id && nights.some((day) => occupiesNight(item, day)),
      )
      if (clash) {
        return fail(409, 'BLOCK_CONFLICT', `Dhoma ${room.id} ka rezervimin e ${clash.guestName} në këto data. Zhvendoseni ose anulojeni më parë.`)
      }
      room.blocks = [
        ...(room.blocks ?? []),
        { id: db.blockSeq++, startsOn: body.startsOn, endsOn: body.endsOn, type: body.type, reason: body.reason?.trim() || null },
      ]
      persist(db)
      return HttpResponse.json(room, { status: 201 })
    }),
  ),

  http.delete(
    '/api/rooms/:id/blocks/:blockId',
    authed('settings.manage', async ({ params }) => {
      await delay(200)
      const db = getDb()
      const room = db.rooms.find((item) => item.id === params.id)
      if (!room) return fail(404, 'NOT_FOUND', 'Dhoma nuk u gjet.')
      room.blocks = (room.blocks ?? []).filter((block) => block.id !== Number(params.blockId))
      persist(db)
      return HttpResponse.json(room)
    }),
  ),

  http.get('/api/settings/channel-mappings', authed('channel.manage', () => HttpResponse.json(getDb().mappings))),

  http.put(
    '/api/settings/channel-mappings/:roomTypeId',
    authed('channel.manage', async ({ params, request }) => {
      await delay(200)
      const db = getDb()
      const mapping = db.mappings.find((item) => item.roomTypeId === Number(params.roomTypeId))
      if (!mapping) return fail(404, 'NOT_FOUND', 'Tipi nuk u gjet.')
      const body = (await request.json()) as SaveMappingInput
      mapping.externalRoomId = body.externalRoomId || null
      mapping.externalRatePlanId = body.externalRatePlanId || null
      mapping.isActive = isMapped(mapping)
      persist(db)
      return HttpResponse.json(mapping)
    }),
  ),

  http.get('/api/sync/status', authed('desk.use', () => HttpResponse.json(syncStatus()))),

  http.post(
    '/api/settings/channel/connect',
    authed('channel.manage', async ({ request }) => {
      await delay(900)
      const { accountId } = (await request.json()) as { accountId?: string }
      if (!accountId?.trim() || accountId.trim().length < 4) {
        return fail(422, 'ACCOUNT_INVALID', 'Shkruani numrin e llogarisë (të paktën 4 shenja).')
      }
      const db = getDb()
      db.channel = { connected: true, accountId: accountId.trim(), lastInboundAt: null, lastOutboundAt: null }
      persist(db)
      return HttpResponse.json(syncStatus())
    }),
  ),

  http.post(
    '/api/settings/channel/disconnect',
    authed('channel.manage', async () => {
      await delay(300)
      const db = getDb()
      db.channel = { connected: false, accountId: null, lastInboundAt: null, lastOutboundAt: null }
      persist(db)
      return HttpResponse.json(syncStatus())
    }),
  ),

  http.post(
    '/api/sync/run',
    authed('channel.manage', async () => {
      await delay(1100)
      const db = getDb()
      if (!db.channel.connected) return fail(409, 'NOT_CONNECTED', 'Lidhni fillimisht Booking.com.')
      if (syncStatus().openIssues.length > 0) {
        return fail(409, 'MAPPING_MISSING', 'Lidhni çdo tip dhome me Booking.com para sinkronizimit.')
      }
      const at = nowAtHotel()
      db.channel.lastInboundAt = at
      db.channel.lastOutboundAt = at
      persist(db)
      return HttpResponse.json(syncStatus())
    }),
  ),

  http.get(
    '/api/customers',
    authed('desk.use', () => HttpResponse.json(customerList())),
  ),

  http.post(
    '/api/customers',
    authed('reservations.manage', async ({ request }) => {
      await delay(250)
      const input = (await request.json()) as SaveContactInput
      const problem = contactProblem(input)
      if (problem) return fail(422, 'CONTACT_INVALID', problem)
      const db = getDb()
      const draft = cleanContact(input)
      const existing = customerList().find((item) => item.id === contactKey(draft))
      if (existing) {
        return fail(409, 'CUSTOMER_EXISTS', `Ky klient është tashmë në listë: ${existing.name}.`)
      }
      const contact: Contact = {
        id: `c${db.contactSeq}`,
        ...draft,
        createdAt: nowAtHotel(),
      }
      db.contactSeq += 1
      db.contacts.push(contact)
      persist(db)
      return HttpResponse.json(customerList().find((item) => item.contactId === contact.id), { status: 201 })
    }),
  ),

  http.patch(
    '/api/customers/contacts/:id',
    authed('reservations.manage', async ({ request, params }) => {
      await delay(250)
      const db = getDb()
      const contact = db.contacts.find((item) => item.id === params.id)
      if (!contact) return fail(404, 'NOT_FOUND', 'Klienti nuk u gjet.')
      const input = (await request.json()) as SaveContactInput
      const problem = contactProblem(input)
      if (problem) return fail(422, 'CONTACT_INVALID', problem)
      const draft = cleanContact(input)
      const clash = customerList().find((item) => item.id === contactKey(draft) && item.contactId !== contact.id)
      if (clash) return fail(409, 'CUSTOMER_EXISTS', `Ky klient është tashmë në listë: ${clash.name}.`)
      Object.assign(contact, draft)
      persist(db)
      return HttpResponse.json(customerList().find((item) => item.contactId === contact.id))
    }),
  ),

  http.delete(
    '/api/customers/contacts/:id',
    authed('reservations.manage', async ({ params }) => {
      await delay(250)
      const db = getDb()
      const contact = db.contacts.find((item) => item.id === params.id)
      if (!contact) return fail(404, 'NOT_FOUND', 'Klienti nuk u gjet.')
      const key = contactKey(contact)
      if (db.reservations.some((item) => customerKey(item) === key)) {
        return fail(409, 'HAS_RESERVATIONS', 'Klienti ka rezervime dhe nuk fshihet.')
      }
      db.contacts = db.contacts.filter((item) => item.id !== contact.id)
      persist(db)
      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.post('/api/__reset', () => {
    resetDb()
    return new HttpResponse(null, { status: 204 })
  }),

  http.post(
    '/api/settings/demo/reset',
    authed('settings.manage', async () => {
      await delay(400)
      resetDb()
      return new HttpResponse(null, { status: 204 })
    }),
  ),
]
