import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { insertReservation, patchReservation } from '@/lib/api/cache'
import type { Reservation } from '@/types/domain'

function reservation(partial: Partial<Reservation> = {}): Reservation {
  return {
    id: 'r1',
    roomId: '101',
    guestName: 'Ana',
    phone: '',
    persons: 2,
    checkIn: '2026-09-21',
    checkOut: '2026-09-24',
    status: 'RESERVED',
    source: 'DIREKT',
    totalCents: 100,
    paidCents: 0,
    createdAt: '2026-09-01T09:00:00Z',
    ...partial,
  }
}

describe('reservation cache', () => {
  it('patches a stay inside the visible range', () => {
    const client = new QueryClient()
    const key = ['reservations', '2026-09-01', '2026-10-01'] as const
    client.setQueryData(key, [reservation()])
    patchReservation(client, 'r1', { status: 'IN_HOUSE' })
    expect(client.getQueryData<Reservation[]>(key)?.[0]?.status).toBe('IN_HOUSE')
  })

  it('inserts a stay only when it overlaps the range', () => {
    const client = new QueryClient()
    const key = ['reservations', '2026-09-01', '2026-10-01'] as const
    client.setQueryData(key, [])
    insertReservation(client, reservation({ id: 'r2', checkIn: '2026-11-01', checkOut: '2026-11-03' }))
    expect(client.getQueryData<Reservation[]>(key)).toEqual([])
    insertReservation(client, reservation({ id: 'r3' }))
    expect(client.getQueryData<Reservation[]>(key)).toHaveLength(1)
  })
})
