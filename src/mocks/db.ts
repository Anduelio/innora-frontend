import type { Guest, Reservation, ReservationEvent, Room } from '@/types/domain'
import { reservations, rooms } from '@/mocks/data'

export interface Database {
  rooms: Room[]
  reservations: Reservation[]
  directory: Guest[]
  seq: number
  guestSeq: number
}

const globalDb = globalThis as typeof globalThis & { __recepsionDb?: Database }

export function seed(): Database {
  return {
    rooms: structuredClone(rooms),
    reservations: structuredClone(reservations),
    directory: [
      {
        id: 'g-drita',
        name: 'Drita Leka',
        phonePrefix: '+355',
        phone: '',
        stays: 0,
        lastStay: null,
      },
    ],
    seq: 100,
    guestSeq: 2,
  }
}

export function getDb(): Database {
  globalDb.__recepsionDb ??= seed()
  globalDb.__recepsionDb.directory ??= []
  globalDb.__recepsionDb.guestSeq ??= 1
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

function byRecent(a: Guest, b: Guest): number {
  if (a.lastStay && b.lastStay) return b.lastStay.localeCompare(a.lastStay) || a.name.localeCompare(b.name, 'sq')
  if (a.lastStay) return -1
  if (b.lastStay) return 1
  return a.name.localeCompare(b.name, 'sq')
}

export function listGuests(): Guest[] {
  const db = getDb()
  const map = new Map<string, Guest>()
  for (const guest of toGuests(db.reservations)) map.set(guest.id, guest)
  for (const guest of db.directory) {
    const current = map.get(guest.id)
    if (current) {
      map.set(guest.id, {
        ...current,
        name: guest.name,
        phonePrefix: guest.phonePrefix,
        phone: guest.phone,
      })
    } else {
      map.set(guest.id, guest)
    }
  }
  return [...map.values()].sort(byRecent)
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
