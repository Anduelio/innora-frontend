export function formatEuro(cents: number): string {
  const hasCents = cents % 100 !== 0
  const formatted = new Intl.NumberFormat('sq-AL', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(cents / 100)
  return `€${formatted}`
}

export function centsToInput(cents: number): string {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2)
}

export function eurosToCents(input: string): number {
  const normalized = input.trim().replace(/\s/g, '').replace(',', '.')
  if (!normalized) return 0
  const value = Number(normalized)
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.round(value * 100)
}
