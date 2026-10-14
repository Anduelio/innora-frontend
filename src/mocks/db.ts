import type { Guest, Payment, Reservation, ReservationEvent, Room, RoomTypeInfo, StaffUser } from '@/types/domain'
import { demoPasswords, payments, reservations, roomTypes, rooms, users } from '@/mocks/data'

export interface Session {
  userId: number
  lastSeenAt: number
}

export interface Database {
  rooms: Room[]
  roomTypes: RoomTypeInfo[]
  reservations: Reservation[]
  payments: Payment[]
  users: StaffUser[]
  passwords: Record<number, string>
  sessions: Record<string, Session>
  seq: number
  paymentSeq: number
  userSeq: number
}

/** Ndryshoni versionin kur ndryshon forma e të dhënave të provës, që të mos lexohen të vjetrat. */
const STORAGE_KEY = 'devolli:mock-db:v4'
const globalDb = globalThis as typeof globalThis & { __devolliDb?: Database }

export function seed(): Database {
  return {
    rooms: structuredClone(rooms),
    roomTypes: structuredClone(roomTypes),
    reservations: structuredClone(reservations),
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
    if (raw) return JSON.parse(raw) as Database
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

export function toGuests(list: Reservation[]): Guest[] {
  const sorted = [...list].sort((a, b) => b.checkIn.localeCompare(a.checkIn))
  const map = new Map<string, Guest>()
  for (const reservation of sorted) {
    const existing = map.get(reservation.guestName)
    if (existing) {
      existing.stays += 1
      continue
    }
    map.set(reservation.guestName, {
      id: reservation.guestName,
      name: reservation.guestName,
      phonePrefix: reservation.phonePrefix,
      phone: reservation.phone,
      stays: 1,
      lastStay: reservation.checkIn,
    })
  }
  return [...map.values()]
}
