import { memo } from 'react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import type { Reservation } from '@/types/domain'
import { fmtDate, type BlockPlacement } from '@/lib/date/calendar'
import { IconBooking, IconCheck } from '@/components/atoms/Icon/icons'
import s from './ReservationBlock.module.scss'

const tone: Record<Reservation['status'], string | undefined> = {
  RESERVED: s.confirmed,
  IN_HOUSE: s.inHouse,
  COMPLETED: s.out,
  CANCELLED: s.cancelled,
  NO_SHOW: s.noShow,
}

export const ReservationBlock = memo(function ReservationBlock({
  reservation,
  placement,
  showMeta,
  unassigned = false,
  onOpen,
}: {
  reservation: Reservation
  placement: BlockPlacement
  showMeta: boolean
  unassigned?: boolean
  onOpen: (id: string) => void
}) {
  const { t } = useTranslation()
  const label = t('kalendari.blockLabel', {
    name: reservation.guestName,
    status: t(`status.${reservation.status}`),
    source: t(`source.${reservation.source}`),
    from: fmtDate(reservation.checkIn),
    to: fmtDate(reservation.checkOut),
  })

  return (
    <button
      type="button"
      data-reservation={reservation.id}
      className={clsx(
        s.block,
        unassigned ? s.unassigned : tone[reservation.status],
        placement.clippedStart && s.clipStart,
        placement.clippedEnd && s.clipEnd,
      )}
      style={{ insetInlineStart: placement.leftPx, inlineSize: placement.widthPx }}
      aria-label={label}
      title={label}
      onClick={() => onOpen(reservation.id)}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <span className={s.nameRow}>
        {reservation.status === 'IN_HOUSE' ? <IconCheck size={14} className={s.icon} /> : null}
        <span className={s.name}>{reservation.guestName}</span>
        {reservation.source === 'BOOKING' ? <IconBooking size={14} className={s.booking} /> : null}
      </span>
      {showMeta ? (
        <span className={s.meta}>
          {t(`status.${reservation.status}`)} · {t('common.guest', { count: reservation.persons })}
        </span>
      ) : null}
    </button>
  )
})
