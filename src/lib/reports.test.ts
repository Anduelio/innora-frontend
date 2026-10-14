import { describe, expect, it } from 'vitest'
import type { Payment, Reservation, Room } from '@/types/domain'
import {
  amountIn,
  buildReport,
  centsToDecimal,
  channelMix,
  collectedCash,
  earnedRevenue,
  forecastRevenue,
  isIsoDate,
  movements,
  nightlyCents,
  occupancy,
  occupancyByMonth,
  outstandingBalances,
  presetPeriod,
  resolvePeriod,
  roomNightsByType,
  roomNightsSold,
  startsBeforeCoverage,
  toCsv,
} from '@/lib/reports'

const TODAY = '2026-09-21'

function reservation(partial: Partial<Reservation> & Pick<Reservation, 'id' | 'checkIn' | 'checkOut'>): Reservation {
  return {
    code: `DH-${partial.id}`,
    roomId: '101',
    roomTypeId: 1,
    guestName: `Mysafir ${partial.id}`,
    phone: '',
    currency: 'EUR',
    persons: 2,
    status: 'COMPLETED',
    source: 'TELEFON',
    totalCents: 0,
    paidCents: 0,
    createdAt: '2026-09-01T09:00:00Z',
    ...partial,
  }
}

function payment(partial: Partial<Payment> & Pick<Payment, 'id' | 'amountCents' | 'paidAt'>): Payment {
  return {
    reservationId: 'r1',
    guestName: 'Test',
    kind: 'payment',
    method: 'cash',
    currency: 'EUR',
    recordedBy: 'test',
    ...partial,
  }
}

const room = (id: string, extra: Partial<Room> = {}): Room => ({ id, roomTypeId: 1, type: 'Dyshe', capacity: 2, ...extra })

const september = { start: '2026-09-01', end: '2026-09-30' }
const october = { start: '2026-10-01', end: '2026-10-31' }

describe('periudhat', () => {
  it('resolves presets with an inclusive end date', () => {
    expect(presetPeriod('thisMonth', TODAY)).toEqual(september)
    expect(presetPeriod('lastMonth', TODAY)).toEqual({ start: '2026-08-01', end: '2026-08-31' })
    expect(presetPeriod('last7', TODAY)).toEqual({ start: '2026-09-15', end: '2026-09-21' })
    expect(presetPeriod('today', TODAY)).toEqual({ start: TODAY, end: TODAY })
    expect(presetPeriod('lastMonth', '2026-03-31')).toEqual({ start: '2026-02-01', end: '2026-02-28' })
  })

  it('reads custom periods from the URL and rejects bad dates', () => {
    expect(resolvePeriod('custom', '2026-09-10', '2026-09-05', TODAY).period).toEqual({
      start: '2026-09-05',
      end: '2026-09-10',
    })
    expect(resolvePeriod('custom', '2026-02-30', '2026-03-01', TODAY).period).toEqual(september)
    expect(resolvePeriod('garbage', null, null, TODAY)).toEqual({ preset: 'thisMonth', period: september })
    expect(isIsoDate('2026-09-21')).toBe(true)
    expect(isIsoDate('21.09.2026')).toBe(false)
  })

  it('flags periods that start before data coverage', () => {
    expect(startsBeforeCoverage({ start: '2026-08-01', end: '2026-08-31' })).toBe(true)
    expect(startsBeforeCoverage(september)).toBe(false)
  })
})

describe('lëvizjet dhe net-dhomat', () => {
  const list = [
    reservation({ id: 'a', checkIn: '2026-09-29', checkOut: '2026-10-02' }),
    reservation({ id: 'b', checkIn: '2026-09-10', checkOut: '2026-09-12', status: 'CANCELLED' }),
    reservation({ id: 'c', checkIn: '2026-09-20', checkOut: '2026-09-23', status: 'NO_SHOW' }),
    reservation({ id: 'd', checkIn: '2026-08-30', checkOut: '2026-09-01' }),
  ]

  it('counts cancelled separately and keeps no-shows visible', () => {
    const result = movements(list, september)
    expect(result.arrivals).toEqual({ count: 2, noShow: 1, cancelled: 1 })
    expect(result.departures).toEqual({ count: 2, noShow: 1, cancelled: 1 })
    expect(result.stays).toEqual({ count: 2, noShow: 1, cancelled: 1 })
  })

  it('counts nights check-in inclusive to check-out exclusive', () => {
    expect(roomNightsSold(list, september)).toBe(2 + 1)
    expect(roomNightsSold(list, october)).toBe(1)
    expect(roomNightsSold(list, { start: '2026-08-01', end: '2026-08-31' })).toBe(2)
  })

  it('counts only the first night of a no-show and none of a cancellation', () => {
    const noShow = reservation({ id: 'n', checkIn: '2026-09-20', checkOut: '2026-09-25', status: 'NO_SHOW' })
    const cancelled = reservation({ id: 'x', checkIn: '2026-09-20', checkOut: '2026-09-25', status: 'CANCELLED' })
    expect(roomNightsSold([noShow, cancelled], september)).toBe(1)
    expect(roomNightsSold([noShow], { start: '2026-09-21', end: '2026-09-30' })).toBe(0)
  })

  it('breaks room-nights down by room type', () => {
    const stays = [
      reservation({ id: 'a', roomTypeId: 1, checkIn: '2026-09-10', checkOut: '2026-09-12' }),
      reservation({ id: 'b', roomTypeId: 4, roomId: '', checkIn: '2026-09-10', checkOut: '2026-09-15' }),
    ]
    expect(roomNightsByType(stays, september)).toEqual([
      { roomTypeId: 4, nights: 5 },
      { roomTypeId: 1, nights: 2 },
    ])
  })
})

