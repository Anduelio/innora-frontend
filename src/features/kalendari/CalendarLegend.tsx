import { useTranslation } from 'react-i18next'
import { IconPlus } from '@/components/icons'
import s from './CalendarLegend.module.scss'

const items = ['IN_HOUSE', 'RESERVED', 'COMPLETED', 'CANCELLED'] as const

const tone = {
  IN_HOUSE: s.inHouse,
  RESERVED: s.reserved,
  COMPLETED: s.completed,
  CANCELLED: s.cancelled,
} as const

export function CalendarLegend() {
  const { t } = useTranslation()
  return (
    <div className={s.legend}>
      {items.map((status) => (
        <span key={status} className={s.item}>
          <span className={`${s.swatch} ${tone[status]}`} />
          {t(`status.mark${status}`)} {t(`status.${status}`)}
        </span>
      ))}
      <span className={s.hint}>
        <IconPlus width="17" height="17" />
        {t('calendar.hint')}
      </span>
    </div>
  )
}
