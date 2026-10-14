import { useState } from 'react'
import clsx from 'clsx'
import { SERIES_COLORS } from './ChartParts'
import s from './Chart.module.scss'

export interface DonutSlice {
  key: string
  label: string
  value: number
  /** Teksti i vlerës te legjenda, p.sh. "42 net". */
  valueLabel: string
  percentLabel: string
  detail?: string
}

const SIZE = 176
const STROKE = 26
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

/** Unazë me legjendë tekstuale: ngjyra nuk është kurrë i vetmi dallim. */
export function DonutChart({
  slices,
  centerValue,
  centerLabel,
  ariaLabel,
}: {
  slices: readonly DonutSlice[]
  centerValue: string
  centerLabel: string
  ariaLabel: string
}) {
  const [active, setActive] = useState<string | null>(null)
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)
  const gap = slices.filter((slice) => slice.value > 0).length > 1 ? 3 : 0

  let offset = 0
  const arcs = slices.map((slice, index) => {
    const length = total > 0 ? (slice.value / total) * CIRCUMFERENCE : 0
    const arc = { slice, color: SERIES_COLORS[index % SERIES_COLORS.length], length, offset }
    offset += length
    return arc
  })

  return (
    <div className={s.donut}>
      <div className={s.donutRing} role="img" aria-label={ariaLabel}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" focusable="false">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} className={s.ringTrack} strokeWidth={STROKE} fill="none" />
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            {arcs.map(({ slice, color, length, offset: start }) =>
              length > 0 ? (
                <circle
                  key={slice.key}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={color}
                  strokeWidth={active === slice.key ? STROKE + 4 : STROKE}
                  strokeDasharray={`${Math.max(0, length - gap)} ${CIRCUMFERENCE}`}
                  strokeDashoffset={-start}
                  opacity={active === null || active === slice.key ? 1 : 0.35}
                  className={s.arc}
                />
              ) : null,
            )}
          </g>
        </svg>
        <span className={s.donutCenter}>
          <strong>{centerValue}</strong>
          <span>{centerLabel}</span>
        </span>
      </div>
      <ul className={s.donutLegend}>
        {arcs.map(({ slice, color }) => (
          <li
            key={slice.key}
            className={clsx(s.donutItem, active === slice.key && s.donutItemActive)}
            onPointerEnter={() => setActive(slice.key)}
            onPointerLeave={() => setActive(null)}
          >
            <span className={s.legendDot} style={{ background: color }} aria-hidden="true" />
            <span className={s.donutName}>
              {slice.label}
              {slice.detail ? <span className={s.donutDetail}>{slice.detail}</span> : null}
            </span>
            <span className={s.donutValue}>{slice.valueLabel}</span>
            <span className={s.donutPercent}>{slice.percentLabel}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
