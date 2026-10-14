import { describe, expect, it } from 'vitest'
import type { Reservation } from '@/types/domain'
import { buildCustomers, customerKey, filterCustomer, matchCustomer, sortCustomers } from '@/lib/customers'

const TODAY = '2026-09-21'

function booking(partial: Partial<Reservation> & Pick<Reservation, 'id' | 'checkIn' | 'checkOut'>): Reservation {
  return {
    code: `DH-${partial.id}`,
    roomId: '101',
    roomTypeId: 1,
    guestName: 'Ana Kola',
    phone: '+355 69 123 4567',
    currency: 'EUR',
    persons: 2,
    status: 'COMPLETED',
    source: 'TELEFON',
    totalCents: 10000,
    paidCents: 10000,
    createdAt: '2026-08-01T09:00:00Z',
    ...partial,
  }
}

describe('customers', () => {
  it('recognises the same person by phone digits, however it is typed', () => {
    const a = customerKey({ guestName: 'Ana', phone: '+355 69 123 4567', email: null })
    const b = customerKey({ guestName: 'Ana K.', phone: '0035569-1234567', email: null })
    expect(a).toBe('tel:355691234567')
    expect(b).not.toBe(a)
    expect(customerKey({ guestName: 'Ana', phone: '355691234567', email: null })).toBe(a)
  })

  it('falls back to email, then to name', () => {
    expect(customerKey({ guestName: 'X', phone: '', email: ' Ana@Mail.com ' })).toBe('mail:ana@mail.com')
    expect(customerKey({ guestName: ' Ana Kola ', phone: '', email: null })).toBe('name:ana kola')
  })

  it('groups repeat guests and counts stays, nights and upcoming separately', () => {
    const list = buildCustomers(
      [
        booking({ id: '1', checkIn: '2026-08-10', checkOut: '2026-08-13' }),
        booking({ id: '2', checkIn: '2026-09-18', checkOut: '2026-09-22', status: 'IN_HOUSE' }),
        booking({ id: '3', checkIn: '2026-10-05', checkOut: '2026-10-07', status: 'RESERVED' }),
        booking({ id: '4', checkIn: '2026-07-01', checkOut: '2026-07-03', status: 'CANCELLED' }),
        booking({
          id: '5',
          guestName: 'Besa Hoxha',
          phone: '',
          checkIn: '2026-09-01',
          checkOut: '2026-09-02',
        }),
      ],
      TODAY,
    )
    expect(list).toHaveLength(2)
    const ana = list.find((item) => item.name === 'Ana Kola')
    expect(ana).toMatchObject({
      bookings: 3,
      stays: 2,
      upcoming: 1,
      cancelled: 1,
      nights: 7,
      inHouse: true,
    })
    expect(ana?.firstStay).toBe('2026-07-01')
    expect(filterCustomer(ana!, 'returning')).toBe(true)
    expect(
      filterCustomer(
        list.find((item) => item.name === 'Besa Hoxha')!,
        'returning',
      ),
    ).toBe(false)
  })

  it('never adds currencies together and ignores cancelled value', () => {
    const [customer] = buildCustomers(
      [
        booking({ id: '1', checkIn: '2026-08-10', checkOut: '2026-08-12', totalCents: 10000 }),
        booking({
          id: '2',
          checkIn: '2026-08-20',
          checkOut: '2026-08-22',
          currency: 'ALL',
          totalCents: 900000,
        }),
        booking({
          id: '3',
          checkIn: '2026-08-25',
          checkOut: '2026-08-26',
          totalCents: 99999,
          status: 'CANCELLED',
        }),
      ],
      TODAY,
    )
    expect(customer?.value).toEqual([
      { currency: 'ALL', cents: 900000 },
      { currency: 'EUR', cents: 10000 },
    ])
  })

  it('reports an open balance only for stays that have started', () => {
    const [customer] = buildCustomers(
      [
        booking({
          id: '1',
          checkIn: '2026-09-19',
          checkOut: '2026-09-22',
          status: 'IN_HOUSE',
          paidCents: 4000,
        }),
        booking({
          id: '2',
          checkIn: '2026-10-05',
          checkOut: '2026-10-07',
          status: 'RESERVED',
          paidCents: 0,
        }),
      ],
      TODAY,
    )
    expect(customer?.balance).toEqual([{ currency: 'EUR', cents: 6000 }])
    expect(filterCustomer(customer!, 'owing')).toBe(true)
  })

  it('searches by name, email or any part of the phone number', () => {
    const [customer] = buildCustomers(
      [booking({ id: '1', checkIn: '2026-08-10', checkOut: '2026-08-12', email: 'ana@mail.al' })],
      TODAY,
    )
    expect(matchCustomer(customer!, 'kola')).toBe(true)
    expect(matchCustomer(customer!, 'ANA@MAIL')).toBe(true)
    expect(matchCustomer(customer!, '69 123')).toBe(true)
    expect(matchCustomer(customer!, 'xhaferi')).toBe(false)
    expect(matchCustomer(customer!, '')).toBe(true)
  })

  it('sorts by recent stay, name or number of bookings', () => {
    const list = buildCustomers(
      [
        booking({
          id: '1',
          guestName: 'Zana',
          phone: '111 111 111',
          checkIn: '2026-09-10',
          checkOut: '2026-09-11',
        }),
        booking({
          id: '2',
          guestName: 'Arben',
          phone: '222 222 222',
          checkIn: '2026-08-10',
          checkOut: '2026-08-11',
        }),
        booking({
          id: '3',
          guestName: 'Arben',
          phone: '222 222 222',
          checkIn: '2026-08-12',
          checkOut: '2026-08-13',
        }),
      ],
      TODAY,
    )
    expect(sortCustomers(list, 'recent').map((c) => c.name)).toEqual(['Zana', 'Arben'])
    expect(sortCustomers(list, 'name').map((c) => c.name)).toEqual(['Arben', 'Zana'])
    expect(sortCustomers(list, 'bookings').map((c) => c.name)).toEqual(['Arben', 'Zana'])
  })

  it('lists a manually added customer who has never booked, and joins them once they do', () => {
    const contact = {
      id: 'c1',
      name: 'Dorina Leka',
      phone: '+355 69 700 1122',
      email: null,
      notes: 'Dhomë e qetë',
      createdAt: '2026-09-20T10:00:00+02:00',
    }
    const [alone] = buildCustomers([], TODAY, [contact])
    expect(alone).toMatchObject({
      name: 'Dorina Leka',
      bookings: 0,
      reservations: [],
      contactId: 'c1',
      notes: 'Dhomë e qetë',
      addedAt: '2026-09-20',
    })
    expect(filterCustomer(alone!, 'noBooking')).toBe(true)
    expect(filterCustomer(alone!, 'all')).toBe(true)
    expect(filterCustomer(alone!, 'returning')).toBe(false)

    const joined = buildCustomers(
      [
        booking({
          id: '9',
          guestName: 'Dorina L.',
          phone: '0035569 700 1122'.replace('00', '+'),
          checkIn: '2026-09-25',
          checkOut: '2026-09-27',
          status: 'RESERVED',
        }),
      ],
      TODAY,
      [contact],
    )
    expect(joined).toHaveLength(1)
    expect(joined[0]).toMatchObject({ bookings: 1, upcoming: 1, contactId: 'c1', notes: 'Dhomë e qetë' })
    expect(filterCustomer(joined[0]!, 'noBooking')).toBe(false)
  })
})
