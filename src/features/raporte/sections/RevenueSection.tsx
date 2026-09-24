import { useTranslation } from 'react-i18next'
import { downloadReportCsv, type ReportPreset, useRevenueReport } from '@/lib/api/reports'
import { useMoney } from '@/lib/format/useMoney'
import { useUiStore } from '@/store/uiStore'
import { Button } from '@/components/ui/Button/Button'
import s from '../RaportePage.module.scss'

export function RevenueSection({ preset }: { preset: ReportPreset }) {
  const { t } = useTranslation()
  const showToast = useUiStore((state) => state.showToast)
  const money = useMoney()
  const revenue = useRevenueReport(preset)

  return (
    <section className={s.card}>
      <div className={s.head}>
        <h2>{t('reports.revenue')}</h2>
        <Button variant="secondary" onClick={() => downloadReportCsv('revenue', preset).catch(() => showToast([t('toast.failed')]))}>
          {t('reports.exportCsv')}
        </Button>
      </div>
      <p className={s.note}>{revenue.data?.note ?? t('reports.revenueNote')}</p>
      <p className={s.kpi}>{money(revenue.data?.totalCents ?? 0)}</p>
      <div className={s.split}>
        <span>{t('reports.roomRevenue')}</span>
        <strong>{money(revenue.data?.roomCents ?? 0)}</strong>
      </div>
      <div className={s.split}>
        <span>{t('reports.extraRevenue')}</span>
        <strong>{money(revenue.data?.extraCents ?? 0)}</strong>
      </div>
      <ul className={s.list}>
        {(revenue.data?.byCategory ?? []).map((row) => (
          <li key={row.code}>
            <span>{row.name}</span>
            <strong>{money(row.amountCents)}</strong>
          </li>
        ))}
      </ul>
    </section>
  )
}
