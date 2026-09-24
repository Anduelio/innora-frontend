import { useTranslation } from 'react-i18next'
import { useDailyReport } from '@/lib/api/reports'
import { useMoney } from '@/lib/format/useMoney'
import { DateField } from '@/components/ui/DateField/DateField'
import { Field } from '@/components/ui/Field/Field'
import s from '../RaportePage.module.scss'

export function DailySection({ date, onDate }: { date: string; onDate: (value: string) => void }) {
  const { t } = useTranslation()
  const money = useMoney()
  const daily = useDailyReport(date)

  return (
    <section className={s.card}>
      <h2>{t('reports.daily')}</h2>
      <Field label={t('reports.daily')} htmlFor="report-day">
        <DateField id="report-day" mode="date" value={date} onChange={onDate} />
      </Field>
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
          <strong>{money(daily.data?.finance.revenueCents ?? 0)}</strong>
        </div>
        <div>
          <span>{t('reports.paymentsToday')}</span>
          <strong>{money(daily.data?.finance.paymentsCents ?? 0)}</strong>
        </div>
        <div>
          <span>{t('reports.dueToday')}</span>
          <strong>{money(daily.data?.finance.outstandingCents ?? 0)}</strong>
        </div>
      </div>
    </section>
  )
}
