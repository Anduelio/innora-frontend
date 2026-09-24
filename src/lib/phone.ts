export const PHONE_PREFIXES = [
  { iso: 'AL', prefix: '+355' },
  { iso: 'XK', prefix: '+383' },
  { iso: 'IT', prefix: '+39' },
  { iso: 'GR', prefix: '+30' },
  { iso: 'MK', prefix: '+389' },
  { iso: 'ME', prefix: '+382' },
  { iso: 'RS', prefix: '+381' },
  { iso: 'DE', prefix: '+49' },
  { iso: 'FR', prefix: '+33' },
  { iso: 'GB', prefix: '+44' },
  { iso: 'US', prefix: '+1' },
] as const

export function nationalPhone(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function splitPhone(prefix: string | null | undefined, phone: string): { prefix: string; phone: string } {
  const trimmed = phone.trim()
  if (prefix) return { prefix, phone: nationalPhone(trimmed) }
  const compact = trimmed.replace(/\s/g, '')
  const match = [...PHONE_PREFIXES]
    .sort((a, b) => b.prefix.length - a.prefix.length)
    .find((item) => compact.startsWith(item.prefix))
  if (!match) return { prefix: '+355', phone: nationalPhone(trimmed) }
  return { prefix: match.prefix, phone: nationalPhone(compact.slice(match.prefix.length)) }
}

export function formatPhone(prefix?: string | null, phone?: string | null): string {
  const number = phone?.trim() ?? ''
  if (!number) return ''
  if (!prefix || number.startsWith('+')) return number
  return `${prefix} ${number}`
}
