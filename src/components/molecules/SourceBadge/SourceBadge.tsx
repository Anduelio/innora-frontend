import type { ReactNode } from 'react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import type { ReservationSource } from '@/types/domain'
import { IconBooking, IconDoor, IconPhone } from '@/components/atoms/Icon/icons'
import s from './SourceBadge.module.scss'

const look: Record<ReservationSource, { className: string | undefined; icon: ReactNode }> = {
  BOOKING: { className: s.booking, icon: <IconBooking /> },
  TELEFON: { className: s.phone, icon: <IconPhone /> },
  RECEPSION: { className: s.walkin, icon: <IconDoor /> },
}

export function SourceBadge({ source }: { source: ReservationSource }) {
  const { t } = useTranslation()
  const { className, icon } = look[source]
  return (
    <span className={clsx(s.badge, className)}>
      {icon}
      {t(`source.${source}`)}
    </span>
  )
}
