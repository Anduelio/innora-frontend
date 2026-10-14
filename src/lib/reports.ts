import type { Payment, PaymentMethod, Reservation, ReservationSource, Room } from '@/types/domain'
import { addDaysIso, addMonthsIso, dayIndex, daysInMonth, rangeOf, startOfMonthIso } from '@/lib/date/calendar'
import { nightsOf, occupiesNight, roomBlockedOn } from '@/lib/inventory'
import { balanceCents, stayNights } from '@/lib/reservation'

/**
 * Raporte menaxhimi, jo kontabilitet. Katër koncepte parash nuk mblidhen kurrë bashkë
 * (vlera e rezervimit, e ardhura e fituar, paratë e arkëtuara, pagesat e kanalit)
 * dhe monedhat nuk mblidhen kurrë midis tyre.
 */

/** Dita e parë me të dhëna në sistem; periudhat para saj janë jo të plota. */
export const DATA_COVERAGE_START = '2026-09-01'

/** Të dyja datat përfshihen: `end` është nata/dita e fundit e periudhës. */
export interface ReportPeriod {
  start: string
  end: string
}

export const PERIOD_PRESETS = ['thisMonth', 'lastMonth', 'last7', 'today', 'custom'] as const
export type PeriodPreset = (typeof PERIOD_PRESETS)[number]

export const REPORT_SOURCES: readonly ReservationSource[] = ['BOOKING', 'TELEFON', 'RECEPSION']

export interface ReportFilters {
  roomTypeId: number | null
  source: ReservationSource | null
}

