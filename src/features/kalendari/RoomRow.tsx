import { useTranslation } from 'react-i18next'
import type { Reservation, Room } from '@/types/domain'
import { addDaysIso, fmtShkurter, isWeekend, placeBlock } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { useCalendarStore } from '@/store/calendarStore'
import { DayCell } from '@/features/kalendari/DayCell'
import { ReservationBlock } from '@/features/kalendari/ReservationBlock'
import s from './RoomRow.module.scss'

export function RoomRow({
  room,
  dates,
  reservations,
  colW,
  monthsShort,
  focusedDay,
  comfortable,
  onBegin,
  onExtend,
  onOpen,
}: {
  room: Room
  dates: string[]
  reservations: Reservation[]
  colW: number
  monthsShort: string[]
  focusedDay: number | null
  comfortable: boolean
  onBegin: (roomId: string, day: number) => void
  onExtend: (roomId: string, day: number) => void
  onOpen: (id: string) => void
}) {
  const { t } = useTranslation()
  const selection = useCalendarStore((state) => state.selection)
  const startDate = dates[0] ?? TODAY
  const rangeEnd = addDaysIso(startDate, dates.length)
  const blocks = reservations
    .filter((reservation) => reservation.roomId === room.id)
    .map((reservation) => ({
      reservation,
      placement: placeBlock({
        checkIn: reservation.checkIn,
        checkOut: reservation.checkOut,
        rangeStart: startDate,
        rangeEnd,
        colW,
      }),
    }))
    .filter((item): item is { reservation: Reservation; placement: NonNullable<typeof item.placement> } =>
      item.placement !== null,
    )

  return (
    <div className={s.row} role="row">
      <div className={s.room} role="rowheader">
        <span className={s.num}>{room.id}</span>
        <span className={s.type}>{room.typeName || room.type}</span>
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
        {dates.map((iso, index) => {
          const selected = Boolean(
            selection &&
              selection.roomId === room.id &&
              index >= Math.min(selection.a, selection.b) &&
              index <= Math.max(selection.a, selection.b),
          )
          return (
            <DayCell
              key={iso}
              roomId={room.id}
              index={index}
              label={t('calendar.cellLabel', { room: room.id, date: fmtShkurter(iso, monthsShort) })}
              selected={selected}
              today={iso === TODAY}
              weekend={isWeekend(iso)}
              focused={focusedDay === index}
            />
          )
        })}
        {(room.blocks ?? []).map((hold) => {
          const placement = placeBlock({
            checkIn: hold.startsOn,
            checkOut: hold.endsOn,
            rangeStart: startDate,
            rangeEnd,
            colW,
          })
          if (!placement) return null
          return (
            <div
              key={hold.id}
              className={s.hold}
              style={{ insetInlineStart: placement.leftPx, inlineSize: placement.widthPx }}
              title={hold.reason ?? t(`block.${hold.type}`)}
            >
              {t(`block.${hold.type}`)}
            </div>
          )
        })}
        {blocks.map(({ reservation, placement }) => (
          <ReservationBlock
            key={reservation.id}
            reservation={reservation}
            placement={placement}
            showMeta={placement.showMeta && comfortable}
            onOpen={() => onOpen(reservation.id)}
          />
        ))}
      </div>
    </div>
  )
}
