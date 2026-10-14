import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { PayState } from '@/types/domain'
import { Badge, type BadgeTone } from '@/components/atoms/Badge/Badge'
import { IconCheckCircle, IconCircle, IconHalfCircle } from '@/components/atoms/Icon/icons'

const look: Record<PayState, { tone: BadgeTone; icon: ReactNode }> = {
  paid: { tone: 'success', icon: <IconCheckCircle /> },
  partial: { tone: 'warning', icon: <IconHalfCircle /> },
  unpaid: { tone: 'danger', icon: <IconCircle /> },
}

export function PaymentBadge({ state }: { state: PayState }) {
  const { t } = useTranslation()
  const { tone, icon } = look[state]
  return (
    <Badge tone={tone} icon={icon}>
      {t(`pay.${state}`)}
    </Badge>
  )
}