export interface CurrencyAmount {
  currency: string
  cents: number
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/

export function isIsoDate(value: string | null | undefined): value is string {
  const match = value ? ISO_DATE.exec(value) : null
  if (!match) return false
  const [, year, month, day] = match.map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
}

function monthPeriod(iso: string): ReportPeriod {
  const start = startOfMonthIso(iso)
  return { start, end: addDaysIso(start, daysInMonth(start) - 1) }
}

export function presetPeriod(preset: Exclude<PeriodPreset, 'custom'>, today: string): ReportPeriod {
  switch (preset) {
    case 'thisMonth':
      return monthPeriod(today)
    case 'lastMonth':
      return monthPeriod(addMonthsIso(today, -1))
    case 'last7':
      return { start: addDaysIso(today, -6), end: today }
    case 'today':
      return { start: today, end: today }
  }
}

/** Lexon parametrat e URL-së; çdo vlerë e pavlefshme bie te "Ky muaj". */
export function resolvePeriod(
  preset: string | null,
  from: string | null,
  to: string | null,
  today: string,
): { preset: PeriodPreset; period: ReportPeriod } {
  const known = PERIOD_PRESETS.find((item) => item === preset) ?? 'thisMonth'
  if (known !== 'custom') return { preset: known, period: presetPeriod(known, today) }
  if (!isIsoDate(from) || !isIsoDate(to)) return { preset: 'custom', period: presetPeriod('thisMonth', today) }
  return { preset: 'custom', period: from <= to ? { start: from, end: to } : { start: to, end: from } }
}

export function periodLength(period: ReportPeriod): number {
  return Math.max(0, dayIndex(period.start, period.end) + 1)
}

export function periodDays(period: ReportPeriod): string[] {
  return rangeOf(period.start, periodLength(period))
}

export function inPeriod(day: string, period: ReportPeriod): boolean {
  return day >= period.start && day <= period.end
}

export function startsBeforeCoverage(period: ReportPeriod, coverageStart = DATA_COVERAGE_START): boolean {
  return period.start < coverageStart
}

export function matchesFilters(reservation: Reservation, filters: ReportFilters): boolean {
  return (
    (filters.roomTypeId === null || reservation.roomTypeId === filters.roomTypeId) &&
    (filters.source === null || reservation.source === filters.source)
  )
}

export function hasFilters(filters: ReportFilters): boolean {
  return filters.roomTypeId !== null || filters.source !== null
}

/** Netët e rezervuara që bien brenda periudhës, pavarësisht statusit. */
function bookedNightsIn(reservation: Reservation, period: ReportPeriod): string[] {
  const first = reservation.checkIn > period.start ? reservation.checkIn : period.start
  const afterEnd = addDaysIso(period.end, 1)
  const last = reservation.checkOut < afterEnd ? reservation.checkOut : afterEnd
  return first < last ? nightsOf(first, last) : []
}

/** Netët e zëna vërtet: pa të anuluarat, mospërfaqësimi vetëm nata e parë. */
export function occupiedNightsIn(reservation: Reservation, period: ReportPeriod): string[] {
  return bookedNightsIn(reservation, period).filter((day) => occupiesNight(reservation, day))
}

export function orderCurrencies(currencies: Iterable<string>, primary = 'EUR'): string[] {
  return [...new Set(currencies)].sort((a, b) => {
    if (a === primary) return -1
    if (b === primary) return 1
    return a.localeCompare(b)
  })
}

function addTo(map: Map<string, number>, key: string, cents: number) {
  map.set(key, (map.get(key) ?? 0) + cents)
}

function toAmounts(map: Map<string, number>, primary: string): CurrencyAmount[] {
  return orderCurrencies(map.keys(), primary).map((currency) => ({ currency, cents: map.get(currency) ?? 0 }))
}

export function amountIn(amounts: readonly CurrencyAmount[], currency: string): number {
  return amounts.find((item) => item.currency === currency)?.cents ?? 0
}

/* ---------- Lëvizjet ---------- */

export interface MovementCount {
  /** Rezervime jo të anuluara; përfshin mospërfaqësimet. */
  count: number
  noShow: number
  cancelled: number
}

export interface Movements {
  arrivals: MovementCount
  departures: MovementCount
  stays: MovementCount
}

function tally(reservations: readonly Reservation[], include: (reservation: Reservation) => boolean): MovementCount {
  const result: MovementCount = { count: 0, noShow: 0, cancelled: 0 }
  for (const reservation of reservations) {
    if (!include(reservation)) continue
    if (reservation.status === 'CANCELLED') {
      result.cancelled += 1
      continue
    }
    result.count += 1
    if (reservation.status === 'NO_SHOW') result.noShow += 1
  }
  return result
}

export function movements(reservations: readonly Reservation[], period: ReportPeriod): Movements {
  return {
    arrivals: tally(reservations, (item) => inPeriod(item.checkIn, period)),
    departures: tally(reservations, (item) => inPeriod(item.checkOut, period)),
    stays: tally(reservations, (item) =>
      item.status === 'CANCELLED'
        ? bookedNightsIn(item, period).length > 0
        : occupiedNightsIn(item, period).length > 0,
    ),
  }
}

/* ---------- Net-dhoma dhe zënia ---------- */

export function roomNightsSold(reservations: readonly Reservation[], period: ReportPeriod): number {
  return reservations.reduce((sum, reservation) => sum + occupiedNightsIn(reservation, period).length, 0)
}

export interface TypeNights {
  roomTypeId: number
  nights: number
}

export function roomNightsByType(reservations: readonly Reservation[], period: ReportPeriod): TypeNights[] {
  const byType = new Map<number, number>()
  for (const reservation of reservations) {
    const nights = occupiedNightsIn(reservation, period).length
    if (nights > 0) byType.set(reservation.roomTypeId, (byType.get(reservation.roomTypeId) ?? 0) + nights)
  }
  return [...byType.entries()]
    .map(([roomTypeId, nights]) => ({ roomTypeId, nights }))
    .sort((a, b) => b.nights - a.nights || a.roomTypeId - b.roomTypeId)
}

export interface OccupancyNight {
  day: string
  sold: number
  available: number
  blocked: number
}

export interface OccupancyReport {
  sold: number
  /** Dhoma aktive × net − net jashtë shërbimit. */
  available: number
  /** Net-dhoma të bllokuara (mirëmbajtje etj.), të hequra nga emëruesi. */
  blocked: number
  activeRooms: number
  /** 0..1, ose null kur nuk ka asnjë natë në dispozicion. */
  rate: number | null
  nights: OccupancyNight[]
}

export function occupancy(
  reservations: readonly Reservation[],
  rooms: readonly Room[],
  period: ReportPeriod,
): OccupancyReport {
  const active = rooms.filter((room) => room.isActive !== false)
  const soldByDay = new Map<string, number>()
  for (const reservation of reservations) {
    for (const day of occupiedNightsIn(reservation, period)) addTo(soldByDay, day, 1)
  }
  const nights = periodDays(period).map((day) => {
    const blocked = active.filter((room) => roomBlockedOn(room, day)).length
    return { day, sold: soldByDay.get(day) ?? 0, available: active.length - blocked, blocked }
  })
  const sold = nights.reduce((sum, night) => sum + night.sold, 0)
  const available = nights.reduce((sum, night) => sum + night.available, 0)
  const blocked = nights.reduce((sum, night) => sum + night.blocked, 0)
  return { sold, available, blocked, activeRooms: active.length, rate: available > 0 ? sold / available : null, nights }
}

export interface OccupancyMonth {
  month: string
  sold: number
  available: number
}

export function occupancyByMonth(nights: readonly OccupancyNight[]): OccupancyMonth[] {
  const months = new Map<string, OccupancyMonth>()
  for (const night of nights) {
    const month = startOfMonthIso(night.day)
    const entry = months.get(month) ?? { month, sold: 0, available: 0 }
    entry.sold += night.sold
    entry.available += night.available
    months.set(month, entry)
  }
  return [...months.values()]
}

/* ---------- Të ardhurat (sipas natës) ---------- */

/** Ndan totalin në cent të plotë për çdo natë; shuma e pjesëve është gjithmonë totali. */
export function nightlyCents(totalCents: number, nights: number): number[] {
  if (nights <= 0) return []
  const base = Math.floor(totalCents / nights)
  const remainder = totalCents - base * nights
  return Array.from({ length: nights }, (_, index) => base + (index < remainder ? 1 : 0))
}

export interface MonthAmounts {
  month: string
  amounts: CurrencyAmount[]
}

export interface EarnedReport {
  totals: CurrencyAmount[]
  byMonth: MonthAmounts[]
  nights: number
}

function nightValues(
  reservations: readonly Reservation[],
  window: ReportPeriod,
  include: (reservation: Reservation) => boolean,
  visit: (reservation: Reservation, day: string, cents: number) => void,
) {
  for (const reservation of reservations) {
    if (reservation.status === 'CANCELLED' || !include(reservation)) continue
    const shares = nightlyCents(reservation.totalCents, stayNights(reservation))
    for (const day of occupiedNightsIn(reservation, window)) {
      visit(reservation, day, shares[dayIndex(reservation.checkIn, day)] ?? 0)
    }
  }
}

/** E ardhura e fituar: netët e zëna brenda periudhës deri dhe me `asOf`. */
export function earnedRevenue(
  reservations: readonly Reservation[],
  period: ReportPeriod,
  asOf: string,
  primary = 'EUR',
): EarnedReport {
  const window = { start: period.start, end: period.end < asOf ? period.end : asOf }
  const totals = new Map<string, number>()
  const months = new Map<string, Map<string, number>>()
  let nights = 0
  if (window.start <= window.end) {
    nightValues(reservations, window, () => true, (reservation, day, cents) => {
      nights += 1
      addTo(totals, reservation.currency, cents)
      const month = startOfMonthIso(day)
      const bucket = months.get(month) ?? new Map<string, number>()
      addTo(bucket, reservation.currency, cents)
      months.set(month, bucket)
    })
  }
  const byMonth = [...months.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amounts]) => ({ month, amounts: toAmounts(amounts, primary) }))
  return { totals: toAmounts(totals, primary), byMonth, nights }
}

