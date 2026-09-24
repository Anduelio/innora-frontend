import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import type { Reservation } from '@/types/domain'
import type { BlockPlacement } from '@/lib/date/calendar'
import { SourceBadge } from '@/components/ui/SourceBadge/SourceBadge'
import s from './ReservationBlock.module.scss'

const tone = {
  RESERVED: s.reserved,
  IN_HOUSE: s.inHouse,
  COMPLETED: s.completed,
  CANCELLED: s.cancelled,
} as const

export function ReservationBlock({
  reservation,
  placement,
  showMeta,
  onOpen,
}: {
  reservation: Reservation
  placement: BlockPlacement
  showMeta: boolean
  onOpen: () => void
}) {
  const { t } = useTranslation()
  const mark = t(`status.mark${reservation.status}`)
  const source = t(`source.${reservation.source}`)

  return (
    <button
      type="button"
      data-reservation={reservation.id}
      className={clsx(s.block, tone[reservation.status], reservation.status === 'CANCELLED' && s.isCancelled)}
      style={{ left: placement.leftPx, width: placement.widthPx }}
      aria-label={t('calendar.blockLabel', { mark, name: reservation.guestName, source })}
      onClick={onOpen}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <span className={s.nameRow}>
        <span aria-hidden="true">{mark}</span>
        <span className={s.name}>{reservation.guestName}</span>
        {!showMeta && reservation.source === 'BOOKING' ? <span className={s.booking}>B</span> : null}
      </span>
      {showMeta ? (
        <span className={s.meta}>
          <span>{t('common.person', { count: reservation.persons })}</span>
          <span aria-hidden="true">·</span>
          <SourceBadge source={reservation.source} />
        </span>
      ) : null}
    </button>
  )
}
