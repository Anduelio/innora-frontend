import { addDays, differenceInCalendarDays, format, parse } from 'date-fns'
import type { CalendarView } from '@/types/domain'

export function parseISODate(iso: string): Date {
  return parse(iso, 'yyyy-MM-dd', new Date())
}

export function formatISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function addDaysIso(iso: string, days: number): string {
  return formatISODate(addDays(parseISODate(iso), days))
}

export function dayIndex(from: string, to: string): number {
  return differenceInCalendarDays(parseISODate(to), parseISODate(from))
}

export function rangeOf(start: string, days: number): string[] {
  return Array.from({ length: days }, (_, index) => addDaysIso(start, index))
}

export function fmtGjate(iso: string, months: readonly string[]): string {
  const date = parseISODate(iso)
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
}

export function fmtShkurter(iso: string, monthsShort: readonly string[]): string {
  const date = parseISODate(iso)
  return `${date.getDate()} ${monthsShort[date.getMonth()]}`
}

export function netLabel(count: number, label: (count: number) => string): string {
  return label(count)
}

export function monthSpanLabel(
  start: string,
  days: number,
  months: readonly string[],
  monthsShort: readonly string[],
): string {
  const first = parseISODate(start)
  const last = parseISODate(addDaysIso(start, days - 1))
  if (first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear()) {
    return `${months[first.getMonth()]} ${first.getFullYear()}`
  }
  return `${monthsShort[first.getMonth()]} – ${monthsShort[last.getMonth()]} ${last.getFullYear()}`
}

export function weekdayIndex(iso: string): number {
  return parseISODate(iso).getDay()
}

export function isWeekend(iso: string): boolean {
  const day = weekdayIndex(iso)
  return day === 0 || day === 6
}

const COLUMN_WIDTH: Record<CalendarView, number> = { 7: 152, 14: 98, 30: 56 }

export function columnWidth(view: CalendarView): number {
  return COLUMN_WIDTH[view]
}

export interface BlockPlacement {
  leftPx: number
  widthPx: number
  clippedStart: boolean
  clippedEnd: boolean
  showMeta: boolean
}

export function placeBlock(input: {
  checkIn: string
  checkOut: string
  rangeStart: string
  rangeEnd: string
  colW: number
}): BlockPlacement | null {
  const { checkIn, checkOut, rangeStart, rangeEnd, colW } = input
  if (checkOut <= rangeStart || checkIn >= rangeEnd) return null

  const start = checkIn < rangeStart ? rangeStart : checkIn
  const end = checkOut > rangeEnd ? rangeEnd : checkOut
  const clippedStart = checkIn < rangeStart
  const clippedEnd = checkOut > rangeEnd
  const left = dayIndex(rangeStart, start) * colW + (checkIn >= rangeStart ? colW * 0.38 : 0)
  const right = dayIndex(rangeStart, end) * colW + (checkOut <= rangeEnd ? colW * 0.28 : colW)
  const widthPx = Math.max(34, right - left - 4)

  return {
    leftPx: left,
    widthPx,
    clippedStart,
    clippedEnd,
    showMeta: widthPx >= 132,
  }
}
