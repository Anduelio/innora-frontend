import { useTranslation } from 'react-i18next'
import { amountIn, centsToDecimal, formatPercent, type ChannelRow, type ReportPeriod } from '@/lib/reports'
import { IconBooking } from '@/components/atoms/Icon/icons'
import { Money } from '@/components/atoms/Money/Money'
import { SourceBadge } from '@/components/molecules/SourceBadge/SourceBadge'
import { csvFileName, downloadCsv } from '@/features/raportet/csv'
import { MetricCard } from '@/features/raportet/MetricCard'
import s from './report.module.scss'

export function ChannelCard({
  channels,
  currencies,
  period,
}: {
  channels: ChannelRow[]
  currencies: string[]
  period: ReportPeriod
}) {
  const { t } = useTranslation()
  const total = channels.reduce((sum, row) => sum + row.count, 0)
  const share = (count: number) => (total > 0 ? count / total : null)
  const direct = channels.filter((row) => row.source !== 'BOOKING')
  const directCount = direct.reduce((sum, row) => sum + row.count, 0)

  const exportCsv = () =>
    downloadCsv(csvFileName('burimet', period), [
      [t('raportet.filters.source'), t('raportet.channels.count'), t('raportet.channels.cancelled'), ...currencies.map((currency) => t('raportet.valueCol', { currency }))],
      ...channels.map((row) => [
        t(`source.${row.source}`),
        row.count,
        row.cancelled,
        ...currencies.map((currency) => centsToDecimal(amountIn(row.value, currency))),
      ]),
    ])

  return (
    <MetricCard
      title={t('raportet.channels.title')}
      definition={t('raportet.channels.definition')}
      basis={t('raportet.basis.checkIn')}
      icon={<IconBooking />}
      onExport={total ? exportCsv : undefined}
      wide
    >
      {total === 0 && channels.every((row) => row.cancelled === 0) ? (
        <p className={s.muted}>{t('raportet.channels.empty')}</p>
      ) : (
        <>
          <ul className={s.bars}>
            {channels.map((row) => (
              <li
                key={row.source}
                className={s.bar}
                aria-label={t('raportet.channels.barLabel', { source: t(`source.${row.source}`), share: formatPercent(share(row.count)) })}
              >
                <span className={s.barLabel}>{t(`source.${row.source}`)}</span>
                <span className={s.track} aria-hidden="true">
                  <span
                    className={`${s.fill} ${row.source === 'BOOKING' ? s.booking : s.direct}`}
                    style={{ inlineSize: `${(share(row.count) ?? 0) * 100}%` }}
                  />
                </span>
                <span className={s.barValue}>{formatPercent(share(row.count))}</span>
              </li>
            ))}
          </ul>
          <div className={`${s.tableWrap} ${s.section}`}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">{t('raportet.filters.source')}</th>
                  <th scope="col" className={s.num}>
                    {t('raportet.channels.count')}
                  </th>
                  <th scope="col" className={s.num}>
                    {t('raportet.channels.cancelled')}
                  </th>
                  {currencies.map((currency) => (
                    <th key={currency} scope="col" className={s.num}>
                      {t('raportet.valueCol', { currency })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {channels.map((row) => (
                  <tr key={row.source}>
                    <th scope="row">
                      <SourceBadge source={row.source} />
                    </th>
                    <td className={s.num}>{row.count}</td>
                    <td className={s.num}>{row.cancelled}</td>
                    {currencies.map((currency) => (
                      <td key={currency} className={s.num}>
                        <Money cents={amountIn(row.value, currency)} currency={currency} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th scope="row">{t('raportet.channels.direct')}</th>
                  <td className={s.num}>
                    {directCount} · {formatPercent(share(directCount))}
                  </td>
                  <td className={s.num}>{direct.reduce((sum, row) => sum + row.cancelled, 0)}</td>
                  {currencies.map((currency) => (
                    <td key={currency} className={s.num}>
                      <Money cents={direct.reduce((sum, row) => sum + amountIn(row.value, currency), 0)} currency={currency} />
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
