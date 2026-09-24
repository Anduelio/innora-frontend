export function clampCount(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function guestInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.charAt(0) ?? ''
  const second = parts[1]?.charAt(0) ?? ''
  return `${first}${second}`.toLocaleUpperCase('sq')
}
