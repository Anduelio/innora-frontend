import { useTranslation } from 'react-i18next'
import { formatPercent, type ReportPeriod, type TypeNights } from '@/lib/reports'
import { IconCalendar } from '@/components/atoms/Icon/icons'
import { DonutChart } from '@/components/molecules/Chart/DonutChart'
import { csvFileName, downloadCsv } from '@/features/reports/csv'
import { MetricCard } from '@/features/reports/MetricCard'
import s from './report.module.scss'

export function RoomNightsCard({
  total,
  byType,
  futureNights,
  typeNames,
  period,
  wide = false,
}: {
  total: number
  byType: TypeNights[]
  futureNights: number
  typeNames: Map<number, string>
  period: ReportPeriod
  wide?: boolean
}) {
  const { t } = useTranslation()
  const exportCsv = () =>
    downloadCsv(csvFileName('net-dhoma', period), [
      [t('raportet.filters.roomType'), t('raportet.roomNights.title')],
      ...byType.map((row) => [typeNames.get(row.roomTypeId) ?? String(row.roomTypeId), row.nights]),
      [t('common.total'), total],
    ])

  return (
    <MetricCard
      title={t('raportet.roomNights.title')}
      definition={t('raportet.roomNights.definition')}
      basis={t('raportet.basis.night')}
      icon={<IconCalendar />}
      onExport={exportCsv}
      wide={wide}
    >
      {total === 0 ? (
        <p className={s.muted}>{t('raportet.roomNights.empty')}</p>
      ) : (
        <DonutChart
          ariaLabel={t('raportet.charts.label', { title: t('raportet.roomNights.title') })}
          centerValue={String(total)}
          centerLabel={t('raportet.charts.centerNights')}
          slices={byType.map((row) => ({
            key: String(row.roomTypeId),
            label: typeNames.get(row.roomTypeId) ?? String(row.roomTypeId),
            value: row.nights,
            valueLabel: t('raportet.charts.nightsValue', { count: row.nights }),
            percentLabel: formatPercent(total > 0 ? row.nights / total : null),
          }))}
        />
      )}
      {futureNights > 0 ? <p className={s.note}>{t('raportet.roomNights.future', { count: futureNights })}</p> : null}
    </MetricCard>
  )
}
