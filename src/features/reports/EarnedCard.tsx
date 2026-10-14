import { useTranslation } from 'react-i18next'
import {
  amountIn,
  centsToDecimal,
  orderCurrencies,
  type CurrencySeries,
  type EarnedReport,
  type ReportPeriod,
} from '@/lib/reports'
import { IconChart } from '@/components/atoms/Icon/icons'
import { formatCompact } from '@/components/molecules/Chart/scale'
import { ColumnChart } from '@/components/molecules/Chart/ColumnChart'
import { formatMoney } from '@/lib/format/money'
import { Money } from '@/components/atoms/Money/Money'
import { seriesToColumns } from '@/features/reports/chartData'
import { csvFileName, downloadCsv } from '@/features/reports/csv'
import { MetricCard } from '@/features/reports/MetricCard'
import s from './report.module.scss'

export function EarnedCard({
  earned,
  series,
  period,
}: {
  earned: EarnedReport
  series: CurrencySeries[]
  period: ReportPeriod
}) {
  const { t } = useTranslation()
  const months = t('calendar.months', { returnObjects: true }) as string[]
  const currencies = orderCurrencies(earned.totals.map((item) => item.currency))
  const monthsShort = t('calendar.monthsShort', { returnObjects: true }) as string[]
  const monthLabel = (iso: string) => `${months[Number(iso.slice(5, 7)) - 1] ?? ''} ${iso.slice(0, 4)}`

  const exportCsv = () =>
    downloadCsv(csvFileName('te-ardhura', period), [
      [t('raportet.monthCol'), ...currencies.map((currency) => t('raportet.valueCol', { currency }))],
      ...earned.byMonth.map((row) => [
        monthLabel(row.month),
        ...currencies.map((currency) => centsToDecimal(amountIn(row.amounts, currency))),
      ]),
      [t('common.total'), ...currencies.map((currency) => centsToDecimal(amountIn(earned.totals, currency)))],
    ])

  return (
    <MetricCard
      title={t('raportet.earned.title')}
      definition={t('raportet.earned.definition')}
      basis={t('raportet.basis.night')}
      icon={<IconChart />}
      onExport={earned.nights > 0 ? exportCsv : undefined}
      wide
    >
      {earned.nights === 0 && series.length === 0 ? (
        <p className={s.muted}>{t('raportet.earned.empty')}</p>
      ) : (
        <>
          {series.map((item) => {
            const { data, monthly } = seriesToColumns(item.days, { months, monthsShort })
            return (
              <div key={item.currency} className={s.section}>
                <p className={s.sectionTitle}>
                  {item.currency} · {monthly ? t('raportet.charts.perMonth') : t('raportet.charts.perDay')}
                </p>
                <ColumnChart
                  data={data}
                  ariaLabel={t('raportet.charts.labelCurrency', {
                    title: t('raportet.earned.title'),
                    currency: item.currency,
                  })}
                  formatValue={(value) => formatMoney(value, item.currency)}
                  formatTick={(value) => formatCompact(value / 100)}
                  tone="success"
                  legend={{
                    now: t('raportet.charts.earnedLegend'),
                    future: t('raportet.charts.forecastLegend'),
                  }}
                  futureNote={t('raportet.charts.forecastNote')}
                  headers={[monthly ? t('raportet.monthCol') : t('raportet.nightCol'), item.currency]}
                />
              </div>
            )
          })}
          <div className={`${s.tableWrap} ${s.section}`}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">{t('raportet.monthCol')}</th>
                  {currencies.map((currency) => (
                    <th key={currency} scope="col" className={s.num}>
                      {currency}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {earned.byMonth.map((row) => (
                  <tr key={row.month}>
                    <th scope="row">{monthLabel(row.month)}</th>
                    {currencies.map((currency) => (
                      <td key={currency} className={s.num}>
                        <Money cents={amountIn(row.amounts, currency)} currency={currency} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">
                    {t('common.total')}
                    <span className={s.rowHint}>
                      {t('raportet.earned.nights')}: {earned.nights}
                    </span>
                  </th>
                  {currencies.map((currency) => (
                    <td key={currency} className={s.num}>
                      <Money cents={amountIn(earned.totals, currency)} currency={currency} strong />
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </MetricCard>
  )
}
