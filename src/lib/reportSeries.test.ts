import { describe, expect, it } from 'vitest'
import type { Payment, Reservation } from '@/types/domain'
import { collectedSeries, earnedRevenue, forecastRevenue, revenueSeries, seriesByMonth } from '@/lib/reports'
import { niceTicks } from '@/components/molecules/Chart/scale'

const TODAY = '2026-09-21'
const period = { start: '2026-09-19', end: '2026-09-24' }

const stay = (partial: Partial<Reservation>): Reservation => ({
  id: 'r1',
  code: 'DH-1',
  roomId: '101',
  roomTypeId: 1,
  guestName: 'Ana',
  phone: '',
  currency: 'EUR',
  persons: 2,
  status: 'RESERVED',
  source: 'TELEFON',
  totalCents: 60000,
  paidCents: 0,
  createdAt: '2026-09-01T09:00:00Z',
  checkIn: '2026-09-20',
  checkOut: '2026-09-26',
  ...partial,
})

describe('report series for charts', () => {
  it('gives each day one value: earned up to today, forecast after, never both', () => {
    const [eur] = revenueSeries([stay({})], period, TODAY)
    expect(eur?.currency).toBe('EUR')
    expect(eur?.days.map((d) => [d.day, d.cents, d.future])).toEqual([
      ['2026-09-19', 0, false],
      ['2026-09-20', 10000, false],
      ['2026-09-21', 10000, false],
      ['2026-09-22', 10000, true],
      ['2026-09-23', 10000, true],
      ['2026-09-24', 10000, true],
    ])
  })

  it('adds up to exactly the earned and forecast totals shown elsewhere', () => {
    const reservations = [
      stay({}),
      stay({
        id: 'r2',
        currency: 'ALL',
        totalCents: 300000,
        checkIn: '2026-09-21',
        checkOut: '2026-09-24',
      }),
    ]
    const series = revenueSeries(reservations, period, TODAY)
    for (const item of series) {
      const earned = item.days.filter((d) => !d.future).reduce((sum, d) => sum + d.cents, 0)
      const forecast = item.days.filter((d) => d.future).reduce((sum, d) => sum + d.cents, 0)
      expect(earned).toBe(
        earnedRevenue(reservations, period, TODAY).totals.find((t) => t.currency === item.currency)?.cents ?? 0,
      )
      expect(forecast).toBe(
        forecastRevenue(reservations, period, TODAY).totals.find((t) => t.currency === item.currency)?.cents ?? 0,
      )
    }
    expect(series.map((item) => item.currency)).toEqual(['EUR', 'ALL'])
  })

  it('leaves cancelled stays out and does not forecast checked-out ones', () => {
    const [eur] = revenueSeries(
      [
        stay({ status: 'CANCELLED' }),
        stay({ id: 'r3', status: 'NO_SHOW', checkIn: '2026-09-23', checkOut: '2026-09-25' }),
      ],
      period,
      TODAY,
    )
    expect(eur?.days.reduce((sum, d) => sum + d.cents, 0) ?? 0).toBe(0)
  })

  it('nets refunds out of daily collections, per currency', () => {
    const pay = (partial: Partial<Payment>): Payment => ({
      id: 'p',
      reservationId: 'r1',
      guestName: 'Ana',
      kind: 'payment',
      method: 'cash',
      currency: 'EUR',
      recordedBy: 'x',
      amountCents: 0,
      paidAt: '2026-09-20T10:00:00Z',
      ...partial,
    })
    const [eur, all] = collectedSeries(
      [
        pay({ id: 'a', amountCents: 5000 }),
        pay({ id: 'b', amountCents: 2000, kind: 'refund' }),
        pay({ id: 'c', amountCents: 9000, currency: 'ALL' }),
      ],
      period,
    )
    expect(eur?.days.find((d) => d.day === '2026-09-20')?.cents).toBe(3000)
    expect(all?.days.find((d) => d.day === '2026-09-20')?.cents).toBe(9000)
  })

  it('groups days into months and marks a month future only when every day is', () => {
    const months = seriesByMonth([
      { day: '2026-09-29', cents: 100, future: false },
      { day: '2026-09-30', cents: 100, future: true },
      { day: '2026-10-01', cents: 100, future: true },
    ])
    expect(months).toEqual([
      { month: '2026-09-01', cents: 200, future: false },
      { month: '2026-10-01', cents: 100, future: true },
    ])
  })
})

describe('niceTicks', () => {
  it('covers the data range with round steps', () => {
    expect(niceTicks(0, 1, 4)).toEqual([0, 0.25, 0.5, 0.75, 1])
    expect(niceTicks(0, 87, 4)).toEqual([0, 25, 50, 75, 100])
    const negative = niceTicks(-30, 90, 4)
    expect(negative[0]).toBeLessThanOrEqual(-30)
    expect(negative[negative.length - 1]).toBeGreaterThanOrEqual(90)
    expect(negative).toContain(0)
  })

  it('never returns an empty axis for an all-zero series', () => {
    expect(niceTicks(0, 0, 4).length).toBeGreaterThan(1)
  })
})
