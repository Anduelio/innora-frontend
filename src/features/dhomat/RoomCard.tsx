import { useTranslation } from 'react-i18next'
import type { Reservation, Room } from '@/types/domain'
import { fmtShkurter } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { blocksRoom, coversDay } from '@/lib/stay'
import { roomTypeKey } from '@/lib/rooms'
import s from './RoomCard.module.scss'

export function RoomCard({
  room,
  reservations,
  monthsShort,
  onOpen,
}: {
  room: Room
  reservations: Reservation[]
  monthsShort: string[]
  onOpen: (room: Room) => void
}) {
  const { t } = useTranslation()
  const current = reservations.find((item) => item.roomId === room.id && coversDay(item, TODAY))
  const next = reservations
    .filter((item) => item.roomId === room.id && blocksRoom(item) && item.checkIn > TODAY)
    .sort((a, b) => a.checkIn.localeCompare(b.checkIn))[0]
  const status = room.operationalStatus ?? 'ready'
  const typeLabel = room.typeName || (room.type in roomTypeKey ? t(roomTypeKey[room.type]) : room.type)

  return (
    <button type="button" className={s.card} onClick={() => onOpen(room)}>
      <div className={s.top}>
        <div>
          <div className={s.num}>{room.id}</div>
          <div className={s.type}>{typeLabel}</div>
          <div className={s.cap}>
            {room.floor ? t('room.floor', { floor: room.floor }) : t('common.person', { count: room.capacity })}
          </div>
        </div>
        <span className={status === 'ready' || status === 'inspected' ? s.free : s.busy}>
          {t(`ops.${status}`)}
        </span>
      </div>
      <p className={s.note}>
        {current
          ? t('room.until', { name: current.guestName, date: fmtShkurter(current.checkOut, monthsShort) })
          : next
            ? t('room.freeUntil', { date: fmtShkurter(next.checkIn, monthsShort) })
            : t('room.free')}
      </p>
    </button>
  )
}