export interface ForecastReport {
  totals: CurrencyAmount[]
  nights: number
  /** Pjesa e periudhës pas `asOf`; null kur periudha ka mbaruar. */
  window: ReportPeriod | null
}

/** Parashikim: netët e konfirmuara (RESERVED/IN_HOUSE) pas `asOf`. Nuk përzihet me të fituarat. */
export function forecastRevenue(
  reservations: readonly Reservation[],
  period: ReportPeriod,
  asOf: string,
  primary = 'EUR',
): ForecastReport {
  const tomorrow = addDaysIso(asOf, 1)
  const window = { start: period.start > tomorrow ? period.start : tomorrow, end: period.end }
  if (window.start > window.end) return { totals: [], nights: 0, window: null }
  const totals = new Map<string, number>()
  let nights = 0
  nightValues(
    reservations,
    window,
    (reservation) => reservation.status === 'RESERVED' || reservation.status === 'IN_HOUSE',
    (reservation, _day, cents) => {
      nights += 1
      addTo(totals, reservation.currency, cents)
    },
  )
  return { totals: toAmounts(totals, primary), nights, window }
}

/* ---------- Seri ditore për grafikët ---------- */

export interface DailyCents {
  day: string
  cents: number
  /** Dita është pas `asOf`: vlera është parashikim, jo e fituar. */
  future: boolean
}

