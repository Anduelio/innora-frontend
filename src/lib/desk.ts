import type { Reservation } from '@/types/domain'
import { coversDay } from '@/lib/stay'

export type DeskFilters = {
  arrivingOn?: string
  departingOn?: string
  inHouseOn?: string
}

/** Mbërritje e ditës: hyrja është ajo ditë dhe qëndrimi është ende aktiv. */
export function isArrivalOn(reservation: Reservation, day: string): boolean {
  return reservation.checkIn === day && (reservation.status === 'RESERVED' || reservation.status === 'IN_HOUSE')
}

/** Largim i ditës. Anulimet nuk dalin në listë. */
export function isDepartureOn(reservation: Reservation, day: string): boolean {
  return reservation.checkOut === day && reservation.status !== 'CANCELLED'
}

/**
 * Zë një natë në [check_in, check_out). Mëngjesi i daljes është i lirë.
 * Pa dhomë të caktuar nuk numërohet te dhomat e zëna.
 */
export function isInHouseOn(reservation: Reservation, day: string): boolean {
  return Boolean(reservation.roomId) && coversDay(reservation, day)
}

export function deskRows<T>(items: T[] | undefined, predicate: (item: T) => boolean): T[] {
  return (items ?? []).filter(predicate)
}

export function deskQuery(filters: DeskFilters): string {
  const params = new URLSearchParams({ no_pagination: '1' })
  if (filters.arrivingOn) params.set('arriving_on', filters.arrivingOn)
  if (filters.departingOn) params.set('departing_on', filters.departingOn)
  if (filters.inHouseOn) params.set('in_house_on', filters.inHouseOn)
  return `/api/reservations?${params.toString()}`
}
