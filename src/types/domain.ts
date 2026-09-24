export type RoomType = 'Dyshe' | 'Teke' | 'Suitë' | 'Familjare'

/** Vlerat ruhen në anglisht/uppercase; etiketat shqip vijnë nga i18n. */
export type ReservationStatus = 'RESERVED' | 'IN_HOUSE' | 'COMPLETED' | 'CANCELLED'
export type ReservationSource = 'DIREKT' | 'BOOKING' | 'TELEFON' | 'WHATSAPP' | 'RECEPSION'

/** Burimet që recepsioni i shkruan vetë. Booking.com vjen vetëm nga sinkronizimi. */
export const DESK_SOURCES = ['TELEFON', 'RECEPSION', 'WHATSAPP', 'DIREKT'] as const
export type DeskSource = (typeof DESK_SOURCES)[number]

export type OperationalStatus = 'ready' | 'dirty' | 'cleaning' | 'inspected' | 'maintenance' | 'out_of_order'
export type BlockKind = 'maintenance' | 'out_of_order' | 'owner_use' | 'internal_hold' | 'other'

export interface RoomBed {
  code: string
  quantity: number
}

export interface RoomAmenity {
  code: string
  category: string
}

export interface RoomBlockSpan {
  id: number
  startsOn: string
  endsOn: string
  type: BlockKind
  reason?: string | null
}

export interface Room {
  id: string
  type: RoomType
  typeName?: string
  roomTypeId?: number
  capacity: number
  floor?: string | null
  building?: string | null
  notes?: string | null
  isActive?: boolean
  operationalStatus?: OperationalStatus
  sizeM2?: number | null
  basePriceCents?: number
  beds?: RoomBed[]
  amenities?: RoomAmenity[]
  blocks?: RoomBlockSpan[]
}

export interface HotelRoomType {
  id: number
  code: string
  name: string
  uiType: RoomType
  description?: string | null
  maxAdults: number
  maxChildren: number
  maxOccupancy: number
  basePriceCents: number
  sizeM2?: number | null
  beds: RoomBed[]
  amenities: RoomAmenity[]
}

export interface HotelSettings {
  name: string
  city: string
  currency: string
  checkInTime: string
  checkOutTime: string
}

export interface Reservation {
  id: string
  roomId: string
  roomTypeId?: number
  roomTypeName?: string
  guestName: string
  phonePrefix?: string | null
  phone: string
  currency?: string
  persons: number
  /** Data kalendarike ISO (YYYY-MM-DD). checkOut është dita e daljes, jo natë. */
  checkIn: string
  checkOut: string
  status: ReservationStatus
  source: ReservationSource
  totalCents: number
  paidCents: number
  chargesCents?: number
  balanceCents?: number
  folioId?: number
  folioNumber?: string
  folioStatus?: string
  notes?: string
  /** Ora e pritshme e mbërritjes, "14:00". Vetëm për listën e mbërritjeve. */
  expectedArrival?: string
  externalRef?: string
  createdAt: string
}

export interface Guest {
  id: string
  name: string
  phonePrefix?: string | null
  phone: string
  stays: number
  lastStay: string
}

export interface CreateReservationInput {
  roomId?: string
  roomTypeId?: number
  guestName: string
  phonePrefix?: string
  phone?: string
  registerCustomer?: boolean
  persons: number
  source?: DeskSource
  checkIn: string
  nights: number
  totalCents: number
  notes?: string
}

export interface UpdateReservationInput {
  roomId?: string
  guestName?: string
  phonePrefix?: string
  phone?: string
  registerCustomer?: boolean
  persons?: number
  checkIn?: string
  checkOut?: string
  totalCents?: number
  notes?: string
}

export type ReservationEvent =
  | { type: 'reservation.created'; reservation: Reservation }
  | { type: 'reservation.updated'; reservation: Reservation }

export interface CalendarBlock {
  reservation: Reservation
  leftPx: number
  widthPx: number
  clippedStart: boolean
  clippedEnd: boolean
  showMeta: boolean
}

export interface DaySelection {
  roomId: string
  a: number
  b: number
}

export type CalendarView = 7 | 14 | 30
export type Density = 'komod' | 'kompakt'
