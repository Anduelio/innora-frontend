import clsx from 'clsx'
import s from './KpiCard.module.scss'

type Dot = 'accent' | 'muted' | 'reserved' | 'warn'

export function KpiCard({
  label,
  value,
  note,
  dot,
}: {
  label: string
  value: number | string
  note: string
  dot: Dot
}) {
  return (
    <article className={s.card}>
      <p className={s.label}>
        <span className={clsx(s.dot, s[dot])} />
        {label}
      </p>
      <p className={s.value}>{value}</p>
      <p className={s.note}>{note}</p>
    </article>
  )
}
