import { useTranslation } from 'react-i18next'
import { fmtDate } from '@/lib/date/calendar'
import { centsToDecimal, type ForecastReport, type ReportPeriod } from '@/lib/reports'
import { Badge } from '@/components/atoms/Badge/Badge'
import { IconClock } from '@/components/atoms/Icon/icons'
import { Money } from '@/components/atoms/Money/Money'
import { DescriptionList } from '@/components/molecules/DescriptionList/DescriptionList'
import { csvFileName, downloadCsv } from '@/features/reports/csv'
import { MetricCard } from '@/features/reports/MetricCard'
import s from './report.module.scss'

export function ForecastCard({ forecast, period }: { forecast: ForecastReport; period: ReportPeriod }) {
  const { t } = useTranslation()
  const exportCsv = () =>
    downloadCsv(csvFileName('parashikim', period), [
      [t('raportet.currencyCol'), t('raportet.amountCol'), t('raportet.forecast.nights')],
      ...forecast.totals.map((item) => [item.currency, centsToDecimal(item.cents), forecast.nights]),
    ])

  return (
    <MetricCard
      title={t('raportet.forecast.title')}
      definition={t('raportet.forecast.definition')}
      basis={t('raportet.basis.futureNight')}
      badge={<Badge tone="info">{t('raportet.forecast.badge')}</Badge>}
      icon={<IconClock />}
      onExport={forecast.totals.length ? exportCsv : undefined}
    >
      {!forecast.window ? (
        <p className={s.muted}>{t('raportet.forecast.none')}</p>
      ) : forecast.nights === 0 ? (
        <p className={s.muted}>{t('raportet.forecast.empty')}</p>
      ) : (
        <>
          <DescriptionList
            columns={2}
            items={[
              ...forecast.totals.map((item) => ({
                label: item.currency,
                value: <Money cents={item.cents} currency={item.currency} strong />,
                emphasis: true,
              })),
              { label: t('raportet.forecast.nights'), value: forecast.nights },
            ]}
          />
          <p className={s.note}>
            {t('raportet.forecast.window', {
              from: fmtDate(forecast.window.start),
              to: fmtDate(forecast.window.end),
            })}
          </p>
        </>
      )}
    </MetricCard>
  )
}
