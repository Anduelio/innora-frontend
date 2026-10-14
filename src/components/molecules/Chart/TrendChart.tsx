import { useId, useState } from 'react'
import { arrowNavigation, ChartLegend, ChartTable, ChartTooltip, TONE_VAR, type ChartTone } from './ChartParts'
import { labelEvery, niceTicks } from './scale'
import { useChartWidth } from './useChartWidth'
import s from './Chart.module.scss'

export interface TrendDatum {
  key: string
  label: string
  title: string
  /** null = nuk ka të dhëna (p.sh. asnjë natë në dispozicion). */
  value: number | null
  future?: boolean
  note?: string
}

/** Vijë me zonë poshtë: përshtatet për përqindje ose sasi gjatë kohës. */
export function TrendChart({
  data,
  ariaLabel,
  formatValue,
  formatTick,
  tone = 'accent',
  height = 232,
  max = 1,
  reference,
  legend,
  headers,
}: {
  data: readonly TrendDatum[]
  ariaLabel: string
  formatValue: (value: number | null) => string
  formatTick: (value: number) => string
  tone?: ChartTone
  height?: number
  max?: number
  reference?: { value: number; label: string }
  legend?: { now: string; future?: string; reference?: string }
  headers: [string, string]
}) {
  const id = useId()
  const { ref, width } = useChartWidth()
  const [active, setActive] = useState<number | null>(null)

  const peak = Math.max(max, ...data.map((item) => item.value ?? 0))
  const ticks = niceTicks(0, peak, 4)
  const yMax = ticks[ticks.length - 1] ?? 1
  const tickLabels = ticks.map(formatTick)
  const margin = {
    top: 12,
    right: 12,
    bottom: 30,
    left: Math.max(...tickLabels.map((label) => label.length), 2) * 7 + 14,
  }
  const plotW = Math.max(40, width - margin.left - margin.right)
  const plotH = height - margin.top - margin.bottom
  const band = plotW / Math.max(1, data.length)
  const x = (index: number) => margin.left + (index + 0.5) * band
  const y = (value: number) => margin.top + plotH * (1 - value / yMax)
  const every = labelEvery(data.length, band)
  const baseline = y(0)
  const current = active === null ? null : (data[active] ?? null)
  const hasFuture = data.some((item) => item.future)

  /** Segmente të vazhdueshme; një boshllëk (null) e ndërpret vijën. */
  const segments: { from: number; to: number; future: boolean }[] = []
  data.forEach((item, index) => {
    if (item.value === null) return
    const last = segments[segments.length - 1]
    const future = Boolean(item.future)
    if (last && last.to === index - 1 && last.future === future) last.to = index
    else {
      const joins = last && last.to === index - 1
      segments.push({ from: joins ? index - 1 : index, to: index, future })
    }
  })
  const pathFor = (from: number, to: number) => {
    let d = ''
    for (let index = from; index <= to; index += 1) {
      const value = data[index]?.value
      if (value === null || value === undefined) continue
      d += `${d ? 'L' : 'M'}${x(index).toFixed(1)} ${y(value).toFixed(1)}`
    }
    return d
  }
  const areaFor = (from: number, to: number) =>
    `${pathFor(from, to)}L${x(to).toFixed(1)} ${baseline}L${x(from).toFixed(1)} ${baseline}Z`

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
            <linearGradient id={`${id}-fill`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" className={s.areaTop} />
              <stop offset="100%" className={s.areaBottom} />
            </linearGradient>
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
          {reference ? (
            <g>
              <line
                x1={margin.left}
                x2={width - margin.right}
                y1={y(reference.value)}
                y2={y(reference.value)}
                className={s.reference}
              />
            </g>
          ) : null}
          {segments.map((segment) => (
            <path
              key={`a${segment.from}`}
              d={areaFor(segment.from, segment.to)}
              fill={`url(#${id}-fill)`}
              opacity={segment.future ? 0.55 : 1}
            />
          ))}
          {segments.map((segment) => (
            <path
              key={`l${segment.from}`}
              d={pathFor(segment.from, segment.to)}
              className={segment.future ? s.lineFuture : s.line}
            />
          ))}
          {data.length <= 40
            ? data.map((item, index) =>
                item.value === null ? null : (
                  <circle key={item.key} cx={x(index)} cy={y(item.value)} r={2.5} className={s.dot} />
                ),
              )
            : null}
          {active !== null ? (
            <g>
              <line x1={x(active)} x2={x(active)} y1={margin.top} y2={baseline} className={s.cursor} />
              {data[active]?.value !== null && data[active]?.value !== undefined ? (
                <circle cx={x(active)} cy={y(data[active].value)} r={5.5} className={s.dotActive} />
              ) : null}
            </g>
          ) : null}
          {data.map((item, index) =>
            index % every === 0 ? (
              <text key={item.key} x={x(index)} y={height - 9} textAnchor="middle" className={s.tick}>
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
            x={x(active ?? 0)}
            width={width}
            title={current.title}
            value={formatValue(current.value)}
            note={current.note}
          />
        ) : null}
      </div>
      <p className={s.srOnly} aria-live="polite">
        {current ? `${current.title}: ${formatValue(current.value)}` : ''}
      </p>
      {legend ? (
        <ChartLegend
          items={[
            { label: legend.now, kind: 'line' },
            ...(hasFuture && legend.future ? [{ label: legend.future, kind: 'dashed' as const }] : []),
            ...(reference && legend.reference
              ? [{ label: `${legend.reference}: ${reference.label}`, kind: 'dashed' as const }]
              : []),
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
