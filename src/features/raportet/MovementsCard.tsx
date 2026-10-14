import { useTranslation } from 'react-i18next'
import type { Movements, ReportPeriod } from '@/lib/reports'
import { IconArrive } from '@/components/atoms/Icon/icons'
import { csvFileName, downloadCsv } from '@/features/raportet/csv'
import { MetricCard } from '@/features/raportet/MetricCard'
import s from './report.module.scss'

const KEYS = ['arrivals', 'departures', 'stays'] as const

export function MovementsCard({ movements, period }: { movements: Movements; period: ReportPeriod }) {
  const { t } = useTranslation()
  const exportCsv = () =>
    downloadCsv(csvFileName('levizjet', period), [
      [t('raportet.metric'), t('raportet.movements.count'), t('raportet.movements.noShow'), t('raportet.movements.cancelled')],
      ...KEYS.map((key) => [t(`raportet.movements.${key}.title`), movements[key].count, movements[key].noShow, movements[key].cancelled]),
    ])

  return (
    <MetricCard
      title={t('raportet.movements.title')}
      definition={t('raportet.movements.definition')}
      basis={t('raportet.basis.mixed')}
      icon={<IconArrive />}
      onExport={exportCsv}
    >
      <div className={s.tableWrap}>
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col">{t('raportet.metric')}</th>
              <th scope="col" className={s.num}>
                {t('raportet.movements.count')}
              </th>
              <th scope="col" className={s.num}>
                {t('raportet.movements.noShow')}
              </th>
              <th scope="col" className={s.num}>
                {t('raportet.movements.cancelled')}
              </th>
            </tr>
          </thead>
          <tbody>
            {KEYS.map((key) => (
              <tr key={key}>
                <th scope="row">
                  <span className={s.rowTitle}>{t(`raportet.movements.${key}.title`)}</span>
                  <span className={s.rowHint}>{t(`raportet.movements.${key}.definition`)}</span>
                </th>
                <td className={s.num}>{movements[key].count}</td>
                <td className={s.num}>{movements[key].noShow}</td>
                <td className={s.num}>{movements[key].cancelled}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={s.note}>{t('raportet.movements.cancelledNote')}</p>
    </MetricCard>
  )
}
