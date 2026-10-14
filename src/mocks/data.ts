import type {
  AuditEntry,
  ChannelMapping,
  HotelSettings,
  Payment,
  PaymentMethod,
  Reservation,
  Room,
  RoomTypeInfo,
  StaffUser,
} from '@/types/domain'
import { TODAY } from '@/lib/date/today'

export { TODAY }

export const hotel: HotelSettings = {
  name: 'Devolli Hotel',
  city: 'Korçë',
  currency: 'EUR',
  checkInTime: '14:00',
  checkOutTime: '11:00',
  timezone: 'Europe/Tirane',
}

export const roomTypes: RoomTypeInfo[] = [
  { id: 1, code: 'DBL', name: 'Dhomë dyshe', maxOccupancy: 2, basePriceCents: 6000, currency: 'EUR', sort: 1 },
  { id: 2, code: 'SGL', name: 'Dhomë teke', maxOccupancy: 1, basePriceCents: 4500, currency: 'EUR', sort: 2 },
  { id: 3, code: 'FAM', name: 'Dhomë familjare', maxOccupancy: 4, basePriceCents: 9000, currency: 'EUR', sort: 3 },
  { id: 4, code: 'STE', name: 'Suitë', maxOccupancy: 4, basePriceCents: 11000, currency: 'EUR', sort: 4 },
]

const typeName = (id: number) => roomTypes.find((type) => type.id === id)?.name ?? ''

const room = (id: string, roomTypeId: number, floor: string, extra: Partial<Room> = {}): Room => ({
  id,
  roomTypeId,
  type: typeName(roomTypeId),
  capacity: roomTypes.find((type) => type.id === roomTypeId)?.maxOccupancy ?? 2,
  floor,
  isActive: true,
  operationalStatus: 'ready',
  blocks: [],
  ...extra,
})

export const rooms: Room[] = [
  room('101', 1, '1'),
  room('102', 1, '1'),
  room('103', 1, '1'),
  room('104', 1, '1', {
    blocks: [{ id: 1, startsOn: '2026-09-26', endsOn: '2026-09-28', type: 'maintenance', reason: 'Riparim i dushit' }],
  }),
  room('106', 1, '1'),
  room('204', 1, '2'),
  room('302', 1, '3'),
  room('105', 2, '1'),
  room('203', 3, '2'),
  room('201', 4, '2'),
  room('202', 4, '2'),
  room('301', 4, '3'),
]

const roomType = (roomId: string) => rooms.find((item) => item.id === roomId)?.roomTypeId ?? 1

let seq = 101
const r = (
  id: string,
  roomId: string,
  guestName: string,
  checkIn: string,
  checkOut: string,
  persons: number,
  source: Reservation['source'],
  status: Reservation['status'],
  total: number,
  paid: number,
  phone: string,
  extra: Partial<Reservation> = {},
): Reservation => {
  const code = `DH-2026-${String(seq++).padStart(4, '0')}`
  const actor = source === 'BOOKING' ? 'system:beds24' : 'Arta Hoxha'
  const history: AuditEntry[] = [
    { at: '2026-09-01T09:00:00+02:00', actor, action: source === 'BOOKING' ? 'imported' : 'created' },
  ]
  if (status === 'IN_HOUSE' || status === 'COMPLETED') history.push({ at: `${checkIn}T14:20:00+02:00`, actor: 'Arta Hoxha', action: 'checked_in' })
  if (status === 'COMPLETED') history.push({ at: `${checkOut}T10:40:00+02:00`, actor: 'Arta Hoxha', action: 'checked_out' })
  if (status === 'CANCELLED') history.push({ at: '2026-09-15T12:00:00+02:00', actor: 'Arta Hoxha', action: 'cancelled', detail: extra.cancelReason })
  return {
    id,
    code,
    roomId,
    roomTypeId: extra.roomTypeId ?? roomType(roomId),
    guestName,
    phone,
    currency: 'EUR',
    persons,
    checkIn,
    checkOut,
    status,
    source,
    totalCents: total * 100,
    paidCents: paid * 100,
    history,
    createdAt: '2026-09-01T09:00:00+02:00',
    ...extra,
  }
}

