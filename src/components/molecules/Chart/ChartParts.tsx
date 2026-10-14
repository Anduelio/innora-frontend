import type { KeyboardEvent } from 'react'
import clsx from 'clsx'
import { clamp } from './scale'
import s from './Chart.module.scss'

export type ChartTone = 'accent' | 'success' | 'warning' | 'info' | 'violet'

export const TONE_VAR: Record<ChartTone, string> = {
  accent: 'var(--chart-1)',
  success: 'var(--chart-2)',
  warning: 'var(--chart-3)',
  info: 'var(--chart-1)',
  violet: 'var(--chart-4)',
}

export const SERIES_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
]

export function ChartTooltip({
  x,
  width,
  title,
  value,
  note,
}: {
  x: number
  width: number
  title: string
  value: string
  note?: string
}) {
  return (
    <div className={s.tooltip} style={{ insetInlineStart: clamp(x, 72, Math.max(72, width - 72)) }} role="presentation">
      <span className={s.tipTitle}>{title}</span>
      <span className={s.tipValue}>{value}</span>
      {note ? <span className={s.tipNote}>{note}</span> : null}
    </div>
  )
}

export function ChartLegend({ items }: { items: { label: string; kind: 'solid' | 'striped' | 'line' | 'dashed' }[] }) {
  return (
    <ul className={s.legend}>
      {items.map((item) => (
        <li key={item.label}>
          <span className={clsx(s.swatch, s[item.kind])} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

/** Tabelë e fshehur vizualisht: njësoj e dhëna e grafikut për lexuesit e ekranit. */
export function ChartTable({
  caption,
  headers,
  rows,
}: {
  caption: string
  headers: [string, string]
  rows: [string, string][]
}) {
  return (
    <table className={s.srOnly}>
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{headers[0]}</th>
          <th scope="col">{headers[1]}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th scope="row">{label}</th>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Shigjetat, Home dhe End lëvizin përgjatë pikave të grafikut. */
export function arrowNavigation(
  event: KeyboardEvent,
  count: number,
  active: number | null,
  setActive: (index: number | null) => void,
) {
  if (count === 0) return
  const last = count - 1
  const at = active ?? -1
  let next: number | null | undefined
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = at < 0 ? 0 : Math.min(last, at + 1)
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = at < 0 ? last : Math.max(0, at - 1)
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = last
  else if (event.key === 'Escape') next = null
  if (next === undefined) return
  event.preventDefault()
  setActive(next)
}