export interface CurrencySeries {
  currency: string
  days: DailyCents[]
}

/**
 * Një vlerë për ditë dhe monedhë: e fituar deri `asOf`, parashikim pas tij.
 * Asnjëherë të dyja për të njëjtën ditë, kështu që nuk mblidhen kurrë bashkë.
 */
export function revenueSeries(
  reservations: readonly Reservation[],
  period: ReportPeriod,
  asOf: string,
  primary = 'EUR',
): CurrencySeries[] {
  const byCurrency = new Map<string, Map<string, number>>()
  nightValues(
    reservations,
    period,
    () => true,
    (reservation, day, cents) => {
      const future = day > asOf
      if (future && reservation.status !== 'RESERVED' && reservation.status !== 'IN_HOUSE') return
      const days = byCurrency.get(reservation.currency) ?? new Map<string, number>()
      addTo(days, day, cents)
      byCurrency.set(reservation.currency, days)
    },
  )
  const all = periodDays(period)
  return orderCurrencies(byCurrency.keys(), primary).map((currency) => {
    const days = byCurrency.get(currency) ?? new Map<string, number>()
    return { currency, days: all.map((day) => ({ day, cents: days.get(day) ?? 0, future: day > asOf })) }
  })
}

/** Arkëtimet neto për ditë dhe monedhë (pagesa minus rimbursime). */
export function collectedSeries(payments: readonly Payment[], period: ReportPeriod, primary = 'EUR'): CurrencySeries[] {
  const byCurrency = new Map<string, Map<string, number>>()
  for (const payment of payments) {
    const day = paymentDay(payment)
    if (!inPeriod(day, period)) continue
    const days = byCurrency.get(payment.currency) ?? new Map<string, number>()
    addTo(days, day, signedAmount(payment))
    byCurrency.set(payment.currency, days)
  }
  const all = periodDays(period)
  return orderCurrencies(byCurrency.keys(), primary).map((currency) => {
    const days = byCurrency.get(currency) ?? new Map<string, number>()
    return { currency, days: all.map((day) => ({ day, cents: days.get(day) ?? 0, future: false })) }
  })
}

export interface MonthCents {
  month: string
  cents: number
  /** Muaji përmban vetëm ditë parashikimi. */
  future: boolean
}

/** Mbledh ditët e një monedhe sipas muajit, për periudha më të gjata se një muaj. */
export function seriesByMonth(days: readonly DailyCents[]): MonthCents[] {
  const months = new Map<string, MonthCents>()
  for (const item of days) {
    const month = startOfMonthIso(item.day)
    const entry = months.get(month) ?? { month, cents: 0, future: true }
    entry.cents += item.cents
    entry.future = entry.future && item.future
    months.set(month, entry)
  }
  return [...months.values()]
}

/* ---------- Paratë e arkëtuara (sipas datës së pagesës) ---------- */

type MethodAmounts = Record<PaymentMethod, number>

const emptyMethods = (): MethodAmounts => ({ cash: 0, card: 0, bank_transfer: 0 })

export interface CollectedReport {
  currency: string
  /** Pagesat e marra, pozitive. */
  payments: MethodAmounts
  paymentsCents: number
  /** Rimbursimet, negative. */
  refunds: MethodAmounts
  refundsCents: number
  netCents: number
  count: number
}

