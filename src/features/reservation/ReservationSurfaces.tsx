import { useKnownReservations } from '@/lib/api/reservations'
import { useRoomTypes, useRooms } from '@/lib/api/rooms'
import { ReservationDetailSheet } from '@/features/reservation/ReservationDetailSheet'
import { ReservationFormSheet } from '@/features/reservation/ReservationFormSheet'

export function ReservationSurfaces() {
  const rooms = useRooms()
  const roomTypes = useRoomTypes()
  const known = useKnownReservations()
  const roomList = rooms.data ?? []
  const typeList = roomTypes.data ?? []
  return (
    <>
      <ReservationFormSheet rooms={roomList} roomTypes={typeList} reservations={known.reservations} />
      <ReservationDetailSheet rooms={roomList} roomTypes={typeList} reservations={known.reservations} />
    </>
  )
}
