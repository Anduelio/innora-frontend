const formatters = new Map<string, Intl.NumberFormat>()

function formatter(currency: string, fraction: boolean): Intl.NumberFormat {
  const key = `${currency}:${fraction}`
  let found = formatters.get(key)
  if (!found) {
    found = new Intl.NumberFormat('sq-AL', {
      style: 'currency',
      currency,
      minimumFractionDigits: fraction ? 2 : 0,
      maximumFractionDigits: fraction ? 2 : 0,
    })
    formatters.set(key, found)
  }
  return found
}

/** Shuma në njësi të vogla (cent, qindarkë) për një monedhë; monedhat nuk bashkohen kurrë. */
export function formatMoney(cents: number, currency = 'EUR'): string {
  return formatter(currency, cents % 100 !== 0).format(cents / 100)
}

export function currencyMark(currency = 'EUR'): string {
  return currency === 'ALL' ? 'Lekë' : '€'
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
