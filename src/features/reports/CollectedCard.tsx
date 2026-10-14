import { useTranslation } from 'react-i18next'
import { PAYMENT_METHODS, type Payment, type Reservation } from '@/types/domain'
import { fmtDate } from '@/lib/date/calendar'
import {
  centsToDecimal,
  signedAmount,
  type CollectedReport,
  type CurrencySeries,
  type ReportPeriod,
} from '@/lib/reports'
import { IconWallet } from '@/components/atoms/Icon/icons'
import { ColumnChart } from '@/components/molecules/Chart/ColumnChart'
import { formatCompact } from '@/components/molecules/Chart/scale'
import { formatMoney } from '@/lib/format/money'
import { Money } from '@/components/atoms/Money/Money'
import { seriesToColumns } from '@/features/reports/chartData'
import { csvFileName, downloadCsv } from '@/features/reports/csv'
import { MetricCard } from '@/features/reports/MetricCard'
import s from './report.module.scss'

export function CollectedCard({
  collected,
  series,
  payments,
  period,
  filtered,
  reservationsById,
}: {
  collected: CollectedReport[]
  series: CurrencySeries[]
  payments: Payment[]
  period: ReportPeriod
  filtered: boolean
  reservationsById: Map<string, Reservation>
}) {
  const { t } = useTranslation()
  const months = t('calendar.months', { returnObjects: true }) as string[]
  const monthsShort = t('calendar.monthsShort', { returnObjects: true }) as string[]

  const exportCsv = () =>
    downloadCsv(csvFileName('arketime', period), [
      [
        t('raportet.dateCol'),
        t('raportet.collected.csvGuest'),
        t('raportet.collected.csvCode'),
        t('raportet.collected.csvKind'),
        t('raportet.collected.csvMethod'),
        t('raportet.currencyCol'),
        t('raportet.amountCol'),
        t('raportet.collected.csvBy'),
      ],
      ...payments.map((payment) => [
        fmtDate(payment.paidAt),
        payment.guestName,
        reservationsById.get(payment.reservationId)?.code ?? '',
        t(`pay.kinds.${payment.kind}`),
        t(`pay.methods.${payment.method}`),
        payment.currency,
        centsToDecimal(signedAmount(payment)),
        payment.recordedBy,
      ]),
    ])

  return (
    <MetricCard
      title={t('raportet.collected.title')}
      definition={t('raportet.collected.definition')}
      basis={t('raportet.basis.payment')}
      icon={<IconWallet />}
      onExport={payments.length ? exportCsv : undefined}
      wide
    >
      {collected.length === 0 ? (
        <p className={s.muted}>{t('raportet.collected.empty')}</p>
      ) : (
        collected.map((group) => (
          <div key={group.currency} className={s.section}>
            <p className={s.sectionTitle}>
              {group.currency} · {t('raportet.collected.count', { count: group.count })}
            </p>
            {(() => {
              const item = series.find((entry) => entry.currency === group.currency)
              if (!item) return null
              const { data, monthly } = seriesToColumns(item.days, { months, monthsShort })
              return (
                <div className={s.chartGap}>
                  <ColumnChart
                    data={data}
                    ariaLabel={t('raportet.charts.labelCurrency', {
                      title: t('raportet.collected.title'),
                      currency: group.currency,
                    })}
                    formatValue={(value) => formatMoney(value, group.currency)}
                    formatTick={(value) => formatCompact(value / 100)}
                    tone="accent"
                    height={200}
                    legend={{ now: t('raportet.charts.collectedLegend') }}
                    headers={[monthly ? t('raportet.monthCol') : t('raportet.dateCol'), group.currency]}
                  />
                </div>
              )
            })()}
            <div className={s.tableWrap}>
              <table className={s.table}>
                <tbody>
                  {PAYMENT_METHODS.filter((method) => group.payments[method] !== 0).map((method) => (
                    <tr key={method}>
                      <th scope="row">{t(`pay.methods.${method}`)}</th>
                      <td className={s.num}>
                        <Money cents={group.payments[method]} currency={group.currency} />
                      </td>
                    </tr>
                  ))}
                  {group.refundsCents !== 0 ? (
                    <tr>
                      <th scope="row">{t('raportet.collected.refunds')}</th>
                      <td className={`${s.num} ${s.negative}`}>
                        <Money cents={group.refundsCents} currency={group.currency} />
                      </td>
                    </tr>
                  ) : null}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">{t('raportet.collected.net')}</th>
                    <td className={s.num}>
                      <Money cents={group.netCents} currency={group.currency} strong />
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ))
      )}
      {filtered ? <p className={s.note}>{t('raportet.collected.filtered')}</p> : null}
    </MetricCard>
  )
}