describe('zënia', () => {
  it('removes maintenance and inactive rooms from available room-nights', () => {
    const rooms = [
      room('101'),
      room('102', { blocks: [{ id: 1, startsOn: '2026-09-02', endsOn: '2026-09-04', type: 'maintenance' }] }),
      room('103', { isActive: false }),
    ]
    const period = { start: '2026-09-01', end: '2026-09-05' }
    const stays = [reservation({ id: 'a', roomId: '101', checkIn: '2026-09-01', checkOut: '2026-09-06' })]
    const result = occupancy(stays, rooms, period)
    expect(result.activeRooms).toBe(2)
    expect(result.blocked).toBe(2)
    expect(result.available).toBe(2 * 5 - 2)
    expect(result.sold).toBe(5)
    expect(result.rate).toBeCloseTo(5 / 8)
    expect(result.nights.find((night) => night.day === '2026-09-02')).toEqual({
      day: '2026-09-02',
      sold: 1,
      available: 1,
      blocked: 1,
    })
  })

  it('returns null rate when nothing is available', () => {
    expect(occupancy([], [], september).rate).toBeNull()
  })

  it('groups nights into months', () => {
    const result = occupancy(
      [reservation({ id: 'a', checkIn: '2026-09-30', checkOut: '2026-10-02' })],
      [room('101')],
      { start: '2026-09-29', end: '2026-10-01' },
    )
    expect(occupancyByMonth(result.nights)).toEqual([
      { month: '2026-09-01', sold: 1, available: 2 },
      { month: '2026-10-01', sold: 1, available: 1 },
    ])
  })
})

describe('të ardhurat e fituara', () => {
  it('splits integer cents so the parts always add up to the total', () => {
    expect(nightlyCents(10000, 3)).toEqual([3334, 3333, 3333])
    expect(nightlyCents(10000, 0)).toEqual([])
  })

  it('splits a month-crossing stay by night date', () => {
    const stay = reservation({ id: 'a', checkIn: '2026-09-29', checkOut: '2026-10-03', totalCents: 40000 })
    const sep = earnedRevenue([stay], september, '2026-12-31')
    const oct = earnedRevenue([stay], october, '2026-12-31')
    expect(sep.totals).toEqual([{ currency: 'EUR', cents: 20000 }])
    expect(oct.totals).toEqual([{ currency: 'EUR', cents: 20000 }])
    const both = earnedRevenue([stay], { start: '2026-09-01', end: '2026-10-31' }, '2026-12-31')
    expect(both.byMonth).toEqual([
      { month: '2026-09-01', amounts: [{ currency: 'EUR', cents: 20000 }] },
      { month: '2026-10-01', amounts: [{ currency: 'EUR', cents: 20000 }] },
    ])
    expect(both.nights).toBe(4)
  })

  it('excludes cancelled stays and earns only the first night of a no-show', () => {
    const list = [
      reservation({ id: 'x', checkIn: '2026-09-10', checkOut: '2026-09-12', status: 'CANCELLED', totalCents: 99900 }),
      reservation({ id: 'n', checkIn: '2026-09-10', checkOut: '2026-09-13', status: 'NO_SHOW', totalCents: 30000 }),
    ]
    expect(earnedRevenue(list, september, TODAY).totals).toEqual([{ currency: 'EUR', cents: 10000 }])
  })

  it('keeps currencies apart', () => {
    const list = [
      reservation({ id: 'e', checkIn: '2026-09-10', checkOut: '2026-09-12', totalCents: 12000 }),
      reservation({ id: 'l', checkIn: '2026-09-10', checkOut: '2026-09-12', totalCents: 2000000, currency: 'ALL' }),
    ]
    const result = earnedRevenue(list, september, TODAY)
    expect(result.totals).toEqual([
      { currency: 'EUR', cents: 12000 },
      { currency: 'ALL', cents: 2000000 },
    ])
  })

  it('stops earned at today and forecasts only confirmed nights after it', () => {
    const list = [
      reservation({ id: 'h', status: 'IN_HOUSE', checkIn: '2026-09-20', checkOut: '2026-09-24', totalCents: 40000 }),
      reservation({ id: 'c', status: 'COMPLETED', checkIn: '2026-09-25', checkOut: '2026-09-26', totalCents: 5000 }),
    ]
    const earned = earnedRevenue(list, september, TODAY)
    const forecast = forecastRevenue(list, september, TODAY)
    expect(amountIn(earned.totals, 'EUR')).toBe(20000)
    expect(amountIn(forecast.totals, 'EUR')).toBe(20000)
    expect(forecast.nights).toBe(2)
    expect(forecast.window).toEqual({ start: '2026-09-22', end: '2026-09-30' })
    expect(forecastRevenue(list, { start: '2026-08-01', end: '2026-08-31' }, TODAY).window).toBeNull()
  })
})

