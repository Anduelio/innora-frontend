import type { Contact, Customer, Reservation, ReservationSource } from '@/types/domain'
import { dayIndex } from '@/lib/date/calendar'
import { balanceCents } from '@/lib/reservation'

/** Çelësi që njeh të njëjtin person: telefoni, ndryshe email-i, ndryshe emri. */
export function customerKey(reservation: Pick<Reservation, 'guestName' | 'phone' | 'email'>): string {
  const digits = reservation.phone.replace(/\D/g, '')
  if (digits.length >= 7) return `tel:${digits}`
  const email = reservation.email?.trim().toLowerCase()
  if (email) return `mail:${email}`
  return `name:${reservation.guestName.trim().toLowerCase()}`
}

/** Njëlloj si `customerKey`, por për një kontakt të shtuar me dorë. */
export function contactKey(contact: Pick<Contact, 'name' | 'phone' | 'email'>): string {
  return customerKey({ guestName: contact.name, phone: contact.phone, email: contact.email })
}

function addAmount(list: { currency: string; cents: number }[], currency: string, cents: number) {
  const found = list.find((item) => item.currency === currency)
  if (found) found.cents += cents
  else list.push({ currency, cents })
}

/**
 * Ndërton listën e klientëve nga gjithë rezervimet. Anulimet numërohen veçmas,
 * mospërfaqësimet nuk hyjnë te qëndrimet dhe monedhat nuk mblidhen kurrë bashkë.
 */
export function buildCustomers(
  reservations: readonly Reservation[],
  today: string,
  contacts: readonly Contact[] = [],
): Customer[] {
  const sorted = [...reservations].sort((a, b) => b.checkIn.localeCompare(a.checkIn) || b.id.localeCompare(a.id))
  const map = new Map<string, Customer>()

  for (const reservation of sorted) {
    const key = customerKey(reservation)
    let customer = map.get(key)
    if (!customer) {
      customer = {
        id: key,
        name: reservation.guestName,
        phone: reservation.phone,
        email: reservation.email ?? null,
        bookings: 0,
        stays: 0,
        upcoming: 0,
        cancelled: 0,
        noShows: 0,
        nights: 0,
        firstStay: reservation.checkIn,
        lastStay: reservation.checkIn,
        inHouse: false,
        sources: [],
        value: [],
        balance: [],
        reservations: [],
        contactId: null,
        notes: null,
        addedAt: null,
      }
      map.set(key, customer)
    }
    customer.reservations.push(reservation)
    customer.email ??= reservation.email ?? null
    if (reservation.checkIn < customer.firstStay) customer.firstStay = reservation.checkIn

    if (reservation.status === 'CANCELLED') {
      customer.cancelled += 1
      continue
    }
    if (reservation.status === 'NO_SHOW') customer.noShows += 1
    customer.bookings += 1
    if (!customer.sources.includes(reservation.source)) customer.sources.push(reservation.source)
    addAmount(customer.value, reservation.currency, reservation.totalCents)
    const balance = balanceCents(reservation)
    if (balance > 0 && reservation.checkIn <= today) addAmount(customer.balance, reservation.currency, balance)

    if (reservation.status === 'IN_HOUSE') customer.inHouse = true
    if (reservation.status === 'IN_HOUSE' || reservation.status === 'COMPLETED') {
      customer.stays += 1
      customer.nights += Math.max(0, dayIndex(reservation.checkIn, reservation.checkOut))
    } else if (reservation.status === 'RESERVED' && reservation.checkIn >= today) {
      customer.upcoming += 1
    }
  }

  for (const contact of contacts) {
    const key = contactKey(contact)
    const found = map.get(key)
    const addedAt = contact.createdAt.slice(0, 10)
    if (found) {
      found.contactId = contact.id
      found.notes = contact.notes
      found.addedAt = addedAt
      found.email ??= contact.email
      continue
    }
    map.set(key, {
      id: key,
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      bookings: 0,
      stays: 0,
      upcoming: 0,
      cancelled: 0,
      noShows: 0,
      nights: 0,
      firstStay: addedAt,
      lastStay: addedAt,
      inHouse: false,
      sources: [],
      value: [],
      balance: [],
      reservations: [],
      contactId: contact.id,
      notes: contact.notes,
      addedAt,
    })
  }

  return [...map.values()].sort((a, b) => b.lastStay.localeCompare(a.lastStay) || a.name.localeCompare(b.name, 'sq'))
}

export function matchCustomer(customer: Pick<Customer, 'name' | 'phone' | 'email'>, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  const digits = needle.replace(/\D/g, '')
  return (
    customer.name.toLowerCase().includes(needle) ||
    (customer.email ?? '').toLowerCase().includes(needle) ||
    (digits.length >= 3 && customer.phone.replace(/\D/g, '').includes(digits))
  )
}

export type CustomerFilter = 'all' | 'inHouse' | 'upcoming' | 'returning' | 'direct' | 'booking' | 'owing' | 'noBooking'

export function filterCustomer(customer: Customer, filter: CustomerFilter): boolean {
  switch (filter) {
    case 'all':
      return true
    case 'inHouse':
      return customer.inHouse
    case 'upcoming':
      return customer.upcoming > 0
    case 'returning':
      return customer.bookings >= 2
    case 'direct':
      return customer.sources.some((source) => source !== 'BOOKING')
    case 'booking':
      return customer.sources.includes('BOOKING' satisfies ReservationSource)
    case 'owing':
      return customer.balance.length > 0
    case 'noBooking':
      return customer.reservations.length === 0
  }
}

export type CustomerSort = 'recent' | 'name' | 'bookings'

export function sortCustomers(list: readonly Customer[], sort: CustomerSort): Customer[] {
  const copy = [...list]
  if (sort === 'name') return copy.sort((a, b) => a.name.localeCompare(b.name, 'sq'))
  if (sort === 'bookings') {
    return copy.sort((a, b) => b.bookings - a.bookings || b.lastStay.localeCompare(a.lastStay))
  }
  return copy.sort((a, b) => b.lastStay.localeCompare(a.lastStay) || a.name.localeCompare(b.name, 'sq'))
}