export const reservations: Reservation[] = [
  r('r1', '101', 'Ana Kola', '2026-09-19', '2026-09-23', 2, 'TELEFON', 'IN_HOUSE', 240, 240, '+355 69 234 5566'),
  r('r2', '102', 'Endrit Lika', '2026-09-20', '2026-09-22', 1, 'TELEFON', 'IN_HOUSE', 120, 0, '+355 68 411 2200'),
  r('r3', '103', 'Arben Hoxha', '2026-09-21', '2026-09-24', 2, 'BOOKING', 'RESERVED', 180, 0, '+355 69 123 4567', {
    expectedArrival: '14:00',
    externalRef: 'BDC-4471877',
    notes: 'Kërkon krevat shtesë për fëmijë.',
  }),
  r('r4', '104', 'John Smith', '2026-09-21', '2026-09-25', 2, 'BOOKING', 'RESERVED', 280, 0, '+44 7700 900123', {
    expectedArrival: '18:30',
    externalRef: 'BDC-4471902',
  }),
  r('r5', '105', 'Arta Dervishi', '2026-09-18', '2026-09-21', 1, 'TELEFON', 'IN_HOUSE', 135, 135, '+355 67 990 1122'),
  r('r6', '203', 'Familja Krasniqi', '2026-09-19', '2026-09-21', 4, 'TELEFON', 'IN_HOUSE', 180, 140, '+383 44 556 677'),
  r('r7', '201', 'Mario Rossi', '2026-09-21', '2026-09-24', 2, 'RECEPSION', 'RESERVED', 330, 0, '+39 335 778 9911', {
    expectedArrival: '16:00',
  }),
  r('r8', '202', 'Sofia Müller', '2026-09-20', '2026-09-26', 2, 'BOOKING', 'IN_HOUSE', 660, 660, '+49 151 2233 445', {
    externalRef: 'BDC-4468110',
  }),
  r('r9', '106', 'Besnik Gashi', '2026-09-20', '2026-09-23', 2, 'RECEPSION', 'IN_HOUSE', 2100000, 700000, '+355 69 887 6543', {
    currency: 'ALL',
    totalCents: 2100000,
    paidCents: 700000,
  }),
  r('r10', '301', 'Luan Berisha', '2026-09-19', '2026-09-22', 2, 'TELEFON', 'IN_HOUSE', 330, 330, '+355 69 300 1200'),
  r('r11', '204', 'Blerta Hoxhaj', '2026-09-23', '2026-09-27', 2, 'BOOKING', 'RESERVED', 240, 0, '+355 68 220 3344', {
    externalRef: 'BDC-4472301',
  }),
  r('r12', '302', 'Petrit Shala', '2026-09-22', '2026-09-25', 2, 'TELEFON', 'RESERVED', 180, 50, '+355 69 555 7788'),
  r('r13', '105', 'Klara Meyer', '2026-09-24', '2026-09-28', 1, 'BOOKING', 'RESERVED', 180, 0, '+49 170 6677 889', {
    externalRef: 'BDC-4472455',
  }),
  r('r14', '203', 'Ilir Dema', '2026-09-26', '2026-09-29', 4, 'TELEFON', 'RESERVED', 270, 0, '+355 67 121 3131'),
  r('r15', '101', 'Anila Prifti', '2026-09-24', '2026-09-26', 2, 'TELEFON', 'RESERVED', 120, 0, '+355 69 444 9090'),
  r('r16', '102', 'Marco Bianchi', '2026-09-23', '2026-09-27', 2, 'BOOKING', 'RESERVED', 240, 0, '+39 340 111 2233', {
    externalRef: 'BDC-4472510',
  }),
  r('r17', '106', 'Genci Mema', '2026-09-25', '2026-09-30', 2, 'RECEPSION', 'RESERVED', 300, 100, '+355 69 777 1234'),
  r('r18', '301', 'Erion Çela', '2026-09-25', '2026-09-27', 2, 'TELEFON', 'CANCELLED', 220, 0, '+355 68 909 0909', {
    cancelReason: 'Ndryshoi planet e udhëtimit',
  }),
  r('r19', '204', 'Vera Sula', '2026-09-17', '2026-09-20', 2, 'TELEFON', 'COMPLETED', 180, 180, '+355 69 202 3040'),
  r('r20', '', 'Maria Bruno', '2026-09-21', '2026-09-23', 2, 'BOOKING', 'RESERVED', 120, 0, '+39 333 100 2003', {
    roomTypeId: 1,
    expectedArrival: '15:30',
    externalRef: 'BDC-4472688',
  }),
  r('r21', '302', 'Kevin Brown', '2026-09-20', '2026-09-22', 1, 'TELEFON', 'NO_SHOW', 120, 0, '+44 7911 123456'),
  r('r22', '204', 'Dritan Leka', '2026-09-14', '2026-09-17', 2, 'RECEPSION', 'COMPLETED', 180, 180, '+355 69 610 2020'),
  r('r23', '201', 'Elsa Koci', '2026-09-10', '2026-09-14', 2, 'BOOKING', 'COMPLETED', 440, 440, '+355 68 330 4455', {
    externalRef: 'BDC-4460021',
  }),
  // Qëndrime të mëparshme: klientë që janë kthyer te ne.
  r('h1', '101', 'Ana Kola', '2026-08-02', '2026-08-05', 2, 'TELEFON', 'COMPLETED', 180, 180, '+355 69 234 5566', {
    email: 'ana.kola@gmail.com',
  }),
  r('h2', '103', 'Arben Hoxha', '2026-07-28', '2026-07-31', 2, 'BOOKING', 'COMPLETED', 180, 180, '+355 69 123 4567', {
    externalRef: 'BDC-4390112',
  }),
  r('h3', '202', 'Sofia Müller', '2026-08-12', '2026-08-16', 2, 'BOOKING', 'COMPLETED', 440, 440, '+49 151 2233 445', {
    externalRef: 'BDC-4402288',
    email: 'sofia.mueller@web.de',
  }),
  r('h4', '201', 'Mario Rossi', '2026-08-20', '2026-08-23', 2, 'RECEPSION', 'COMPLETED', 330, 330, '+39 335 778 9911'),
  r('h5', '105', 'Arta Dervishi', '2026-08-05', '2026-08-08', 1, 'TELEFON', 'COMPLETED', 135, 135, '+355 67 990 1122'),
  r('h6', '105', 'Arta Dervishi', '2026-07-25', '2026-07-27', 1, 'TELEFON', 'COMPLETED', 90, 90, '+355 67 990 1122'),
  r('h7', '301', 'Luan Berisha', '2026-08-15', '2026-08-17', 2, 'TELEFON', 'COMPLETED', 220, 220, '+355 69 300 1200'),
  r('h8', '102', 'Marco Bianchi', '2026-08-09', '2026-08-12', 2, 'BOOKING', 'COMPLETED', 180, 180, '+39 340 111 2233', {
    externalRef: 'BDC-4405521',
  }),
  r('h9', '106', 'Besnik Gashi', '2026-08-18', '2026-08-20', 2, 'RECEPSION', 'COMPLETED', 1400000, 1400000, '+355 69 887 6543', {
    currency: 'ALL',
    totalCents: 1400000,
    paidCents: 1400000,
  }),
  r('h10', '204', 'Vera Sula', '2026-08-24', '2026-08-26', 2, 'TELEFON', 'COMPLETED', 120, 120, '+355 69 202 3040', {
    email: 'vera.sula@gmail.com',
  }),
  r('h11', '101', 'Ana Kola', '2026-06-14', '2026-06-17', 2, 'TELEFON', 'COMPLETED', 180, 180, '+355 69 234 5566'),
]

