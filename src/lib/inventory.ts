import type { Reservation, Room } from '@/types/domain'
import { addDaysIso, dayIndex } from '@/lib/date/calendar'

/** Nata `day` zihet nga rezervimi. Mospërfaqësimi mban vetëm natën e parë. */
export function occupiesNight(reservation: Reservation, day: string): boolean {
  if (reservation.status === 'CANCELLED') return false
  if (reservation.status === 'NO_SHOW') return day === reservation.checkIn
  return reservation.checkIn <= day && reservation.checkOut > day
}

export function nightsOf(checkIn: string, checkOut: string): string[] {
  const count = Math.max(0, dayIndex(checkIn, checkOut))
  return Array.from({ length: count }, (_, index) => addDaysIso(checkIn, index))
}

export function roomBlockedOn(room: Room, day: string): boolean {
  if (room.isActive === false) return true
  return (room.blocks ?? []).some((block) => block.startsOn <= day && block.endsOn > day)
}

export function roomTakenOn(roomId: string, day: string, reservations: Reservation[], ignoreId?: string): boolean {
  return reservations.some(
    (item) => item.id !== ignoreId && item.roomId === roomId && occupiesNight(item, day),
  )
}

/** Sa njësi të tipit mbeten për natën: dhoma aktive − të bllokuara − rezervime (me ose pa dhomë). */
export function typeFreeOn(
  roomTypeId: number,
  day: string,
  rooms: Room[],
  reservations: Reservation[],
  ignoreId?: string,
): number {
  const ofType = rooms.filter((room) => room.roomTypeId === roomTypeId)
  const open = ofType.filter((room) => !roomBlockedOn(room, day)).length
  const sold = reservations.filter(
    (item) => item.id !== ignoreId && item.roomTypeId === roomTypeId && occupiesNight(item, day),
  ).length
  return open - sold
}

export function typeFreeForStay(
  roomTypeId: number,
  checkIn: string,
  checkOut: string,
  rooms: Room[],
  reservations: Reservation[],
  ignoreId?: string,
): number {
  const nights = nightsOf(checkIn, checkOut)
  if (nights.length === 0) return 0
  return Math.min(...nights.map((day) => typeFreeOn(roomTypeId, day, rooms, reservations, ignoreId)))
}

/** Dhomat fizike të lira për çdo natë të qëndrimit. */
export function freeRoomsForStay(
  checkIn: string,
  checkOut: string,
  rooms: Room[],
  reservations: Reservation[],
  options: { roomTypeId?: number; ignoreId?: string } = {},
): Room[] {
  const nights = nightsOf(checkIn, checkOut)
  if (nights.length === 0) return []
  return rooms.filter(
    (room) =>
      (options.roomTypeId === undefined || room.roomTypeId === options.roomTypeId) &&
      nights.every(
        (day) => !roomBlockedOn(room, day) && !roomTakenOn(room.id, day, reservations, options.ignoreId),
      ),
  )
}

/** Sa netë radhazi është e lirë dhoma duke filluar nga `checkIn` (deri 30). */
export function maxFreeNights(
  reservations: Reservation[],
  room: Room | undefined,
  checkIn: string,
  ignoreId?: string,
): number {
  if (!room) return 0
  let count = 0
  while (count < 30) {
    const day = addDaysIso(checkIn, count)
    if (roomBlockedOn(room, day) || roomTakenOn(room.id, day, reservations, ignoreId)) break
    count += 1
  }
  return count
}
