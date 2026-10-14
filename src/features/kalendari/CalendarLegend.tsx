import { useTranslation } from 'react-i18next'
import { IconPlus } from '@/components/atoms/Icon/icons'
import s from './CalendarLegend.module.scss'

const items = ['free', 'confirmed', 'inHouse', 'out', 'maintenance', 'unassigned'] as const

export function CalendarLegend() {
  const { t } = useTranslation()
  return (
    <div className={s.legend}>
      <ul className={s.items}>
        {items.map((key) => (
          <li key={key} className={s.item}>
            <span className={`${s.swatch} ${s[key]}`} aria-hidden="true" />
            {t(`kalendari.legend.${key}`)}
          </li>
        ))}
      </ul>
      <p className={s.hint}>
        <IconPlus size={16} />
        {t('kalendari.hint')}
      </p>
    </div>
  )
}
