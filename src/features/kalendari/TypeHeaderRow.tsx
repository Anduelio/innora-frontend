import { memo } from 'react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import type { Reservation, Room, RoomTypeInfo } from '@/types/domain'
import { fmtDate } from '@/lib/date/calendar'
import { typeFreeOn } from '@/lib/inventory'
import s from './TypeHeaderRow.module.scss'

export const TypeHeaderRow = memo(function TypeHeaderRow({
  type,
  rooms,
  dates,
  reservations,
}: {
  type: RoomTypeInfo
  rooms: Room[]
  dates: string[]
  reservations: Reservation[]
}) {
  const { t } = useTranslation()
  const total = rooms.filter((room) => room.roomTypeId === type.id).length
  return (
    <div className={s.row} role="row">
      <div className={s.label} role="rowheader">
        <span className={s.name}>{type.name}</span>
        <span className={s.total}>{t('kalendari.roomsTotal', { count: total })}</span>
      </div>
      {dates.map((iso) => {
        const free = typeFreeOn(type.id, iso, rooms, reservations)
        return (
          <div
            key={iso}
            role="gridcell"
            className={clsx(s.count, free <= 0 && s.full, free === 1 && s.last)}
            aria-label={t('kalendari.freeLabel', { type: type.name, date: fmtDate(iso), free: Math.max(0, free), total })}
          >
            {t('kalendari.freeShort', { free: Math.max(0, free), total })}
          </div>
        )
      })}
    </div>
  )
})
