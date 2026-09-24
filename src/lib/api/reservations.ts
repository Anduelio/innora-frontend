import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateReservationInput, Reservation, UpdateReservationInput } from '@/types/domain'
import { addDaysIso } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
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

export function createReservation(input: CreateReservationInput): Promise<Reservation> {
  return api<Reservation>('/api/reservations', { method: 'POST', body: JSON.stringify(input) })
}

export function updateReservation(id: string, patch: UpdateReservationInput): Promise<Reservation> {
  return api<Reservation>(`/api/reservations/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
}

export function checkInReservation(id: string): Promise<Reservation> {
  return api<Reservation>(`/api/reservations/${id}/check-in`, { method: 'POST' })
}

export function checkOutReservation(id: string): Promise<Reservation> {
  return api<Reservation>(`/api/reservations/${id}/check-out`, { method: 'POST' })
}

export function cancelReservation(id: string): Promise<Reservation> {
  return api<Reservation>(`/api/reservations/${id}/cancel`, { method: 'POST' })
}

export function draftReservation(input: CreateReservationInput): Reservation {
  return {
    id: `tmp-${crypto.randomUUID()}`,
    roomId: input.roomId ?? '',
    guestName: input.guestName.trim(),
    phonePrefix: input.phonePrefix,
    phone: input.phone?.trim() ?? '',
    persons: input.persons,
    checkIn: input.checkIn,
    checkOut: addDaysIso(input.checkIn, input.nights),
    status: 'RESERVED',
    source: input.source ?? 'DIREKT',
    totalCents: input.totalCents,
    paidCents: 0,
    notes: input.notes?.trim() || undefined,
    expectedArrival: '14:00',
    createdAt: new Date().toISOString(),
  }
}

function useReservationMutation<TVariables>(
  mutationFn: (variables: TVariables) => Promise<Reservation>,
  optimistic: (qc: ReturnType<typeof useQueryClient>, variables: TVariables) => void,
) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onMutate: async (variables: TVariables) => {
      await qc.cancelQueries({ queryKey: ['reservations'] })
      const prev = snapshotReservations(qc)
      optimistic(qc, variables)
      return { prev }
    },
    onError: (_error, _variables, context) => {
      if (context) restoreReservations(qc, context.prev)
    },
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: ['reservations'] })
      await qc.invalidateQueries({ queryKey: ['guests'] })
      await qc.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}

export function useReservations(from: string, to: string) {
  return useQuery({
    queryKey: ['reservations', from, to] as const,
    queryFn: () => fetchReservations(from, to),
    placeholderData: (previous) => previous,
  })
}

export function useCreateReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createReservation,
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
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: ['reservations'] })
      await qc.invalidateQueries({ queryKey: ['guests'] })
      await qc.invalidateQueries({ queryKey: ['rooms'] })
    },
  })
}

export function useUpdateReservation() {
  return useReservationMutation(
    ({ id, patch }: { id: string; patch: UpdateReservationInput }) => updateReservation(id, patch),
    (qc, { id, patch }) => {
      const current = findCached(qc, id)
      if (!current) return
      upsertReservation(qc, { ...current, ...patch })
    },
  )
}

const hotelFrom = addDaysIso(TODAY, -30)
const hotelTo = addDaysIso(TODAY, 90)

export function useHotelReservations() {
  return useReservations(hotelFrom, hotelTo)
}

export function useKnownReservations() {
  const view = useCalendarStore((state) => state.view)
  const startDate = useCalendarStore((state) => state.startDate)
  const hotel = useHotelReservations()
  const visible = useReservations(startDate, addDaysIso(startDate, view))
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

function findCached(qc: ReturnType<typeof useQueryClient>, id: string): Reservation | undefined {
  for (const [, list] of snapshotReservations(qc)) {
    const found = list?.find((reservation) => reservation.id === id)
    if (found) return found
  }
  return undefined
}

export function useCheckIn() {
  const qc = useQueryClient()
  return useReservationMutation(checkInReservation, (_client, id) => {
    const current = findCached(qc, id)
    if (current) upsertReservation(qc, { ...current, status: 'IN_HOUSE' })
  })
}

export function useCheckOut() {
  const qc = useQueryClient()
  return useReservationMutation(checkOutReservation, (_client, id) => {
    const current = findCached(qc, id)
    if (current) upsertReservation(qc, { ...current, status: 'COMPLETED' })
  })
}

export function useAssignReservation() {
  return useReservationMutation(
    ({ id, roomId }: { id: string; roomId: string }) =>
      api<Reservation>(`/api/reservations/${id}/assign`, { method: 'POST', body: JSON.stringify({ roomId }) }),
    (qc, { id, roomId }) => {
      const current = findCached(qc, id)
      if (current) upsertReservation(qc, { ...current, roomId })
    },
  )
}

export function useCancelReservation() {
  const qc = useQueryClient()
  return useReservationMutation(cancelReservation, (_client, id) => {
    const current = findCached(qc, id)
    if (current) upsertReservation(qc, { ...current, status: 'CANCELLED' })
  })
}
