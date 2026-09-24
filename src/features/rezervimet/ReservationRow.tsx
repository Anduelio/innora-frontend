import { useTranslation } from 'react-i18next'
import type { Reservation } from '@/types/domain'
import { dayIndex, fmtShkurter } from '@/lib/date/calendar'
import { useUiStore } from '@/store/uiStore'
import { SourceBadge } from '@/components/ui/SourceBadge/SourceBadge'
import { StatusBadge } from '@/components/ui/StatusBadge/StatusBadge'
import s from './ReservationRow.module.scss'

export function ReservationRow({ reservation, monthsShort }: { reservation: Reservation; monthsShort: string[] }) {
  const { t } = useTranslation()
  const openDrawer = useUiStore((state) => state.openDrawer)
  return (
    <button type="button" className={s.row} onClick={() => openDrawer(reservation.id)}>
      <span>
        <span className={s.name}>{reservation.guestName}</span>
        <span className={s.meta}>
          {t('common.person', { count: reservation.persons })} · {t('common.night', { count: dayIndex(reservation.checkIn, reservation.checkOut) })}
        </span>
      </span>
      <span className={s.room}>{reservation.roomId}</span>
      <span className={s.date}>{fmtShkurter(reservation.checkIn, monthsShort)}</span>
      <span className={s.date}>{fmtShkurter(reservation.checkOut, monthsShort)}</span>
      <span>
        <SourceBadge source={reservation.source} />
      </span>
      <span>
        <StatusBadge status={reservation.status} />
      </span>
    </button>
  )
}
