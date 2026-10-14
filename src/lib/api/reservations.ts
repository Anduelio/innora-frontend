import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CreateReservationInput,
  RecordPaymentInput,
  Reservation,
  UpdateReservationInput,
} from '@/types/domain'
import { addDaysIso } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { stayNights } from '@/lib/reservation'
import { useCalendarStore } from '@/store/calendarStore'
import { api } from '@/lib/api/client'
import {
  insertReservation,
  replaceReservation,
  restoreReservations,
  snapshotReservations,
  upsertReservation,
} from '@/lib/api/cache'

export function fetchReservations(from: string, to: string): Promise<Reservation[]> {
  const params = new URLSearchParams({ from, to, no_pagination: '1' })
  return api<Reservation[]>(`/api/reservations?${params.toString()}`)
}

const post = (path: string, body?: unknown) =>
  api<Reservation>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) })

export function draftReservation(input: CreateReservationInput): Reservation {
  return {
    id: `tmp-${crypto.randomUUID()}`,
    code: '…',
    roomId: input.roomId ?? '',
    roomTypeId: input.roomTypeId,
    guestName: input.guestName.trim(),
    phonePrefix: input.phonePrefix,
    phone: input.phone?.trim() ?? '',
    currency: input.currency,
    persons: input.persons,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
    status: 'RESERVED',
    source: input.source,
    totalCents: input.pricePerNightCents * Math.max(1, stayNights(input)),
    paidCents: input.initialPayment?.amountCents ?? 0,
    notes: input.notes?.trim() || undefined,
    createdAt: new Date().toISOString(),
  }
}

type Client = ReturnType<typeof useQueryClient>

function findCached(qc: Client, id: string): Reservation | undefined {
  for (const [, list] of snapshotReservations(qc)) {
    const found = list?.find((reservation) => reservation.id === id)
    if (found) return found
  }
  return undefined
}

async function refresh(qc: Client) {
  await Promise.all([
    qc.invalidateQueries({ queryKey: ['reservations'] }),
    qc.invalidateQueries({ queryKey: ['payments'] }),
    qc.invalidateQueries({ queryKey: ['guests'] }),
  ])
}

function useReservationMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<Reservation>,
  optimistic: (current: Reservation, variables: TVariables) => Partial<Reservation>,
  idOf: (variables: TVariables) => string,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onMutate: async (variables: TVariables) => {
      await qc.cancelQueries({ queryKey: ['reservations'] })
      const prev = snapshotReservations(qc)
      const current = findCached(qc, idOf(variables))
      if (current) upsertReservation(qc, { ...current, ...optimistic(current, variables) })
      return { prev }
    },
    onError: (_error, _variables, context) => {
      if (context) restoreReservations(qc, context.prev)
    },
    onSuccess: (reservation) => upsertReservation(qc, reservation),
    onSettled: () => refresh(qc),
  })
}

export function useReservations(from: string, to: string) {
  return useQuery({
    queryKey: ['reservations', from, to] as const,
    queryFn: () => fetchReservations(from, to),
    placeholderData: (previous) => previous,
  })
}

const hotelFrom = addDaysIso(TODAY, -60)
const hotelTo = addDaysIso(TODAY, 365)

/** Gjithë rezervimet që recepsioni ka nevojë: 60 ditë prapa, një vit përpara. */
export function useHotelReservations() {
  return useReservations(hotelFrom, hotelTo)
}

export function useKnownReservations() {
  const view = useCalendarStore((state) => state.view)
  const startDate = useCalendarStore((state) => state.startDate)
  const hotel = useHotelReservations()
  const visible = useReservations(startDate, addDaysIso(startDate, Math.max(view, 1)))
  const merged = new Map<string, Reservation>()
  for (const item of hotel.data ?? []) merged.set(item.id, item)
  for (const item of visible.data ?? []) merged.set(item.id, item)
  const reservations = [...merged.values()]
  return {
    reservations,
    isLoading: reservations.length === 0 && (hotel.isLoading || visible.isLoading),
    isError: reservations.length === 0 && hotel.isError && visible.isError,
  }
}

export function useCreateReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateReservationInput) => post('/api/reservations', input),
    onMutate: async (input: CreateReservationInput) => {
      await qc.cancelQueries({ queryKey: ['reservations'] })
      const prev = snapshotReservations(qc)
      const draft = draftReservation(input)
      insertReservation(qc, draft)
      return { prev, tempId: draft.id }
    },
    onError: (_error, _input, context) => {
      if (context) restoreReservations(qc, context.prev)
    },
    onSuccess: (created, _input, context) => {
      if (context) replaceReservation(qc, context.tempId, created)
    },
    onSettled: () => refresh(qc),
  })
}

export function useUpdateReservation() {
  return useReservationMutation(
    ({ id, patch }: { id: string; patch: UpdateReservationInput }) =>
      api<Reservation>(`/api/reservations/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
    (_current, { patch }) => patch,
    ({ id }) => id,
  )
}

export function useAssignRoom() {
  return useReservationMutation(
    ({ id, roomId }: { id: string; roomId: string }) => post(`/api/reservations/${id}/assign-room`, { roomId }),
    (_current, { roomId }) => ({ roomId }),
    ({ id }) => id,
  )
}

export function useCheckIn() {
  return useReservationMutation(
    (id: string) => post(`/api/reservations/${id}/check-in`),
    () => ({ status: 'IN_HOUSE' }),
    (id) => id,
  )
}

export function useCheckOut() {
  return useReservationMutation(
    (id: string) => post(`/api/reservations/${id}/check-out`),
    () => ({ status: 'COMPLETED' }),
    (id) => id,
  )
}

export function useNoShow() {
  return useReservationMutation(
    (id: string) => post(`/api/reservations/${id}/no-show`),
    () => ({ status: 'NO_SHOW' }),
    (id) => id,
  )
}

export function useCancelReservation() {
  return useReservationMutation(
    ({ id, reason }: { id: string; reason: string }) => post(`/api/reservations/${id}/cancel`, { reason }),
    (_current, { reason }) => ({ status: 'CANCELLED', cancelReason: reason }),
    ({ id }) => id,
  )
}

export function useRecordPayment() {
  return useReservationMutation(
    ({ id, input }: { id: string; input: RecordPaymentInput }) => post(`/api/reservations/${id}/payments`, input),
    (current, { input }) => ({
      paidCents: current.paidCents + (input.kind === 'refund' ? -input.amountCents : input.amountCents),
    }),
    ({ id }) => id,
  )
}
