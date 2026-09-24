import { useTranslation } from 'react-i18next'
import { type ReportPreset, useOccupancyReport } from '@/lib/api/reports'
import { useMoney } from '@/lib/format/useMoney'
import s from '../RaportePage.module.scss'

export function OccupancySection({ preset }: { preset: ReportPreset }) {
  const { t } = useTranslation()
  const money = useMoney()
  const occupancy = useOccupancyReport(preset)

  return (
    <section className={s.card}>
      <h2>{t('reports.occupancy')}</h2>
      <div className={s.grid}>
        <div>
          <span>{t('reports.occupancyPct')}</span>
          <strong>{Math.round((occupancy.data?.occupancy ?? 0) * 100)}%</strong>
        </div>
        <div>
          <span>ADR</span>
          <strong>{money(occupancy.data?.adrCents ?? 0)}</strong>
        </div>
        <div>
          <span>RevPAR</span>
          <strong>{money(occupancy.data?.revparCents ?? 0)}</strong>
        </div>
        <div>
          <span>{t('reports.roomsSold')}</span>
          <strong>{occupancy.data?.roomsSold ?? 0}</strong>
        </div>
      </div>
      <p className={s.note}>{occupancy.data?.formulas.occupancy}</p>
    </section>
  )
}
