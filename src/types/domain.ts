/** Vlerat ruhen në anglisht/uppercase; etiketat shqip vijnë nga i18n. */
export type ReservationStatus = 'RESERVED' | 'IN_HOUSE' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
export type ReservationSource = 'BOOKING' | 'TELEFON' | 'RECEPSION'

/** Burimet që recepsioni i shkruan vetë. Booking.com vjen vetëm nga sinkronizimi. */
export const DESK_SOURCES = ['TELEFON', 'RECEPSION'] as const
export type DeskSource = (typeof DESK_SOURCES)[number]

export const PAYMENT_METHODS = ['cash', 'card', 'bank_transfer'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]
export type PaymentKind = 'payment' | 'refund'
export type PayState = 'paid' | 'partial' | 'unpaid'
export type SyncLevel = 'pending' | 'synced' | 'problem'

export type OperationalStatus = 'ready' | 'dirty' | 'cleaning' | 'inspected' | 'maintenance' | 'out_of_order'
export type BlockKind = 'maintenance' | 'out_of_order' | 'owner_use' | 'internal_hold' | 'other'

export interface RoomBlockSpan {
  id: number
  /** Data e parë e bllokuar; endsOn nuk përfshihet. */
  startsOn: string
  endsOn: string
  type: BlockKind
  reason?: string | null
}

export interface RoomTypeInfo {
  id: number
  code: string
  name: string
  maxOccupancy: number
  basePriceCents: number
  currency: string
  sort: number
}

export interface Room {
  id: string
  roomTypeId: number
  type: string
  capacity: number
  floor?: string | null
  isActive?: boolean
  notes?: string | null
  operationalStatus?: OperationalStatus
  blocks?: RoomBlockSpan[]
}

export interface HotelSettings {
  name: string
  city: string
  currency: string
  checkInTime: string
  checkOutTime: string
  timezone: string
}

export interface AuditEntry {
  at: string
  actor: string
  action: string
  detail?: string
}

export interface Reservation {
  id: string
  code: string
  /** Bosh kur dhoma nuk është caktuar; rezervimi prapë zë një vend nga tipi. */
  roomId: string
  roomTypeId: number
  guestName: string
  phonePrefix?: string | null
  phone: string
  email?: string | null
  currency: string
  persons: number
  /** Data kalendarike ISO (YYYY-MM-DD). checkOut është dita e largimit, jo natë. */
  checkIn: string
  checkOut: string
  status: ReservationStatus
  source: ReservationSource
  totalCents: number
  paidCents: number
  notes?: string
  cancelReason?: string
  expectedArrival?: string
  externalRef?: string
  history?: AuditEntry[]
  createdAt: string
}

export interface Payment {
  id: string
  reservationId: string
  guestName: string
  kind: PaymentKind
  method: PaymentMethod
  amountCents: number
  currency: string
  /** Data kur paratë u morën vërtet, jo kur u shkrua rreshti. */
  paidAt: string
  recordedBy: string
}

export type UserRole = 'owner' | 'staff'

export interface StaffUser {
  id: number
  name: string
  email: string
  role: UserRole
  isActive: boolean
  lastLoginAt?: string | null
}

export interface CurrentUser extends StaffUser {
  permissions: string[]
}

export interface SaveUserInput {
  name?: string
  email?: string
  role?: UserRole
  isActive?: boolean
  password?: string
}

export interface ChannelMapping {
  roomTypeId: number
  externalRoomId: string | null
  externalRatePlanId: string | null
  isActive: boolean
}

export interface SyncStatus {
  level: SyncLevel
  provider: string
  connected: boolean
  lastInboundAt: string | null
  lastOutboundAt: string | null
  openIssues: SyncIssue[]
}

export interface SyncIssue {
  id: number
  type: 'conflict' | 'push_failed' | 'mapping_missing' | 'reconcile_mismatch'
  subject: string
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
  source: DeskSource
  checkIn: string
  checkOut: string
  roomTypeId: number
  roomId?: string
  persons: number
  guestName: string
  phonePrefix?: string
  phone?: string
  email?: string
  pricePerNightCents: number
  currency: string
  initialPayment?: { amountCents: number; method: PaymentMethod; paidAt: string }
  notes?: string
}

export interface UpdateReservationInput {
  checkIn?: string
  checkOut?: string
  roomTypeId?: number
  roomId?: string
  persons?: number
  guestName?: string
  phonePrefix?: string
  phone?: string
  email?: string
  totalCents?: number
  notes?: string
}

export interface RecordPaymentInput {
  kind: PaymentKind
  method: PaymentMethod
  amountCents: number
  paidAt: string
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

/** 1 = pamja e ditës (dhoma si karta), 7 = javë, 30 = muaj. */
export type CalendarView = 1 | 7 | 30
export type Density = 'komod' | 'kompakt'
