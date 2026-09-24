import { z } from 'zod'
import { DESK_SOURCES } from '@/types/domain'

export const reservationFields = z.object({
  roomId: z.string(),
  roomTypeId: z.string(),
  guestName: z.string().trim().min(1),
  phone: z.string(),
  persons: z.number().int().min(1).max(6),
  source: z.enum(DESK_SOURCES),
  nights: z.number().int().min(1).max(30),
  total: z.string(),
  notes: z.string(),
})

export type ReservationFormValues = z.infer<typeof reservationFields>

export function createReservationSchema(message: string) {
  return reservationFields
    .extend({
      guestName: z.string().trim().min(1, message),
    })
    .refine((values) => values.roomId.length > 0 || values.roomTypeId.length > 0, {
      path: ['roomTypeId'],
    })
}
