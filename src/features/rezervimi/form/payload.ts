import type { CreateReservationInput, UpdateReservationInput } from '@/types/domain'
import { addDaysIso } from '@/lib/date/calendar'
import { eurosToCents } from '@/lib/format/money'
import { nationalPhone } from '@/lib/phone'
import type { ReservationFormValues } from '@/features/rezervimi/reservationSchema'

function contact(values: ReservationFormValues, clearPhone: boolean) {
  const phone = nationalPhone(values.phone)
  const registerCustomer = Boolean(values.registerCustomer && phone.length >= 6)
  if (!phone) {
    return clearPhone ? { phone: '', registerCustomer: false } : { registerCustomer: false }
  }
  return { phonePrefix: values.phonePrefix, phone, registerCustomer }
}

export function stayCreateBody(values: ReservationFormValues, checkIn: string): CreateReservationInput {
  return {
    ...(values.roomId ? { roomId: values.roomId } : { roomTypeId: Number(values.roomTypeId) }),
    guestName: values.guestName.trim(),
    ...contact(values, false),
    persons: values.persons,
    source: values.source,
    checkIn,
    nights: values.nights,
    totalCents: eurosToCents(values.total),
    notes: values.notes.trim() || undefined,
  }
}

export function stayUpdatePatch(values: ReservationFormValues, checkIn: string): UpdateReservationInput {
  return {
    ...(values.roomId ? { roomId: values.roomId } : {}),
    guestName: values.guestName.trim(),
    ...contact(values, true),
    persons: values.persons,
    checkIn,
    checkOut: addDaysIso(checkIn, values.nights),
    totalCents: eurosToCents(values.total),
    notes: values.notes.trim(),
  }
}
