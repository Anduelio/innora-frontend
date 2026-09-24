import { FolioDrawer } from '@/features/folio/FolioDrawer'
import { ReservationDrawer } from '@/features/rezervimi/ReservationDrawer'
import { ReservationFormModal } from '@/features/rezervimi/ReservationFormModal'
import { useKnownReservations } from '@/lib/api/reservations'
import { useRooms } from '@/lib/api/rooms'

export function ReservationSurfaces() {
  const rooms = useRooms()
  const known = useKnownReservations()
  return (
    <>
      <ReservationFormModal rooms={rooms.data ?? []} reservations={known.reservations} />
      <ReservationDrawer rooms={rooms.data ?? []} reservations={known.reservations} />
      <FolioDrawer />
    </>
  )
}
