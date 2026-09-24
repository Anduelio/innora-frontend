import { useTranslation } from 'react-i18next'
import { type ReportPreset, useSourceReport } from '@/lib/api/reports'
import { formatEuro } from '@/lib/format/money'
import s from '../RaportePage.module.scss'

export function SourceSection({ preset }: { preset: ReportPreset }) {
  const { t } = useTranslation()
  const source = useSourceReport(preset)

  return (
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
  )
}
