import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { ReservationStatus } from '@/types/domain'
import { Badge, type BadgeTone } from '@/components/atoms/Badge/Badge'
import { IconArrive, IconCheckCircle, IconClock, IconDepart, IconXCircle } from '@/components/atoms/Icon/icons'

const look: Record<ReservationStatus, { tone: BadgeTone; icon: ReactNode }> = {
  RESERVED: { tone: 'info', icon: <IconCheckCircle /> },
  IN_HOUSE: { tone: 'success', icon: <IconArrive /> },
  COMPLETED: { tone: 'neutral', icon: <IconDepart /> },
  CANCELLED: { tone: 'danger', icon: <IconXCircle /> },
  NO_SHOW: { tone: 'warning', icon: <IconClock /> },
}

export function StatusBadge({ status }: { status: ReservationStatus }) {
  const { t } = useTranslation()
  const { tone, icon } = look[status]
  return (
    <Badge tone={tone} icon={icon}>
      {t(`status.${status}`)}
    </Badge>
  )
}
