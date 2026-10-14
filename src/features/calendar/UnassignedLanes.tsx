import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Reservation } from '@/types/domain'
import { addDaysIso, placeBlock } from '@/lib/date/calendar'
import { IconAlert } from '@/components/atoms/Icon/icons'
import { ReservationBlock } from '@/features/calendar/ReservationBlock'
import s from './UnassignedLanes.module.scss'

/** Rezervimet pa dhomë vendosen në korsi; një korsi e re vetëm kur dy qëndrime mbivendosen. */
export const UnassignedLanes = memo(function UnassignedLanes({
  dates,
  reservations,
  colW,
  onOpen,
}: {
  dates: string[]
  reservations: Reservation[]
  colW: number
  onOpen: (id: string) => void
}) {
  const { t } = useTranslation()
  const start = dates[0] ?? ''
  const end = addDaysIso(start, dates.length)

  const lanes = useMemo(() => {
    const visible = reservations
      .filter((item) => !item.roomId && item.status === 'RESERVED' && item.checkOut > start && item.checkIn < end)
      .toSorted((a, b) => a.checkIn.localeCompare(b.checkIn))
    const result: Reservation[][] = []
    for (const item of visible) {
      const lane = result.find((list) =>
        list.every((other) => other.checkOut <= item.checkIn || other.checkIn >= item.checkOut),
      )
      if (lane) lane.push(item)
      else result.push([item])
    }
    return result
  }, [end, reservations, start])

  if (lanes.length === 0) return null

  return (
    <>
      {lanes.map((lane, index) => (
        <div key={lane[0]?.id ?? index} className={s.row} role="row">
          <div className={s.label} role="rowheader">
            {index === 0 ? (
              <>
                <IconAlert size={16} />
                <span>{t('kalendari.unassignedLane')}</span>
              </>
            ) : null}
          </div>
          <div className={s.track}>
            {dates.map((iso) => (
              <span key={iso} className={s.cell} />
            ))}
            {lane.map((reservation) => {
              const placement = placeBlock({
                checkIn: reservation.checkIn,
                checkOut: reservation.checkOut,
                rangeStart: start,
                rangeEnd: end,
                colW,
              })
              return placement ? (
                <ReservationBlock
                  key={reservation.id}
                  reservation={reservation}
                  placement={placement}
                  showMeta={placement.showMeta}
                  unassigned
                  onOpen={onOpen}
                />
              ) : null
            })}
          </div>
        </div>
      ))}
    </>
  )
})
