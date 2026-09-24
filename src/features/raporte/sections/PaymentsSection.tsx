import { useTranslation } from 'react-i18next'
import { downloadReportCsv, type ReportPreset, usePaymentsReport } from '@/lib/api/reports'
import { useMoney } from '@/lib/format/useMoney'
import { useUiStore } from '@/store/uiStore'
import { Button } from '@/components/ui/Button/Button'
import s from '../RaportePage.module.scss'

export function PaymentsSection({ preset }: { preset: ReportPreset }) {
  const { t } = useTranslation()
  const showToast = useUiStore((state) => state.showToast)
  const money = useMoney()
  const payments = usePaymentsReport(preset)

  return (
    <section className={s.card}>
      <div className={s.head}>
        <h2>{t('reports.payments')}</h2>
        <Button variant="secondary" onClick={() => downloadReportCsv('payments', preset).catch(() => showToast([t('toast.failed')]))}>
          {t('reports.exportCsv')}
        </Button>
      </div>
      <p className={s.note}>{payments.data?.note ?? t('reports.paymentsNote')}</p>
      <p className={s.kpi}>{money(payments.data?.totalCents ?? 0)}</p>
      <ul className={s.list}>
        {(payments.data?.byMethod ?? []).map((row) => (
          <li key={row.method}>
            <span>{t(`folio.methods.${row.method}`, { defaultValue: row.method })}</span>
            <strong>{money(row.amountCents)}</strong>
          </li>
        ))}
      </ul>
    </section>
  )
}
