import { useTranslation } from 'react-i18next'
import s from './Spinner.module.scss'

export function Spinner({ label }: { label?: string }) {
  const { t } = useTranslation()
  return (
    <div className={s.wrap} role="status" aria-label={label ?? t('common.loading')}>
      <span className={s.spinner} />
    </div>
  )
}
