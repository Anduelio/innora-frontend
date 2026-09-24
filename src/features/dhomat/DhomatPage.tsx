import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Room } from '@/types/domain'
import { TODAY } from '@/lib/date/today'
import { coversDay } from '@/lib/stay'
import { useHotelReservations } from '@/lib/api/reservations'
import { useRooms } from '@/lib/api/rooms'
import { Button } from '@/components/ui/Button/Button'
import { EmptyState } from '@/components/ui/EmptyState/EmptyState'
import { Spinner } from '@/components/ui/Spinner/Spinner'
import { BulkRoomModal } from '@/features/dhomat/BulkRoomModal'
import { RoomCard } from '@/features/dhomat/RoomCard'
import { RoomDetailDrawer } from '@/features/dhomat/RoomDetailDrawer'
import { RoomFormModal } from '@/features/dhomat/RoomFormModal'
import { RoomTypeModal } from '@/features/dhomat/RoomTypeModal'
import s from './DhomatPage.module.scss'

export function DhomatPage() {
  const { t } = useTranslation()
  const rooms = useRooms()
  const reservations = useHotelReservations()
  const monthsShort = t('calendar.monthsShort', { returnObjects: true }) as string[]
  const [selected, setSelected] = useState<Room | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [typesOpen, setTypesOpen] = useState(false)

  if ((rooms.isLoading && !rooms.data) || (reservations.isLoading && !reservations.data)) return <Spinner />
  if (rooms.isError || reservations.isError) return <EmptyState title={t('common.loadError')} />

  const list = rooms.data ?? []
  const stays = reservations.data ?? []
  const occupied = list.filter((room) => stays.some((item) => item.roomId === room.id && coversDay(item, TODAY))).length
  const count = (status: Room['operationalStatus']) => list.filter((room) => (room.operationalStatus ?? 'ready') === status).length

  return (
    <div className={s.page}>
      <div className={s.toolbar}>
        <div className={s.summary}>
          <span>{t('room.total', { count: list.length })}</span>
          <span>{t('room.readyCount', { count: count('ready') + count('inspected') })}</span>
          <span>{t('room.occupiedCount', { count: occupied })}</span>
          <span>{t('room.dirtyCount', { count: count('dirty') })}</span>
          <span>{t('room.maintenanceCount', { count: count('maintenance') + count('out_of_order') })}</span>
        </div>
        <div className={s.actions}>
          <Button onClick={() => setCreateOpen(true)}>{t('room.add')}</Button>
          <Button variant="secondary" onClick={() => setBulkOpen(true)}>{t('room.addMany')}</Button>
          <Button variant="secondary" onClick={() => setTypesOpen(true)}>{t('room.types')}</Button>
        </div>
      </div>
      <div className={s.grid}>
        {list.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            reservations={stays}
            monthsShort={monthsShort}
            onOpen={setSelected}
          />
        ))}
      </div>
      <RoomDetailDrawer
        room={selected ? list.find((item) => item.id === selected.id) ?? selected : null}
        reservations={stays}
        onClose={() => setSelected(null)}
      />
      <RoomFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <BulkRoomModal open={bulkOpen} onClose={() => setBulkOpen(false)} />
      <RoomTypeModal open={typesOpen} onClose={() => setTypesOpen(false)} />
    </div>
  )
}
