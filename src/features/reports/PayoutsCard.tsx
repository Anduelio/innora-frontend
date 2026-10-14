import { useTranslation } from 'react-i18next'
import { IconInfo } from '@/components/atoms/Icon/icons'
import { MetricCard } from '@/features/reports/MetricCard'
import s from './report.module.scss'

export function PayoutsCard() {
  const { t } = useTranslation()
  return (
    <MetricCard title={t('raportet.payouts.title')} definition={t('raportet.payouts.definition')} icon={<IconInfo />}>
      <p className={s.muted}>{t('raportet.payouts.note')}</p>
    </MetricCard>
  )
}
