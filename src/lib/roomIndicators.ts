import type { Reservation, Room, RoomBlockSpan } from '@/types/domain'
import { TODAY } from '@/lib/date/today'
import { blocksRoom, coversDay } from '@/lib/stay'

export type StayIndicator = 'free' | 'occupied' | 'arriving' | 'departing' | 'blocked'

function blockCoversDay(block: RoomBlockSpan, day: string): boolean {
  return block.startsOn <= day && block.endsOn > day
}

export function stayIndicator(room: Room, reservations: Reservation[], day = TODAY): StayIndicator {
  const blocked = (room.blocks ?? []).some((block) => blockCoversDay(block, day))
  if (blocked) return 'blocked'

  const covering = reservations.filter((item) => item.roomId === room.id && coversDay(item, day))
  const inHouse = covering.find((item) => item.status === 'IN_HOUSE')
  if (inHouse && inHouse.checkOut === day) return 'departing'
  if (inHouse) return 'occupied'

  const arriving = covering.find((item) => item.status === 'RESERVED' && item.checkIn === day)
  if (arriving) return 'arriving'

  if (covering.length > 0) return 'occupied'
  return 'free'
}

export function roomIsOccupiedToday(room: Room, reservations: Reservation[], day = TODAY): boolean {
  return reservations.some(
    (item) => item.roomId === room.id && coversDay(item, day) && item.status === 'IN_HOUSE',
  )
}

export function roomHasCurrentOrFutureStay(room: Room, reservations: Reservation[], day = TODAY): boolean {
  return reservations.some(
    (item) => item.roomId === room.id && blocksRoom(item) && item.checkOut > day,
  )
}
