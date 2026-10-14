import { useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Reservation, Room } from '@/types/domain'
import { freeRoomsForStay } from '@/lib/inventory'
import { Button } from '@/components/atoms/Button/Button'
import { Select } from '@/components/atoms/Select/Select'
import { useStayActions } from '@/features/rezervimi/useStayActions'
import s from './AssignRoom.module.scss'

export function AssignRoom({
  reservation,
  rooms,
  reservations,
  compact = false,
  onDone,
}: {
  reservation: Reservation
  rooms: Room[]
  reservations: Reservation[]
  compact?: boolean
  onDone?: () => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const actions = useStayActions()
  const [roomId, setRoomId] = useState('')
  const free = useMemo(
    () =>
      freeRoomsForStay(reservation.checkIn, reservation.checkOut, rooms, reservations, {
        roomTypeId: reservation.roomTypeId,
        ignoreId: reservation.id,
      }).filter((room) => room.id !== reservation.roomId),
    [reservation, reservations, rooms],
  )

  if (free.length === 0) return reservation.roomId ? null : <p className={s.empty}>{t('reservation.noFreeRoom')}</p>

  return (
    <form
      className={compact ? s.compact : s.form}
      onSubmit={(event) => {
        event.preventDefault()
        if (roomId) actions.assign(reservation, roomId, onDone)
      }}
    >
      <Select id={id} aria-label={t('reservation.chooseRoom')} value={roomId} onChange={(event) => setRoomId(event.target.value)}>
        <option value="">{t('reservation.chooseRoom')}</option>
        {free.map((room) => (
          <option key={room.id} value={room.id}>
            {t('common.roomNumber', { room: room.id })} · {room.type}
            {room.floor ? ` · ${t('reservation.floor', { floor: room.floor })}` : ''}
          </option>
        ))}
      </Select>
      <Button type="submit" variant={compact ? 'primary' : 'secondary'} disabled={!roomId} loading={actions.pending}>
        {reservation.roomId ? t('reservation.changeRoom') : t('reservation.assign')}
      </Button>
      {compact ? null : <p className={s.hint}>{t('reservation.freeRooms', { count: free.length })}</p>}
    </form>
  )
}
