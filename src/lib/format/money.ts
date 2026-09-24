export function formatMoney(cents: number, currency = 'EUR'): string {
  const hasCents = cents % 100 !== 0
  const formatted = new Intl.NumberFormat('sq-AL', {
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(cents / 100)
  return currency === 'ALL' ? `${formatted} Lek` : `€${formatted}`
}

export function currencyMark(currency = 'EUR'): string {
  return currency === 'ALL' ? 'Lek' : '€'
}

export function formatEuro(cents: number): string {
  return formatMoney(cents, 'EUR')
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
