import type { QueryClient } from '@tanstack/react-query'
import type { Reservation } from '@/types/domain'

type ReservationKey = readonly [string, string, string]

function entries(qc: QueryClient) {
  return qc.getQueriesData<Reservation[]>({ queryKey: ['reservations'] })
}

function inRange(reservation: Reservation, from: string, to: string): boolean {
  return reservation.checkOut > from && reservation.checkIn < to
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
    const [, from, to] = key as unknown as ReservationKey
    if (!inRange(reservation, from, to) || list.some((item) => item.id === reservation.id)) continue
    qc.setQueryData<Reservation[]>(key, [...list, reservation])
  }
}

export function upsertReservation(qc: QueryClient, reservation: Reservation): void {
  for (const [key, list] of entries(qc)) {
    if (!list) continue
    const [, from, to] = key as unknown as ReservationKey
    const rest = list.filter((item) => item.id !== reservation.id)
    qc.setQueryData<Reservation[]>(key, inRange(reservation, from, to) ? [...rest, reservation] : rest)
  }
}

export function replaceReservation(qc: QueryClient, tempId: string, reservation: Reservation): void {
  for (const [key, list] of entries(qc)) {
    if (!list) continue
    const [, from, to] = key as unknown as ReservationKey
    const rest = list.filter((item) => item.id !== tempId && item.id !== reservation.id)
    qc.setQueryData<Reservation[]>(key, inRange(reservation, from, to) ? [...rest, reservation] : rest)
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
