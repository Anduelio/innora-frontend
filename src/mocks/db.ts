import type {
  ChannelMapping,
  Contact,
  HotelSettings,
  Payment,
  Reservation,
  ReservationEvent,
  Room,
  RoomTypeInfo,
  StaffUser,
} from '@/types/domain'
import {
  channel,
  channelMappings,
  demoPasswords,
  hotel,
  payments,
  reservations,
  roomTypes,
  rooms,
  users,
  type ChannelState,
} from '@/mocks/data'

export interface Session {
  userId: number
  lastSeenAt: number
}

export interface Database {
  hotel: HotelSettings
  channel: ChannelState
  mappings: ChannelMapping[]
  blockSeq: number
  roomTypeSeq: number
  rooms: Room[]
  roomTypes: RoomTypeInfo[]
  reservations: Reservation[]
  contacts: Contact[]
  contactSeq: number
  payments: Payment[]
  users: StaffUser[]
  passwords: Record<number, string>
  sessions: Record<string, Session>
  seq: number
  paymentSeq: number
  userSeq: number
}

/** Ndryshoni versionin kur ndryshon forma e të dhënave të provës, që të mos lexohen të vjetrat. */
const STORAGE_KEY = 'devolli:mock-db:v5'
const globalDb = globalThis as typeof globalThis & { __devolliDb?: Database }

export function seed(): Database {
  return {
    hotel: structuredClone(hotel),
    channel: structuredClone(channel),
    mappings: structuredClone(channelMappings),
    blockSeq: 100,
    roomTypeSeq: roomTypes.length + 1,
    rooms: structuredClone(rooms),
    roomTypes: structuredClone(roomTypes),
    reservations: structuredClone(reservations),
    contacts: [],
    contactSeq: 1,
    payments: structuredClone(payments),
    users: structuredClone(users),
    passwords: { ...demoPasswords },
    sessions: {},
    seq: 200,
    paymentSeq: payments.length + 1,
    userSeq: users.length + 1,
  }
}

function load(): Database {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw) as Database
      return { ...saved, contacts: saved.contacts ?? [], contactSeq: saved.contactSeq ?? 1 }
    }
  } catch {
    // ruajtja lokale mund të mungojë (teste, modalitet privat)
  }
  return seed()
}

export function persist(db: Database): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // vazhdo vetëm në memorie
  }
}

export function getDb(): Database {
  globalDb.__devolliDb ??= load()
  return globalDb.__devolliDb
}

export function resetDb(): void {
  const sessions = globalDb.__devolliDb?.sessions ?? {}
  globalDb.__devolliDb = { ...seed(), sessions }
  persist(globalDb.__devolliDb)
}

type Listener = (event: ReservationEvent) => void
const listeners = new Set<Listener>()

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function publish(event: ReservationEvent): void {
  persist(getDb())
  for (const listener of listeners) listener(event)
}
