import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import type { ReservationSource } from '@/types/domain'
import s from './SourceBadge.module.scss'

const tone: Record<ReservationSource, string> = {
  DIREKT: s.direkt,
  BOOKING: s.booking,
  TELEFON: s.telefon,
  WHATSAPP: s.whatsapp,
  RECEPSION: s.recepsion,
}

export function SourceBadge({ source }: { source: ReservationSource }) {
  const { t } = useTranslation()
  return <span className={clsx(s.badge, tone[source])}>{t(`source.${source}`)}</span>
}
