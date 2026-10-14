import type { PayState, Reservation } from '@/types/domain'
import { dayIndex } from '@/lib/date/calendar'

export type ReservationAction =
  | 'assign_room'
  | 'check_in'
  | 'check_out'
  | 'no_show'
  | 'cancel'
  | 'edit'
  | 'record_payment'

export function balanceCents(reservation: Reservation): number {
  return reservation.totalCents - reservation.paidCents
}

export function payState(reservation: Reservation): PayState {
  if (reservation.totalCents > 0 && balanceCents(reservation) <= 0) return 'paid'
  if (reservation.paidCents > 0) return 'partial'
  return 'unpaid'
}

export function stayNights(reservation: Pick<Reservation, 'checkIn' | 'checkOut'>): number {
  return Math.max(0, dayIndex(reservation.checkIn, reservation.checkOut))
}

export function isActiveStay(reservation: Reservation): boolean {
  return reservation.status === 'RESERVED' || reservation.status === 'IN_HOUSE'
}

/** Rregullat e veprimeve; Booking.com mban datat, çmimin dhe anulimin. */
export function allowedActions(reservation: Reservation, today: string): ReservationAction[] {
  const actions: ReservationAction[] = []
  const local = reservation.source !== 'BOOKING'
  if (reservation.status === 'RESERVED') {
    actions.push('assign_room')
    if (reservation.checkIn <= today && reservation.roomId) actions.push('check_in')
    if (today > reservation.checkIn) actions.push('no_show')
    if (local) actions.push('edit', 'cancel')
  }
  if (reservation.status === 'IN_HOUSE') {
    actions.push('assign_room', 'check_out')
    if (local) actions.push('edit')
  }
  if (reservation.status !== 'CANCELLED') actions.push('record_payment')
  return actions
}

/** Kërkim i lirë: emër, kod, dhomë, numër Booking.com ose të paktën 3 shifra telefoni. */
export function matchReservation(item: Reservation, query: string): boolean {
  const needle = query.trim().toLocaleLowerCase('sq')
  if (!needle) return true
  const digits = needle.replace(/\D/g, '')
  return (
    item.guestName.toLocaleLowerCase('sq').includes(needle) ||
    item.code.toLocaleLowerCase('sq').includes(needle) ||
    (item.roomId !== '' && item.roomId === needle) ||
    (item.externalRef ?? '').toLocaleLowerCase('sq').includes(needle) ||
    (digits.length >= 3 && item.phone.replace(/\D/g, '').includes(digits))
  )
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : ''
  return `${first}${last}`.toLocaleUpperCase('sq')
}
