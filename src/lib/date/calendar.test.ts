import { describe, expect, it } from 'vitest'
import { dayIndex, fmtDate, monthSpanLabel, placeBlock, startOfWeekIso } from '@/lib/date/calendar'
import { freeRoomsForStay, maxFreeNights, typeFreeForStay, typeFreeOn } from '@/lib/inventory'
import type { Reservation, Room } from '@/types/domain'

const months = ['Janar', 'Shkurt', 'Mars', 'Prill', 'Maj', 'Qershor', 'Korrik', 'Gusht', 'Shtator', 'Tetor', 'Nëntor', 'Dhjetor']
const monthsShort = ['Jan', 'Shk', 'Mar', 'Pri', 'Maj', 'Qer', 'Kor', 'Gus', 'Sht', 'Tet', 'Nën', 'Dhj']

const rooms: Room[] = [
  { id: '201', roomTypeId: 1, type: 'Dhomë dyshe', capacity: 2 },
  { id: '202', roomTypeId: 1, type: 'Dhomë dyshe', capacity: 2 },
  {
    id: '203',
    roomTypeId: 1,
    type: 'Dhomë dyshe',
    capacity: 2,
    blocks: [{ id: 1, startsOn: '2026-09-22', endsOn: '2026-09-24', type: 'maintenance' }],
  },
]

function reservation(partial: Pick<Reservation, 'id' | 'roomId' | 'checkIn' | 'checkOut' | 'status'>): Reservation {
  return {
    code: partial.id,
    roomTypeId: 1,
    guestName: 'Test',
    phone: '',
    currency: 'EUR',
    persons: 2,
    source: 'TELEFON',
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
  })

  it('hides stays outside the range', () => {
    expect(
      placeBlock({ checkIn: '2026-10-06', checkOut: '2026-10-08', rangeStart: '2026-09-21', rangeEnd: '2026-10-05', colW: 98 }),
    ).toBeNull()
  })

  it('formats hotel dates and starts weeks on Monday', () => {
    expect(fmtDate('2026-09-21')).toBe('21.09.2026')
    expect(startOfWeekIso('2026-09-27')).toBe('2026-09-21')
    expect(monthSpanLabel('2026-09-21', 14, months, monthsShort)).toBe('Sht – Tet 2026')
  })
})

describe('inventari', () => {
  it('limits nights to the next stay and ignores cancelled ones', () => {
    const stays = [
      reservation({ id: 'a', roomId: '201', checkIn: '2026-09-23', checkOut: '2026-09-27', status: 'RESERVED' }),
      reservation({ id: 'b', roomId: '201', checkIn: '2026-09-22', checkOut: '2026-09-24', status: 'CANCELLED' }),
    ]
    expect(maxFreeNights(stays, rooms[0], '2026-09-21')).toBe(2)
    expect(dayIndex('2026-09-21', '2026-09-23')).toBe(2)
  })

  it('counts an unassigned booking against its room type', () => {
    const stays = [reservation({ id: 'u', roomId: '', checkIn: '2026-09-21', checkOut: '2026-09-23', status: 'RESERVED' })]
    expect(typeFreeOn(1, '2026-09-21', rooms, stays)).toBe(2)
  })

  it('frees the night of departure for same-day turnover', () => {
    const stays = [reservation({ id: 'x', roomId: '201', checkIn: '2026-09-20', checkOut: '2026-09-21', status: 'IN_HOUSE' })]
    expect(freeRoomsForStay('2026-09-21', '2026-09-22', rooms, stays).map((room) => room.id)).toContain('201')
  })

  it('takes a maintenance block out of the count', () => {
    expect(typeFreeForStay(1, '2026-09-22', '2026-09-23', rooms, [])).toBe(2)
    expect(freeRoomsForStay('2026-09-21', '2026-09-24', rooms, []).map((room) => room.id)).toEqual(['201', '202'])
  })

  it('releases a no-show after the first night', () => {
    const stays = [reservation({ id: 'n', roomId: '201', checkIn: '2026-09-20', checkOut: '2026-09-23', status: 'NO_SHOW' })]
    expect(typeFreeOn(1, '2026-09-21', rooms, stays)).toBe(3)
  })
})
