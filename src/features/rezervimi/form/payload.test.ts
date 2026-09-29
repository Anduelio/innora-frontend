import { describe, expect, it } from 'vitest'
import { stayCreateBody, stayUpdatePatch } from '@/features/rezervimi/form/payload'
import type { ReservationFormValues } from '@/features/rezervimi/reservationSchema'

function values(partial: Partial<ReservationFormValues> = {}): ReservationFormValues {
  return {
    roomId: '105',
    roomTypeId: '',
    guestName: ' Elira Duka ',
    phonePrefix: '+355',
    phone: '',
    registerCustomer: false,
    persons: 2,
    source: 'TELEFON',
    nights: 2,
    total: '180',
    notes: '',
    ...partial,
  }
}

describe('stay payload', () => {
  it('creates a phone stay and lets the server add the checkout morning', () => {
    expect(stayCreateBody(values(), '2026-09-21')).toEqual({
      roomId: '105',
      guestName: 'Elira Duka',
      registerCustomer: false,
      persons: 2,
      source: 'TELEFON',
      checkIn: '2026-09-21',
      nights: 2,
      totalCents: 18000,
    })
  })

  it('creates a walk-in stay with a national phone', () => {
    expect(
      stayCreateBody(values({ source: 'RECEPSION', phone: '69 000 0000', registerCustomer: true }), '2026-09-22'),
    ).toMatchObject({
      source: 'RECEPSION',
      phonePrefix: '+355',
      phone: '690000000',
      registerCustomer: true,
      checkIn: '2026-09-22',
      nights: 2,
    })
  })

  it('does not register a customer without a phone', () => {
    expect(stayCreateBody(values({ registerCustomer: true }), '2026-09-21').registerCustomer).toBe(false)
  })

  it('updates with an exclusive checkout date', () => {
    expect(stayUpdatePatch(values({ nights: 3 }), '2026-09-21').checkOut).toBe('2026-09-24')
  })
})
