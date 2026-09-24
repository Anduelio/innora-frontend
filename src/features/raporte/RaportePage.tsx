import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { downloadReportCsv, type ReportPreset, useDailyReport, useOccupancyReport, useOutstandingReport, usePaymentsReport, useRevenueReport, useSourceReport } from '@/lib/api/reports'
import { formatEuro } from '@/lib/format/money'
import { TODAY } from '@/lib/date/today'
import { useUiStore } from '@/store/uiStore'
import { Button } from '@/components/ui/Button/Button'
import { SegmentedControl } from '@/components/ui/SegmentedControl/SegmentedControl'
import s from './RaportePage.module.scss'

const presets: ReportPreset[] = ['today', 'this_week', 'this_month', 'last_month']

export function RaportePage() {
  const { t } = useTranslation()
  const [preset, setPreset] = useState<ReportPreset>('this_month')
  const openFolio = useUiStore((state) => state.openFolio)
  const showToast = useUiStore((state) => state.showToast)
  const revenue = useRevenueReport(preset)
  const payments = usePaymentsReport(preset)
  const outstanding = useOutstandingReport()
  const source = useSourceReport(preset)
  const daily = useDailyReport(TODAY)
  const occupancy = useOccupancyReport(preset)

  return (
    <div className={s.page}>
      <SegmentedControl
        label={t('reports.range')}
        value={preset}
        onChange={(value) => setPreset(value)}
        options={presets.map((item) => ({ value: item, label: t(`reports.presets.${item}`) }))}
      />

      <section className={s.card}>
        <div className={s.head}>
          <h2>{t('reports.revenue')}</h2>
          <Button
            variant="secondary"
            onClick={() =>
              downloadReportCsv('revenue', preset).catch(() => showToast([t('toast.failed')]))
            }
          >
            {t('reports.exportCsv')}
          </Button>
        </div>
        <p className={s.note}>{revenue.data?.note ?? t('reports.revenueNote')}</p>
        <p className={s.kpi}>{formatEuro(revenue.data?.totalCents ?? 0)}</p>
        <div className={s.split}>
          <span>{t('reports.roomRevenue')}</span>
          <strong>{formatEuro(revenue.data?.roomCents ?? 0)}</strong>
        </div>
        <div className={s.split}>
          <span>{t('reports.extraRevenue')}</span>
          <strong>{formatEuro(revenue.data?.extraCents ?? 0)}</strong>
        </div>
        <ul className={s.list}>
          {(revenue.data?.byCategory ?? []).map((row) => (
            <li key={row.code}>
              <span>{row.name}</span>
              <strong>{formatEuro(row.amountCents)}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className={s.card}>
        <div className={s.head}>
          <h2>{t('reports.payments')}</h2>
          <Button
            variant="secondary"
            onClick={() =>
              downloadReportCsv('payments', preset).catch(() => showToast([t('toast.failed')]))
            }
          >
            {t('reports.exportCsv')}
          </Button>
        </div>
        <p className={s.note}>{payments.data?.note ?? t('reports.paymentsNote')}</p>
        <p className={s.kpi}>{formatEuro(payments.data?.totalCents ?? 0)}</p>
        <ul className={s.list}>
          {(payments.data?.byMethod ?? []).map((row) => (
            <li key={row.method}>
              <span>{t(`folio.methods.${row.method}`, { defaultValue: row.method })}</span>
              <strong>{formatEuro(row.amountCents)}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className={s.card}>
        <div className={s.head}>
          <h2>{t('reports.outstanding')}</h2>
          <Button
            variant="secondary"
            onClick={() =>
              downloadReportCsv('outstanding', preset).catch(() => showToast([t('toast.failed')]))
            }
          >
            {t('reports.exportCsv')}
          </Button>
        </div>
        <p className={s.kpi}>{formatEuro(outstanding.data?.totalBalanceCents ?? 0)}</p>
        <p className={s.note}>{t('reports.outstandingCount', { count: outstanding.data?.count ?? 0 })}</p>
        <ul className={s.list}>
          {(outstanding.data?.rows ?? []).map((row) => (
            <li key={row.folioId}>
              <button type="button" className={s.link} onClick={() => openFolio(row.folioId)}>
                {row.guestName} · {row.folioNumber}
              </button>
              <strong>{formatEuro(row.balanceCents)}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className={s.card}>
        <h2>{t('reports.source')}</h2>
        <ul className={s.list}>
          {(source.data?.bySource ?? []).map((row) => (
            <li key={row.source}>
              <span>{row.source}</span>
              <strong>{formatEuro(row.amountCents)}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className={s.card}>
        <h2>{t('reports.daily')}</h2>
        <p className={s.note}>{daily.data?.date}</p>
        <div className={s.grid}>
          <div>
            <span>{t('reports.arrivals')}</span>
            <strong>{daily.data?.operations.arrivals ?? 0}</strong>
          </div>
          <div>
            <span>{t('reports.departures')}</span>
            <strong>{daily.data?.operations.departures ?? 0}</strong>
          </div>
          <div>
            <span>{t('reports.inHouse')}</span>
            <strong>{daily.data?.operations.inHouse ?? 0}</strong>
          </div>
          <div>
            <span>{t('reports.revenueToday')}</span>
            <strong>{formatEuro(daily.data?.finance.revenueCents ?? 0)}</strong>
          </div>
          <div>
            <span>{t('reports.paymentsToday')}</span>
            <strong>{formatEuro(daily.data?.finance.paymentsCents ?? 0)}</strong>
          </div>
          <div>
            <span>{t('reports.dueToday')}</span>
            <strong>{formatEuro(daily.data?.finance.outstandingCents ?? 0)}</strong>
          </div>
        </div>
      </section>

      <section className={s.card}>
        <h2>{t('reports.occupancy')}</h2>
        <div className={s.grid}>
          <div>
            <span>{t('reports.occupancyPct')}</span>
            <strong>{Math.round((occupancy.data?.occupancy ?? 0) * 100)}%</strong>
          </div>
          <div>
            <span>ADR</span>
            <strong>{formatEuro(occupancy.data?.adrCents ?? 0)}</strong>
          </div>
          <div>
            <span>RevPAR</span>
            <strong>{formatEuro(occupancy.data?.revparCents ?? 0)}</strong>
          </div>
          <div>
            <span>{t('reports.roomsSold')}</span>
            <strong>{occupancy.data?.roomsSold ?? 0}</strong>
          </div>
        </div>
        <p className={s.note}>{occupancy.data?.formulas.occupancy}</p>
      </section>
    </div>
  )
}
