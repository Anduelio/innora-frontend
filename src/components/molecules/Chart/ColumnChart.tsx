import { useId, useState } from 'react'
import clsx from 'clsx'
import { arrowNavigation, ChartLegend, ChartTable, ChartTooltip, TONE_VAR, type ChartTone } from './ChartParts'
import { formatCompact, labelEvery, niceTicks } from './scale'
import { useChartWidth } from './useChartWidth'
import s from './Chart.module.scss'

export interface ColumnDatum {
  key: string
  /** Etiketa e shkurtër në bosht. */
  label: string
  /** Titulli i plotë te këshilla dhe tabela. */
  title: string
  value: number
  /** Dita ende nuk ka ndodhur: vizatohet me vija. */
  future?: boolean
  note?: string
}

export function ColumnChart({
  data,
  ariaLabel,
  formatValue,
  formatTick = (value) => formatCompact(value),
  tone = 'accent',
  height = 232,
  minMax = 0,
  legend,
  futureNote,
  headers,
}: {
  data: readonly ColumnDatum[]
  ariaLabel: string
  formatValue: (value: number) => string
  formatTick?: (value: number) => string
  tone?: ChartTone
  height?: number
  /** Kufiri i sipërm minimal i boshtit (p.sh. 1 për përqindje). */
  minMax?: number
  legend?: { now: string; future?: string }
  futureNote?: string
  headers: [string, string]
}) {
  const id = useId()
  const { ref, width } = useChartWidth()
  const [active, setActive] = useState<number | null>(null)

  const values = data.map((item) => item.value)
  const ticks = niceTicks(Math.min(0, ...values), Math.max(minMax, ...values, 0), 4)
  const yMin = ticks[0] ?? 0
  const yMax = ticks[ticks.length - 1] ?? 1
  const tickLabels = ticks.map(formatTick)
  const margin = {
    top: 12,
    right: 8,
    bottom: 30,
    left: Math.max(...tickLabels.map((label) => label.length), 2) * 7 + 14,
  }
  const plotW = Math.max(40, width - margin.left - margin.right)
  const plotH = height - margin.top - margin.bottom
  const band = plotW / Math.max(1, data.length)
  const barW = Math.min(Math.max(band * 0.66, 3), 40)
  const y = (value: number) => margin.top + plotH * (1 - (value - yMin) / (yMax - yMin || 1))
  const zero = y(0)
  const every = labelEvery(data.length, band)
  const hasFuture = data.some((item) => item.future)
  const current = active === null ? null : (data[active] ?? null)

  const indexAt = (clientX: number, element: Element) => {
    const box = element.getBoundingClientRect()
    return Math.min(data.length - 1, Math.max(0, Math.floor((clientX - box.left) / band)))
  }

  return (
    <div ref={ref} className={s.chart} style={{ '--tone': TONE_VAR[tone] } as React.CSSProperties}>
      <div
        className={s.plot}
        role="group"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-roledescription="grafik"
        onKeyDown={(event) => arrowNavigation(event, data.length, active, setActive)}
        onBlur={() => setActive(null)}
        style={{ blockSize: height }}
      >
        <svg width={width} height={height} aria-hidden="true" focusable="false">
          <defs>
            <pattern
              id={`${id}-stripes`}
              width="6"
              height="6"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="6" height="6" className={s.stripeBg} />
              <line x1="0" y1="0" x2="0" y2="6" className={s.stripeLine} />
            </pattern>
          </defs>
          {ticks.map((tick, index) => (
            <g key={tick}>
              <line
                x1={margin.left}
                x2={width - margin.right}
                y1={y(tick)}
                y2={y(tick)}
                className={tick === 0 ? s.baseline : s.grid}
              />
              <text x={margin.left - 8} y={y(tick)} dy="0.32em" textAnchor="end" className={s.tick}>
                {tickLabels[index]}
              </text>
            </g>
          ))}
          {active !== null ? (
            <rect x={margin.left + active * band} y={margin.top} width={band} height={plotH} className={s.hover} />
          ) : null}
          {data.map((item, index) => {
            const top = Math.min(y(item.value), zero)
            const h = item.value === 0 ? 0 : Math.max(Math.abs(y(item.value) - zero), 2)
            const x = margin.left + index * band + (band - barW) / 2
            return (
              <rect
                key={item.key}
                x={x}
                y={top}
                width={barW}
                height={h}
                rx={Math.min(4, barW / 2)}
                className={clsx(s.bar, item.future && s.barFuture, active !== null && active !== index && s.dim)}
                fill={item.future ? `url(#${id}-stripes)` : undefined}
              />
            )
          })}
          {data.map((item, index) =>
            index % every === 0 ? (
              <text
                key={item.key}
                x={margin.left + (index + 0.5) * band}
                y={height - 9}
                textAnchor="middle"
                className={s.tick}
              >
                {item.label}
              </text>
            ) : null,
          )}
          <rect
            x={margin.left}
            y={margin.top}
            width={plotW}
            height={plotH}
            fill="transparent"
            onPointerMove={(event) => setActive(indexAt(event.clientX, event.currentTarget))}
            onPointerDown={(event) => setActive(indexAt(event.clientX, event.currentTarget))}
            onPointerLeave={(event) => {
              if (event.pointerType === 'mouse') setActive(null)
            }}
          />
        </svg>
        {current ? (
          <ChartTooltip
            x={margin.left + ((active ?? 0) + 0.5) * band}
            width={width}
            title={current.title}
            value={formatValue(current.value)}
            note={current.future && futureNote ? futureNote : current.note}
          />
        ) : null}
      </div>
      <p className={s.srOnly} aria-live="polite">
        {current ? `${current.title}: ${formatValue(current.value)}` : ''}
      </p>
      {legend ? (
        <ChartLegend
          items={[
            { label: legend.now, kind: 'solid' },
            ...(hasFuture && legend.future ? [{ label: legend.future, kind: 'striped' as const }] : []),
          ]}
        />
      ) : null}
      <ChartTable
        caption={ariaLabel}
        headers={headers}
        rows={data.map((item): [string, string] => [item.title, formatValue(item.value)])}
      />
    </div>
  )
}
