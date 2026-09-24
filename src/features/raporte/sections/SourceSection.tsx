import { useTranslation } from 'react-i18next'
import { type ReportPreset, useSourceReport } from '@/lib/api/reports'
import { useMoney } from '@/lib/format/useMoney'
import s from '../RaportePage.module.scss'

export function SourceSection({ preset }: { preset: ReportPreset }) {
  const { t } = useTranslation()
  const money = useMoney()
  const source = useSourceReport(preset)

  return (
    <section className={s.card}>
      <h2>{t('reports.source')}</h2>
      <ul className={s.list}>
        {(source.data?.bySource ?? []).map((row) => (
          <li key={row.source}>
            <span>{row.source}</span>
            <strong>{money(row.amountCents)}</strong>
          </li>
        ))}
      </ul>
    </section>
  )
}
