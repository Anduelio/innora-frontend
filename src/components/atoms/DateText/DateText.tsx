import { fmtDate, fmtDayMonth } from '@/lib/date/calendar'

export function DateText({ iso, short = false, className }: { iso: string; short?: boolean; className?: string }) {
  return (
    <time dateTime={iso} className={className} style={{ fontVariantNumeric: 'tabular-nums' }}>
      {short ? fmtDayMonth(iso) : fmtDate(iso)}
    </time>
  )
}
