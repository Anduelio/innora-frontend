import { memo, useMemo } from 'react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import type { Reservation, Room, RoomTypeInfo } from '@/types/domain'
import { addDaysIso, fmtDate, rangeOf, weekdayIndex } from '@/lib/date/calendar'
import { typeFreeOn } from '@/lib/inventory'
import { useUiStore } from '@/store/uiStore'
import s from './AvailabilityGrid.module.scss'

export const AvailabilityGrid = memo(function AvailabilityGrid({
  start,
  nights,
  rooms,
  roomTypes,
  reservations,
}: {
  start: string
  nights: number
  rooms: Room[]
  roomTypes: RoomTypeInfo[]
  reservations: Reservation[]
}) {
  const { t } = useTranslation()
  const openCreate = useUiStore((state) => state.openCreate)
  const weekdays = t('calendar.weekdaysShort', { returnObjects: true }) as string[]
  const days = useMemo(() => rangeOf(start, nights), [start, nights])
  const rows = useMemo(
    () =>
      roomTypes.map((type) => ({
        type,
        total: rooms.filter((room) => room.roomTypeId === type.id).length,
        free: days.map((day) => Math.max(0, typeFreeOn(type.id, day, rooms, reservations))),
      })),
    [days, reservations, roomTypes, rooms],
  )

  return (
    <div className={s.scroller}>
      <table className={s.table}>
        <thead>
          <tr>
            <th scope="col" className={s.corner}>
              <span className={s.sr}>{t('room.type')}</span>
            </th>
            {days.map((day) => (
              <th key={day} scope="col" className={s.day}>
                <span className={s.dow}>{weekdays[weekdayIndex(day)]}</span>
                <span className={s.num}>{Number(day.slice(8, 10))}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ type, total, free }) => (
            <tr key={type.id}>
              <th scope="row" className={s.type}>
                <span className={s.typeName}>{type.name}</span>
                <span className={s.typeTotal}>{t('kalendari.roomsTotal', { count: total })}</span>
              </th>
              {free.map((count, index) => {
                const day = days[index] ?? start
                return (
                  <td key={day}>
                    <button
                      type="button"
                      className={clsx(s.cell, count === 0 && s.full, count === 1 && s.last)}
                      disabled={count === 0}
                      aria-label={t('kalendari.bookCell', { type: type.name, date: fmtDate(day), count })}
                      onClick={() => openCreate({ checkIn: day, checkOut: addDaysIso(day, 1), roomTypeId: type.id })}
                    >
                      {count === 0 ? t('kalendari.full') : count}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
})
