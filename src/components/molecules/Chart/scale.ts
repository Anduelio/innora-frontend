/** Vlera "të rrumbullakëta" për boshtin Y; gjithmonë përfshin min dhe max. */
export function niceTicks(min: number, max: number, target = 4): number[] {
  const hi = max > min ? max : min + 1
  const rough = (hi - min) / target
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const norm = rough / magnitude
  const factor = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10
  const step = factor * magnitude
  const first = Math.floor(min / step) * step
  const last = Math.ceil(hi / step) * step
  const ticks: number[] = []
  for (let value = first; value <= last + step / 2; value += step) ticks.push(Math.round(value / step) * step)
  return ticks
}

/** Çdo sa etiketa shfaqet që të mos mbivendosen. */
export function labelEvery(count: number, band: number, minGap = 52): number {
  if (count <= 1) return 1
  return Math.max(1, Math.ceil(minGap / Math.max(band, 1)))
}

const compact = new Intl.NumberFormat('sq-AL', { notation: 'compact', maximumFractionDigits: 1 })
export const formatCompact = (value: number) => compact.format(value)

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