export function paymentDay(payment: Pick<Payment, 'paidAt'>): string {
  return payment.paidAt.slice(0, 10)
}

export function signedAmount(payment: Pick<Payment, 'kind' | 'amountCents'>): number {
  return payment.kind === 'refund' ? -Math.abs(payment.amountCents) : Math.abs(payment.amountCents)
}

export function collectedCash(payments: readonly Payment[], period: ReportPeriod, primary = 'EUR'): CollectedReport[] {
  const groups = new Map<string, CollectedReport>()
  for (const payment of payments) {
    if (!inPeriod(paymentDay(payment), period)) continue
    const group = groups.get(payment.currency) ?? {
      currency: payment.currency,
      payments: emptyMethods(),
      paymentsCents: 0,
      refunds: emptyMethods(),
      refundsCents: 0,
      netCents: 0,
      count: 0,
    }
    const cents = signedAmount(payment)
    if (payment.kind === 'refund') {
      group.refunds[payment.method] += cents
      group.refundsCents += cents
    } else {
      group.payments[payment.method] += cents
      group.paymentsCents += cents
    }
    group.netCents += cents
    group.count += 1
    groups.set(payment.currency, group)
  }
  return orderCurrencies(groups.keys(), primary).flatMap((currency) => groups.get(currency) ?? [])
}

/* ---------- Detyrimet e papaguara ---------- */

export interface OutstandingRow {
  reservation: Reservation
  balanceCents: number
}

export interface OutstandingGroup {
  currency: string
  totalCents: number
  rows: OutstandingRow[]
}

/** Rezervime jo të anuluara, të mbërritura deri më `asOf`, me mbetje > 0 (pagesat deri sot). */
export function outstandingBalances(
  reservations: readonly Reservation[],
  asOf: string,
  primary = 'EUR',
): OutstandingGroup[] {
  const groups = new Map<string, OutstandingRow[]>()
  for (const reservation of reservations) {
    if (reservation.status === 'CANCELLED' || reservation.checkIn > asOf) continue
    const balance = balanceCents(reservation)
    if (balance <= 0) continue
    const rows = groups.get(reservation.currency) ?? []
    rows.push({ reservation, balanceCents: balance })
    groups.set(reservation.currency, rows)
  }
  return orderCurrencies(groups.keys(), primary).map((currency) => {
    const rows = [...(groups.get(currency) ?? [])].sort(
      (a, b) => b.balanceCents - a.balanceCents || a.reservation.checkIn.localeCompare(b.reservation.checkIn),
    )
    return { currency, rows, totalCents: rows.reduce((sum, row) => sum + row.balanceCents, 0) }
  })
}

/* ---------- Burimi i rezervimeve (sipas datës së mbërritjes) ---------- */

export interface ChannelRow {
  source: ReservationSource
  count: number
  cancelled: number
  /** Vlera e rezervimeve, jo e ardhur e fituar. */
  value: CurrencyAmount[]
}

export function channelMix(reservations: readonly Reservation[], period: ReportPeriod, primary = 'EUR'): ChannelRow[] {
  return REPORT_SOURCES.map((source) => {
    const value = new Map<string, number>()
    let count = 0
    let cancelled = 0
    for (const reservation of reservations) {
      if (reservation.source !== source || !inPeriod(reservation.checkIn, period)) continue
      if (reservation.status === 'CANCELLED') {
        cancelled += 1
        continue
      }
      count += 1
      addTo(value, reservation.currency, reservation.totalCents)
    }
    return { source, count, cancelled, value: toAmounts(value, primary) }
  })
}

/* ---------- Raporti i plotë ---------- */

export interface ReportInput {
  reservations: readonly Reservation[]
  rooms: readonly Room[]
  payments: readonly Payment[]
  period: ReportPeriod
  filters: ReportFilters
  today: string
  primaryCurrency?: string
}

