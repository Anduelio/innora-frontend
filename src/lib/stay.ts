import type { Reservation } from '@/types/domain'
import { dayIndex } from '@/lib/date/calendar'

export function blocksRoom(reservation: Reservation): boolean {
  return reservation.status !== 'CANCELLED'
}

export function coversDay(reservation: Reservation, day: string): boolean {
  return blocksRoom(reservation) && reservation.checkIn <= day && reservation.checkOut > day
}

export function maxFreeNights(
  reservations: Reservation[],
  roomId: string,
  checkIn: string,
  ignoreId?: string,
): number {
  let max = 30
  for (const reservation of reservations) {
    if (reservation.id === ignoreId || reservation.roomId !== roomId || !blocksRoom(reservation)) {
      continue
    }
    if (reservation.checkIn <= checkIn && reservation.checkOut > checkIn) return 0
    if (reservation.checkIn > checkIn) {
      max = Math.min(max, dayIndex(checkIn, reservation.checkIn))
    }
  }
  return Math.max(0, max)
}
