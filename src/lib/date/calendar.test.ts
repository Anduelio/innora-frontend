import { describe, expect, it } from 'vitest'
import { dayIndex, monthSpanLabel, placeBlock } from '@/lib/date/calendar'
import { maxFreeNights } from '@/lib/stay'
import type { Reservation } from '@/types/domain'

const months = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor']
const monthsShort = ['Jan', 'Shk', 'Mar', 'Pri', 'Maj', 'Qer', 'Kor', 'Gus', 'Sht', 'Tet', 'Nën', 'Dhj']

function reservation(partial: Pick<Reservation, 'id' | 'roomId' | 'checkIn' | 'checkOut' | 'status'>): Reservation {
  return {
    guestName: 'Test',
    phone: '',
    persons: 2,
    source: 'DIREKT',
    totalCents: 0,
    paidCents: 0,
    createdAt: '2026-09-01T09:00:00Z',
    ...partial,
  }
}

describe('kalendari', () => {
  it('places a block with a half-day offset', () => {
    const placed = placeBlock({
      checkIn: '2026-09-21',
      checkOut: '2026-09-24',
      rangeStart: '2026-09-21',
      rangeEnd: '2026-10-05',
      colW: 98,
    })
    const left = 98 * 0.38
    const right = 3 * 98 + 98 * 0.28
    expect(placed?.leftPx).toBeCloseTo(left)
    expect(placed?.widthPx).toBeCloseTo(Math.max(34, right - left - 4))
    expect(placed?.clippedStart).toBe(false)
    expect(placed?.showMeta).toBe(true)
  })

  it('clips a stay that starts before the visible range', () => {
    const placed = placeBlock({
      checkIn: '2026-09-18',
      checkOut: '2026-09-23',
      rangeStart: '2026-09-21',
      rangeEnd: '2026-10-05',
      colW: 98,
    })
    expect(placed?.clippedStart).toBe(true)
    expect(placed?.leftPx).toBe(0)
    expect(placed?.widthPx).toBeCloseTo(Math.max(34, 2 * 98 + 98 * 0.28 - 4))
  })

  it('hides stays outside the range', () => {
    expect(
      placeBlock({
        checkIn: '2026-10-06',
        checkOut: '2026-10-08',
        rangeStart: '2026-09-21',
        rangeEnd: '2026-10-05',
        colW: 98,
      }),
    ).toBeNull()
  })

  it('limits nights to the next stay and ignores cancelled ones', () => {
    const stays = [
      reservation({ id: 'a', roomId: '204', checkIn: '2026-09-23', checkOut: '2026-09-27', status: 'RESERVED' }),
      reservation({ id: 'b', roomId: '204', checkIn: '2026-09-22', checkOut: '2026-09-24', status: 'CANCELLED' }),
    ]
    expect(maxFreeNights(stays, '204', '2026-09-21')).toBe(2)
    expect(dayIndex('2026-09-21', '2026-09-23')).toBe(2)
  })

  it('labels a range that crosses a month', () => {
    expect(monthSpanLabel('2026-09-21', 14, months, monthsShort)).toBe('Sht – Tet 2026')
    expect(monthSpanLabel('2026-09-01', 7, months, monthsShort)).toBe('Shtator 2026')
  })
})