const methods: PaymentMethod[] = ['cash', 'card', 'bank_transfer']

export const payments: Payment[] = reservations
  .filter((item) => item.paidCents > 0)
  .map((item, index) => ({
    id: `p${index + 1}`,
    reservationId: item.id,
    guestName: item.guestName,
    kind: 'payment' as const,
    method: item.currency === 'ALL' ? 'cash' : (methods[index % methods.length] ?? 'cash'),
    amountCents: item.paidCents,
    currency: item.currency,
    paidAt: item.checkIn < TODAY ? item.checkIn : TODAY,
    recordedBy: 'Arta Hoxha',
  }))

export const users: StaffUser[] = [
  { id: 1, name: 'Ilir Devolli', email: 'ilir@devollihotel.al', role: 'owner', isActive: true, lastLoginAt: null },
  { id: 2, name: 'Arta Hoxha', email: 'arta@devollihotel.al', role: 'staff', isActive: true, lastLoginAt: null },
  { id: 3, name: 'Gentian Kola', email: 'gentian@devollihotel.al', role: 'staff', isActive: false, lastLoginAt: null },
]

/** Vetëm për llogaritë e provës; një backend i vërtetë i ruan të koduara dhe nuk i kthen kurrë. */
export const demoPasswords: Record<number, string> = {
  1: 'Pronari2026!',
  2: 'Recepsion2026!',
  3: 'Recepsion2026!',
}

export const channelMappings: ChannelMapping[] = roomTypes.map((type) => ({
  roomTypeId: type.id,
  externalRoomId: null,
  externalRatePlanId: null,
  isActive: false,
}))

export interface ChannelState {
  connected: boolean
  accountId: string | null
  lastInboundAt: string | null
  lastOutboundAt: string | null
}

export const channel: ChannelState = { connected: false, accountId: null, lastInboundAt: null, lastOutboundAt: null }
