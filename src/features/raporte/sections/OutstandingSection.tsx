import { useTranslation } from 'react-i18next'
import { downloadReportCsv, type ReportPreset, useOutstandingReport } from '@/lib/api/reports'
import { formatEuro } from '@/lib/format/money'
import { useUiStore } from '@/store/uiStore'
import { Button } from '@/components/ui/Button/Button'
import s from '../RaportePage.module.scss'

export function OutstandingSection({ preset }: { preset: ReportPreset }) {
  const { t } = useTranslation()
  const openFolio = useUiStore((state) => state.openFolio)
  const showToast = useUiStore((state) => state.showToast)
  const outstanding = useOutstandingReport()

  return (
    <section className={s.card}>
      <div className={s.head}>
        <h2>{t('reports.outstanding')}</h2>
        <Button variant="secondary" onClick={() => downloadReportCsv('outstanding', preset).catch(() => showToast([t('toast.failed')]))}>
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
  )
}