describe('paratë e arkëtuara', () => {
  const list = [
    payment({ id: 'p1', amountCents: 10000, paidAt: '2026-09-05', method: 'cash' }),
    payment({ id: 'p2', amountCents: 5000, paidAt: '2026-09-06T10:30:00+02:00', method: 'card' }),
    payment({ id: 'p3', amountCents: 2000, paidAt: '2026-09-07', method: 'card', kind: 'refund' }),
    payment({ id: 'p4', amountCents: 700000, paidAt: '2026-09-07', currency: 'ALL' }),
    payment({ id: 'p5', amountCents: 9999, paidAt: '2026-10-01' }),
  ]

  it('groups by payment date, method and currency with refunds negative', () => {
    const [eur, all] = collectedCash(list, september)
    expect(eur?.currency).toBe('EUR')
    expect(eur?.payments).toEqual({ cash: 10000, card: 5000, bank_transfer: 0 })
    expect(eur?.refunds.card).toBe(-2000)
    expect(eur?.refundsCents).toBe(-2000)
    expect(eur?.netCents).toBe(13000)
    expect(all).toMatchObject({ currency: 'ALL', netCents: 700000, refundsCents: 0 })
  })
})

describe('detyrimet dhe burimet', () => {
  const list = [
    reservation({ id: 'a', checkIn: '2026-09-10', checkOut: '2026-09-12', totalCents: 20000, paidCents: 5000 }),
    reservation({ id: 'b', checkIn: '2026-09-10', checkOut: '2026-09-12', totalCents: 20000, paidCents: 0, status: 'CANCELLED' }),
    reservation({ id: 'c', checkIn: '2026-10-10', checkOut: '2026-10-12', totalCents: 20000, paidCents: 0 }),
    reservation({ id: 'd', checkIn: '2026-09-12', checkOut: '2026-09-14', totalCents: 900000, currency: 'ALL', source: 'RECEPSION' }),
    reservation({ id: 'e', checkIn: '2026-09-15', checkOut: '2026-09-16', totalCents: 8000, paidCents: 8000, source: 'BOOKING' }),
  ]

  it('lists positive balances on non-cancelled stays arrived by the end date, per currency', () => {
    const groups = outstandingBalances(list, '2026-09-30')
    expect(groups.map((group) => [group.currency, group.totalCents])).toEqual([
      ['EUR', 15000],
      ['ALL', 900000],
    ])
    expect(groups[0]?.rows.map((row) => row.reservation.id)).toEqual(['a'])
  })

  it('splits booking value by source on check-in date without summing currencies', () => {
    const rows = channelMix(list, september)
    expect(rows.map((row) => [row.source, row.count, row.cancelled])).toEqual([
      ['BOOKING', 1, 0],
      ['TELEFON', 1, 1],
      ['RECEPSION', 1, 0],
    ])
    expect(rows[2]?.value).toEqual([{ currency: 'ALL', cents: 900000 }])
  })

  it('applies filters to payments through their reservation', () => {
    const report = buildReport({
      reservations: list,
      rooms: [room('101')],
      payments: [
        payment({ id: 'p1', reservationId: 'a', amountCents: 5000, paidAt: '2026-09-10' }),
        payment({ id: 'p2', reservationId: 'e', amountCents: 8000, paidAt: '2026-09-15' }),
      ],
      period: september,
      filters: { roomTypeId: null, source: 'BOOKING' },
      today: TODAY,
    })
    expect(report.payments.map((item) => item.id)).toEqual(['p2'])
    expect(report.collected[0]?.netCents).toBe(8000)
    expect(report.currencies).toEqual(['EUR'])
  })
})

describe('csv', () => {
  it('writes a BOM, escapes separators and neutralises formulas', () => {
    const csv = toCsv([
      ['Mysafiri', 'Shuma'],
      ['Koli; Ana', centsToDecimal(-123456)],
      ['=HYPERLINK("x")', centsToDecimal(5)],
    ])
    expect(csv.startsWith('\uFEFF')).toBe(true)
    expect(csv).toBe('\uFEFFMysafiri;Shuma\r\n"Koli; Ana";-1234,56\r\n"\'=HYPERLINK(""x"")";0,05\r\n')
  })
})
