import { describe, expect, it } from 'vitest'
import { deskQuery, deskRows, isArrivalOn, isDepartureOn, isInHouseOn } from '@/lib/desk'
import type { Reservation } from '@/types/domain'

function stay(partial: Partial<Reservation> = {}): Reservation {
  return {
    id: 'r1',
    roomId: '101',
    guestName: 'Ana',
    phone: '',
    persons: 2,
    checkIn: '2026-09-21',
    checkOut: '2026-09-24',
    status: 'RESERVED',
    source: 'TELEFON',
    totalCents: 100,
    paidCents: 0,
    createdAt: '2026-09-01T09:00:00Z',
    ...partial,
  }
}

describe('desk filters', () => {
  const wide = [
    stay(),
    stay({ id: 'out', checkIn: '2026-09-19', checkOut: '2026-09-21', status: 'IN_HOUSE' }),
    stay({ id: 'cancelled', status: 'CANCELLED' }),
    stay({ id: 'open', roomId: '', status: 'RESERVED' }),
    stay({ id: 'later', checkIn: '2026-09-26', checkOut: '2026-09-28' }),
  ]

  it('keeps the checkout morning free', () => {
    const leaving = stay({ checkIn: '2026-09-19', checkOut: '2026-09-21', status: 'IN_HOUSE' })
    expect(isInHouseOn(leaving, '2026-09-20')).toBe(true)
    expect(isInHouseOn(leaving, '2026-09-21')).toBe(false)
    expect(isDepartureOn(leaving, '2026-09-21')).toBe(true)
  })

  it('narrows an unfiltered payload', () => {
    expect(deskRows(wide, (item) => isArrivalOn(item, '2026-09-21')).map((item) => item.id)).toEqual(['r1', 'open'])
    expect(deskRows(wide, (item) => isInHouseOn(item, '2026-09-21')).map((item) => item.id)).toEqual(['r1'])
    expect(deskRows(wide, (item) => isDepartureOn(item, '2026-09-21')).map((item) => item.id)).toEqual(['out'])
  })

  it('builds the desk query', () => {
    expect(deskQuery({ departingOn: '2026-09-21', inHouseOn: '2026-09-21' })).toBe(
      '/api/reservations?no_pagination=1&departing_on=2026-09-21&in_house_on=2026-09-21',
    )
  })
})