export interface Report {
  period: ReportPeriod
  nights: number
  movements: Movements
  roomNights: number
  roomNightsByType: TypeNights[]
  occupancy: OccupancyReport
  /** Net-dhoma të shitura pas sot (të rezervuara, ende jo të ndodhura). */
  futureRoomNights: number
  earned: EarnedReport
  forecast: ForecastReport
  /** Seri ditore: e fituar ose parashikim, sipas monedhës. */
  revenueByDay: CurrencySeries[]
  /** Arkëtime neto ditore, sipas monedhës. */
  collectedByDay: CurrencySeries[]
  collected: CollectedReport[]
  payments: Payment[]
  outstanding: OutstandingGroup[]
  channels: ChannelRow[]
  /** Monedhat që shfaqen në çdo tabelë parash, gjithmonë kolona më vete. */
  currencies: string[]
}

export function buildReport(input: ReportInput): Report {
  const { period, filters, today } = input
  const primary = input.primaryCurrency ?? 'EUR'
  const reservations = input.reservations.filter((item) => matchesFilters(item, filters))
  const rooms = input.rooms.filter((room) => filters.roomTypeId === null || room.roomTypeId === filters.roomTypeId)
  const allowed = new Set(reservations.map((item) => item.id))
  const payments = input.payments
    .filter((payment) => inPeriod(paymentDay(payment), period) && (!hasFilters(filters) || allowed.has(payment.reservationId)))
    .sort((a, b) => a.paidAt.localeCompare(b.paidAt) || a.id.localeCompare(b.id))

  const occupancyReport = occupancy(reservations, rooms, period)
  const tomorrow = addDaysIso(today, 1)
  const futureRoomNights = occupancyReport.nights.reduce((sum, night) => (night.day >= tomorrow ? sum + night.sold : sum), 0)
  const earned = earnedRevenue(reservations, period, today, primary)
  const forecast = forecastRevenue(reservations, period, today, primary)
  const collected = collectedCash(payments, period, primary)
  const outstanding = outstandingBalances(reservations, period.end, primary)
  const channels = channelMix(reservations, period, primary)

  const currencies = orderCurrencies(
    [
      ...earned.totals.map((item) => item.currency),
      ...forecast.totals.map((item) => item.currency),
      ...collected.map((item) => item.currency),
      ...outstanding.map((item) => item.currency),
      ...channels.flatMap((row) => row.value.map((item) => item.currency)),
    ],
    primary,
  )

  return {
    period,
    nights: periodLength(period),
    movements: movements(reservations, period),
    roomNights: occupancyReport.sold,
    roomNightsByType: roomNightsByType(reservations, period),
    occupancy: occupancyReport,
    futureRoomNights,
    earned,
    forecast,
    revenueByDay: revenueSeries(reservations, period, today, primary),
    collectedByDay: collectedSeries(payments, period, primary),
    collected,
    payments,
    outstanding,
    channels,
    currencies,
  }
}

/* ---------- Formatimi dhe CSV ---------- */

const percent = new Intl.NumberFormat('sq-AL', { style: 'percent', maximumFractionDigits: 1 })

export function formatPercent(rate: number | null): string {
  return rate === null ? '—' : percent.format(rate)
}

/** Shuma për CSV me presje dhjetore (Excel shqip), pa simbol monedhe. */
export function centsToDecimal(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(Math.round(cents))
  return `${sign}${Math.floor(abs / 100)},${String(abs % 100).padStart(2, '0')}`
}

export type CsvCell = string | number | null | undefined

const BOM = '\uFEFF'
const NUMERIC = /^-?\d+(?:[.,]\d+)?$/

function csvCell(cell: CsvCell, separator: string): string {
  let text = cell === null || cell === undefined ? '' : String(cell)
  if (/^[=+\-@\t\r]/.test(text) && !NUMERIC.test(text)) text = `'${text}`
  return text.includes(separator) || /["\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** CSV me BOM UTF-8 që Excel të lexojë ë/ç; pikëpresje si ndarës, rreshta CRLF. */
export function toCsv(rows: readonly (readonly CsvCell[])[], separator = ';'): string {
  return `${BOM}${rows.map((row) => row.map((cell) => csvCell(cell, separator)).join(separator)).join('\r\n')}\r\n`
}
