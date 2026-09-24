import { z } from 'zod'
import { nationalPhone } from '@/lib/phone'
import { DESK_SOURCES } from '@/types/domain'

export const reservationFields = z.object({
  roomId: z.string(),
  roomTypeId: z.string(),
  guestName: z.string().trim().min(1),
  phonePrefix: z.string(),
  phone: z.string(),
  registerCustomer: z.boolean(),
  persons: z.number().int().min(1).max(6),
  source: z.enum(DESK_SOURCES),
  nights: z.number().int().min(1).max(30),
  total: z.string(),
  notes: z.string(),
})

export type ReservationFormValues = z.infer<typeof reservationFields>

export function createReservationSchema(nameMessage: string, phoneMessage: string) {
  return reservationFields
    .extend({
      guestName: z.string().trim().min(1, nameMessage),
    })
    .refine((values) => values.roomId.length > 0 || values.roomTypeId.length > 0, {
      path: ['roomTypeId'],
    })
    .refine((values) => !values.registerCustomer || nationalPhone(values.phone).length >= 6, {
      path: ['phone'],
      message: phoneMessage,
    })
}
