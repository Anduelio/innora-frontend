import { useTranslation } from 'react-i18next'
import s from './Spinner.module.scss'

export function Spinner() {
  const { t } = useTranslation()
  return <div className={s.spinner} role="status" aria-label={t('common.loading')} />
}
