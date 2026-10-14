import { useTranslation } from 'react-i18next'
import type { ReportPeriod, TypeNights } from '@/lib/reports'
import { IconCalendar } from '@/components/atoms/Icon/icons'
import { csvFileName, downloadCsv } from '@/features/raportet/csv'
import { MetricCard } from '@/features/raportet/MetricCard'
import s from './report.module.scss'

export function RoomNightsCard({
  total,
  byType,
  futureNights,
  typeNames,
  period,
}: {
  total: number
  byType: TypeNights[]
  futureNights: number
  typeNames: Map<number, string>
  period: ReportPeriod
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
    >
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col">{t('raportet.filters.roomType')}</th>
              <th scope="col" className={s.num}>
                {t('raportet.roomNights.title')}
              </th>
            </tr>
          </thead>
          <tbody>
            {byType.map((row) => (
              <tr key={row.roomTypeId}>
                <th scope="row">{typeNames.get(row.roomTypeId) ?? row.roomTypeId}</th>
                <td className={s.num}>{row.nights}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">{t('common.total')}</th>
              <td className={s.num}>{total}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      {futureNights > 0 ? <p className={s.note}>{t('raportet.roomNights.future', { count: futureNights })}</p> : null}
    </MetricCard>
  )
}
