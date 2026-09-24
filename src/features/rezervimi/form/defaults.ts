import { DESK_SOURCES, type DeskSource, type Reservation, type ReservationSource } from '@/types/domain'
import { dayIndex } from '@/lib/date/calendar'
import { centsToInput } from '@/lib/format/money'
import { splitPhone } from '@/lib/phone'
import type { ModalState } from '@/store/uiStore'
import type { ReservationFormValues } from '@/features/rezervimi/reservationSchema'

export function deskSource(source: ReservationSource): DeskSource {
  return DESK_SOURCES.includes(source as DeskSource) ? (source as DeskSource) : 'TELEFON'
}

export function buildDefaults(modal: ModalState, reservation?: Reservation): ReservationFormValues {
  if (modal?.mode === 'edit' && reservation) {
    const phone = splitPhone(reservation.phonePrefix, reservation.phone)
    return {
      roomId: reservation.roomId,
      roomTypeId: reservation.roomTypeId ? String(reservation.roomTypeId) : '',
      guestName: reservation.guestName,
      phonePrefix: phone.prefix,
      phone: phone.phone,
      registerCustomer: true,
      persons: reservation.persons,
      source: deskSource(reservation.source),
      nights: Math.max(1, dayIndex(reservation.checkIn, reservation.checkOut)),
      total: centsToInput(reservation.totalCents),
      notes: reservation.notes ?? '',
    }
  }
  if (modal?.mode === 'create') {
    return {
      roomId: modal.roomId,
      roomTypeId: '',
      guestName: '',
      phonePrefix: '+355',
      phone: '',
      registerCustomer: true,
      persons: 2,
      source: 'TELEFON',
      nights: modal.nights,
      total: '',
      notes: '',
    }
  }
  return {
    roomId: '101',
    roomTypeId: '',
    guestName: '',
    phonePrefix: '+355',
    phone: '',
    registerCustomer: true,
    persons: 2,
    source: 'TELEFON',
    nights: 1,
    total: '',
    notes: '',
  }
}
