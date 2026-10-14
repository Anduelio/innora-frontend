import type { ColumnDatum } from '@/components/molecules/Chart/ColumnChart'
import { fmtDate, fmtDayMonth } from '@/lib/date/calendar'
import { seriesByMonth, type DailyCents } from '@/lib/reports'

/** Deri në 31 ditë: një kolonë për ditë; më gjatë: një kolonë për muaj. */
export const DAILY_LIMIT = 31

export function monthTitle(iso: string, months: readonly string[]): string {
  return `${months[Number(iso.slice(5, 7)) - 1] ?? ''} ${iso.slice(0, 4)}`
}

export function seriesToColumns(
  days: readonly DailyCents[],
  names: { months: readonly string[]; monthsShort: readonly string[] },
): { data: ColumnDatum[]; monthly: boolean } {
  if (days.length <= DAILY_LIMIT) {
    return {
      monthly: false,
      data: days.map((item) => ({
        key: item.day,
        label: days.length > 14 ? item.day.slice(8) : fmtDayMonth(item.day),
        title: fmtDate(item.day),
        value: item.cents,
        future: item.future,
      })),
    }
  }
  return {
    monthly: true,
    data: seriesByMonth(days).map((item) => ({
      key: item.month,
      label: names.monthsShort[Number(item.month.slice(5, 7)) - 1] ?? '',
      title: monthTitle(item.month, names.months),
      value: item.cents,
      future: item.future,
    })),
  }
}
