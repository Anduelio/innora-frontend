import { useTranslation } from 'react-i18next'
import { fmtDate, fmtDayMonth } from '@/lib/date/calendar'
import { formatPercent, occupancyByMonth, type OccupancyReport, type ReportPeriod } from '@/lib/reports'
import { IconBed } from '@/components/atoms/Icon/icons'
import { DescriptionList } from '@/components/molecules/DescriptionList/DescriptionList'
import { csvFileName, downloadCsv } from '@/features/raportet/csv'
import { MetricCard } from '@/features/raportet/MetricCard'
import s from './report.module.scss'

export function OccupancyCard({ occupancy, period, today }: { occupancy: OccupancyReport; period: ReportPeriod; today: string }) {
  const { t } = useTranslation()
  const months = t('calendar.months', { returnObjects: true }) as string[]
  const perNight = occupancy.nights.length <= 31
  const rows = perNight
    ? occupancy.nights.map((night) => ({
        key: night.day,
        label: fmtDayMonth(night.day),
        sold: night.sold,
        available: night.available,
        future: night.day > today,
      }))
    : occupancyByMonth(occupancy.nights).map((month) => ({
        key: month.month,
        label: `${months[Number(month.month.slice(5, 7)) - 1] ?? ''} ${month.month.slice(0, 4)}`,
        sold: month.sold,
        available: month.available,
        future: month.month > today,
      }))

  const exportCsv = () =>
    downloadCsv(csvFileName('zenia', period), [
      [t('raportet.nightCol'), t('raportet.occupancy.sold'), t('raportet.occupancy.available'), t('raportet.occupancy.blocked'), t('raportet.occupancy.csvRate')],
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
    >
      {occupancy.activeRooms === 0 ? (
        <p className={s.muted}>{t('raportet.occupancy.noRooms')}</p>
      ) : (
        <>
          <DescriptionList
            columns={2}
            items={[
              { label: t('raportet.occupancy.title'), value: formatPercent(occupancy.rate), emphasis: true },
              { label: t('raportet.occupancy.rooms'), value: occupancy.activeRooms },
              { label: t('raportet.occupancy.sold'), value: occupancy.sold },
              { label: t('raportet.occupancy.available'), value: occupancy.available },
              { label: t('raportet.occupancy.blocked'), value: occupancy.blocked },
            ]}
          />
          <div className={s.section}>
            <p className={s.sectionTitle}>{perNight ? t('raportet.occupancy.perNight') : t('raportet.occupancy.perMonth')}</p>
            <ul className={s.bars}>
              {rows.map((row) => {
                const rate = row.available > 0 ? row.sold / row.available : null
                return (
                  <li
                    key={row.key}
                    className={s.bar}
                    aria-label={t('raportet.occupancy.barLabel', { label: row.label, rate: formatPercent(rate), sold: row.sold, available: row.available })}
                  >
                    <span className={s.barLabel}>{row.label}</span>
                    <span className={s.track} aria-hidden="true">
                      <span className={`${s.fill} ${row.future ? s.future : ''}`} style={{ inlineSize: `${Math.min(100, (rate ?? 0) * 100)}%` }} />
                    </span>
                    <span className={s.barValue}>{formatPercent(rate)}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </>
      )}
    </MetricCard>
  )
}
