import { memo, useMemo } from 'react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import type { DaySelection, Reservation, Room } from '@/types/domain'
import { addDaysIso, fmtDate, isWeekend, placeBlock } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { IconWrench } from '@/components/atoms/Icon/icons'
import { DayCell } from '@/features/kalendari/DayCell'
import { ReservationBlock } from '@/features/kalendari/ReservationBlock'
import s from './RoomRow.module.scss'

export const RoomRow = memo(function RoomRow({
  room,
  dates,
  reservations,
  colW,
  selection,
  focusedDay,
  onBegin,
  onExtend,
  onOpen,
}: {
  room: Room
  dates: string[]
  reservations: Reservation[]
  colW: number
  selection: DaySelection | null
  focusedDay: number | null
  onBegin: (roomId: string, day: number) => void
  onExtend: (roomId: string, day: number) => void
  onOpen: (id: string) => void
}) {
  const { t } = useTranslation()
  const startDate = dates[0] ?? TODAY
  const rangeEnd = addDaysIso(startDate, dates.length)
  const blocks = useMemo(
    () =>
      reservations.flatMap((reservation) => {
        if (reservation.roomId !== room.id || reservation.status === 'CANCELLED') return []
        const placement = placeBlock({ checkIn: reservation.checkIn, checkOut: reservation.checkOut, rangeStart: startDate, rangeEnd, colW })
        return placement ? [{ reservation, placement }] : []
      }),
    [colW, rangeEnd, reservations, room.id, startDate],
  )

  return (
    <div className={s.row} role="row">
      <div className={s.room} role="rowheader">
        <span className={s.num}>{room.id}</span>
        {room.floor ? <span className={s.floor}>{t('reservation.floor', { floor: room.floor })}</span> : null}
      </div>
      <div
        className={s.track}
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest('[data-reservation]')) return
          const cell = (event.target as HTMLElement).closest<HTMLElement>('[data-day]')
          if (!cell || cell.dataset.room !== room.id) return
          event.currentTarget.setPointerCapture(event.pointerId)
          onBegin(room.id, Number(cell.dataset.day))
        }}
        onPointerMove={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return
          const rect = event.currentTarget.getBoundingClientRect()
          const index = Math.min(dates.length - 1, Math.max(0, Math.floor((event.clientX - rect.left) / colW)))
          onExtend(room.id, index)
        }}
      >
        {dates.map((iso, index) => (
          <DayCell
            key={iso}
            roomId={room.id}
            index={index}
            label={t('kalendari.cellLabel', { room: room.id, date: fmtDate(iso) })}
            selected={Boolean(
              selection &&
                selection.roomId === room.id &&
                index >= Math.min(selection.a, selection.b) &&
                index <= Math.max(selection.a, selection.b),
            )}
            today={iso === TODAY}
            weekend={isWeekend(iso)}
            focused={focusedDay === index}
          />
        ))}
        {(room.blocks ?? []).map((hold) => {
          const placement = placeBlock({ checkIn: hold.startsOn, checkOut: hold.endsOn, rangeStart: startDate, rangeEnd, colW })
          if (!placement) return null
          const reason = hold.reason ?? t(`block.${hold.type}`)
          return (
            <div
              key={hold.id}
              className={clsx(s.hold)}
              style={{ insetInlineStart: placement.leftPx, inlineSize: placement.widthPx }}
              title={t('kalendari.holdLabel', { reason, from: fmtDate(hold.startsOn), to: fmtDate(hold.endsOn) })}
            >
              <IconWrench size={14} />
              <span>{t(`block.${hold.type}`)}</span>
            </div>
          )
        })}
        {blocks.map(({ reservation, placement }) => (
          <ReservationBlock
            key={reservation.id}
            reservation={reservation}
            placement={placement}
            showMeta={placement.showMeta}
            onOpen={onOpen}
          />
        ))}
      </div>
    </div>
  )
})
