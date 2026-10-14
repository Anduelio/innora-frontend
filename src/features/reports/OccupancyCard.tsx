import { useTranslation } from 'react-i18next'
import { fmtDate, fmtDayMonth } from '@/lib/date/calendar'
import { formatPercent, occupancyByMonth, type OccupancyReport, type ReportPeriod } from '@/lib/reports'
import { IconBed } from '@/components/atoms/Icon/icons'
import { ColumnChart } from '@/components/molecules/Chart/ColumnChart'
import { TrendChart } from '@/components/molecules/Chart/TrendChart'
import { csvFileName, downloadCsv } from '@/features/reports/csv'
import { MetricCard } from '@/features/reports/MetricCard'
import s from './report.module.scss'

export function OccupancyCard({
  occupancy,
  period,
  today,
}: {
  occupancy: OccupancyReport
  period: ReportPeriod
  today: string
}) {
  const { t } = useTranslation()
  const months = t('calendar.months', { returnObjects: true }) as string[]
  const monthsShort = t('calendar.monthsShort', { returnObjects: true }) as string[]
  const perNight = occupancy.nights.length <= 31
  const rows = perNight
    ? occupancy.nights.map((night) => ({
        key: night.day,
        label: fmtDayMonth(night.day),
        shortLabel: fmtDayMonth(night.day),
        title: fmtDate(night.day),
        sold: night.sold,
        available: night.available,
        future: night.day > today,
      }))
    : occupancyByMonth(occupancy.nights).map((month) => ({
        key: month.month,
        label: `${months[Number(month.month.slice(5, 7)) - 1] ?? ''} ${month.month.slice(0, 4)}`,
        shortLabel: monthsShort[Number(month.month.slice(5, 7)) - 1] ?? '',
        title: `${months[Number(month.month.slice(5, 7)) - 1] ?? ''} ${month.month.slice(0, 4)}`,
        sold: month.sold,
        available: month.available,
        future: month.month > today,
      }))

  const exportCsv = () =>
    downloadCsv(csvFileName('zenia', period), [
      [
        t('raportet.nightCol'),
        t('raportet.occupancy.sold'),
        t('raportet.occupancy.available'),
        t('raportet.occupancy.blocked'),
        t('raportet.occupancy.csvRate'),
      ],
      ...occupancy.nights.map((night) => [
        fmtDate(night.day),
        night.sold,
        night.available,
        night.blocked,
        night.available > 0 ? ((night.sold / night.available) * 100).toFixed(1).replace('.', ',') : '',
      ]),
    ])

  return (
    <MetricCard
      title={t('raportet.occupancy.title')}
      definition={t('raportet.occupancy.definition')}
      basis={t('raportet.basis.night')}
      icon={<IconBed />}
      onExport={exportCsv}
      wide
    >
      {occupancy.activeRooms === 0 ? (
        <p className={s.muted}>{t('raportet.occupancy.noRooms')}</p>
      ) : (
        <>
          <dl className={s.miniStats}>
            {[
              [t('raportet.occupancy.title'), formatPercent(occupancy.rate), true],
              [t('raportet.occupancy.rooms'), occupancy.activeRooms, false],
              [t('raportet.occupancy.sold'), occupancy.sold, false],
              [t('raportet.occupancy.available'), occupancy.available, false],
              [t('raportet.occupancy.blocked'), occupancy.blocked, false],
            ].map(([label, value, emphasis]) => (
              <div key={String(label)} className={emphasis ? s.miniEmphasis : undefined}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className={s.section}>
            <p className={s.sectionTitle}>
              {perNight ? t('raportet.occupancy.perNight') : t('raportet.occupancy.perMonth')}
            </p>
            {perNight && rows.length > 1 ? (
              <TrendChart
                data={rows.map((row) => ({
                  key: row.key,
                  label: row.label,
                  title: row.title,
                  value: row.available > 0 ? row.sold / row.available : null,
                  future: row.future,
                  note: t('raportet.charts.occupancyTip', {
                    sold: row.sold,
                    available: row.available,
                  }),
                }))}
                ariaLabel={t('raportet.charts.label', { title: t('raportet.occupancy.title') })}
                formatValue={formatPercent}
                formatTick={(value) => formatPercent(value)}
                tone="accent"
                reference={
                  occupancy.rate === null ? undefined : { value: occupancy.rate, label: formatPercent(occupancy.rate) }
                }
                legend={{
                  now: t('raportet.charts.occupancyNow'),
                  future: t('raportet.charts.occupancyFuture'),
                  reference: t('raportet.charts.average'),
                }}
                headers={[t('raportet.nightCol'), t('raportet.occupancy.title')]}
              />
            ) : (
              <ColumnChart
                data={rows.map((row) => ({
                  key: row.key,
                  label: row.shortLabel,
                  title: row.title,
                  value: row.available > 0 ? row.sold / row.available : 0,
                  future: row.future,
                  note: t('raportet.charts.occupancyTip', {
                    sold: row.sold,
                    available: row.available,
                  }),
                }))}
                ariaLabel={t('raportet.charts.label', { title: t('raportet.occupancy.title') })}
                formatValue={formatPercent}
                formatTick={(value) => formatPercent(value)}
                minMax={1}
                legend={{
                  now: t('raportet.charts.occupancyNow'),
                  future: t('raportet.charts.occupancyFuture'),
                }}
                futureNote={t('raportet.charts.occupancyFuture')}
                headers={[perNight ? t('raportet.nightCol') : t('raportet.monthCol'), t('raportet.occupancy.title')]}
              />
            )}
          </div>
        </>
      )}
    </MetricCard>
  )
}
