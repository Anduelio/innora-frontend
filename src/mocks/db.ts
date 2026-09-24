import type { Guest, Reservation, ReservationEvent, Room } from '@/types/domain'
import { reservations, rooms } from '@/mocks/data'

export interface Database {
  rooms: Room[]
  reservations: Reservation[]
  seq: number
}

const globalDb = globalThis as typeof globalThis & { __recepsionDb?: Database }

export function seed(): Database {
  return {
    rooms: structuredClone(rooms),
    reservations: structuredClone(reservations),
    seq: 100,
  }
}

export function getDb(): Database {
  globalDb.__recepsionDb ??= seed()
  return globalDb.__recepsionDb
}

export function resetDb(): void {
  globalDb.__recepsionDb = seed()
}

type Listener = (event: ReservationEvent) => void
const listeners = new Set<Listener>()

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function publish(event: ReservationEvent): void {
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
