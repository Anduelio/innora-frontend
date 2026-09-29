import type { QueryClient } from '@tanstack/react-query'
import type { Reservation } from '@/types/domain'

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

function entries(qc: QueryClient) {
  return qc.getQueriesData<Reservation[]>({ queryKey: ['reservations'] })
}

function inRange(reservation: Reservation, from: string, to: string): boolean {
  return reservation.checkOut > from && reservation.checkIn < to
}

function rangeOf(key: readonly unknown[]): { from: string; to: string } | null {
  if (key[0] !== 'reservations' || key.length !== 3) return null
  const from = key[1]
  const to = key[2]
  if (typeof from !== 'string' || typeof to !== 'string') return null
  if (!ISO_DAY.test(from) || !ISO_DAY.test(to)) return null
  return { from, to }
}

export function patchReservation(qc: QueryClient, id: string, patch: Partial<Reservation>): void {
  for (const [key, list] of entries(qc)) {
    if (!list) continue
    qc.setQueryData<Reservation[]>(
      key,
      list.map((reservation) => (reservation.id === id ? { ...reservation, ...patch } : reservation)),
    )
  }
}

export function insertReservation(qc: QueryClient, reservation: Reservation): void {
  for (const [key, list] of entries(qc)) {
    if (!list) continue
    const range = rangeOf(key)
    if (!range || !inRange(reservation, range.from, range.to) || list.some((item) => item.id === reservation.id)) {
      continue
    }
    qc.setQueryData<Reservation[]>(key, [...list, reservation])
  }
}

export function upsertReservation(qc: QueryClient, reservation: Reservation): void {
  for (const [key, list] of entries(qc)) {
    if (!list) continue
    const range = rangeOf(key)
    if (!range) {
      if (!list.some((item) => item.id === reservation.id)) continue
      qc.setQueryData<Reservation[]>(
        key,
        list.map((item) => (item.id === reservation.id ? reservation : item)),
      )
      continue
    }
    const rest = list.filter((item) => item.id !== reservation.id)
    qc.setQueryData<Reservation[]>(key, inRange(reservation, range.from, range.to) ? [...rest, reservation] : rest)
  }
}

export function replaceReservation(qc: QueryClient, tempId: string, reservation: Reservation): void {
  for (const [key, list] of entries(qc)) {
    if (!list) continue
    const range = rangeOf(key)
    if (!range) continue
    const rest = list.filter((item) => item.id !== tempId && item.id !== reservation.id)
    qc.setQueryData<Reservation[]>(key, inRange(reservation, range.from, range.to) ? [...rest, reservation] : rest)
  }
}

export function snapshotReservations(qc: QueryClient) {
  return qc.getQueriesData<Reservation[]>({ queryKey: ['reservations'] })
}

export function restoreReservations(
  qc: QueryClient,
  prev: ReturnType<typeof snapshotReservations>,
): void {
  for (const [key, data] of prev) qc.setQueryData(key, data)
}
