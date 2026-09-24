import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import type { ReservationStatus } from '@/types/domain'
import s from './StatusBadge.module.scss'

const tone: Record<ReservationStatus, string> = {
  RESERVED: s.reserved,
  IN_HOUSE: s.inHouse,
  COMPLETED: s.completed,
  CANCELLED: s.cancelled,
}

export function StatusBadge({ status }: { status: ReservationStatus }) {
  const { t } = useTranslation()
  return (
    <span className={clsx(s.badge, tone[status])}>
      <span aria-hidden="true">{t(`status.mark${status}`)}</span>
      {t(`status.${status}`)}
    </span>
  )
}
