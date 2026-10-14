import { useTranslation } from 'react-i18next'
import { PAYMENT_METHODS, type Payment, type Reservation } from '@/types/domain'
import { fmtDate } from '@/lib/date/calendar'
import { centsToDecimal, signedAmount, type CollectedReport, type ReportPeriod } from '@/lib/reports'
import { IconWallet } from '@/components/atoms/Icon/icons'
import { Money } from '@/components/atoms/Money/Money'
import { csvFileName, downloadCsv } from '@/features/raportet/csv'
import { MetricCard } from '@/features/raportet/MetricCard'
import s from './report.module.scss'

export function CollectedCard({
  collected,
  payments,
  period,
  filtered,
  reservationsById,
}: {
  collected: CollectedReport[]
  payments: Payment[]
  period: ReportPeriod
  filtered: boolean
  reservationsById: Map<string, Reservation>
}) {
  const { t } = useTranslation()

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
    >
      {collected.length === 0 ? (
        <p className={s.muted}>{t('raportet.collected.empty')}</p>
      ) : (
        collected.map((group) => (
          <div key={group.currency} className={s.section}>
            <p className={s.sectionTitle}>
              {group.currency} · {t('raportet.collected.count', { count: group.count })}
            </p>
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
