import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

export type ChargeCategory = {
  id: number
  code: string
  name: string
  isRoom: boolean
}

export type FolioItem = {
  id: number
  categoryCode: string
  description: string
  roomNumber?: string | null
  serviceDate: string
  quantity: number
  unitCents: number
  amountCents: number
  isRoomCharge: boolean
  voidedAt?: string | null
  voidReason?: string | null
}

export type FolioPayment = {
  id: number
  method: string
  amountCents: number
  currency: string
  paidAt: string
  reference?: string | null
  notes?: string | null
  voidedAt?: string | null
}

export type Folio = {
  id: number
  number: string
  status: string
  reservationId: string
  guestName?: string
  roomId?: string
  checkIn?: string
  checkOut?: string
  chargesCents: number
  paymentsCents: number
  balanceCents: number
  currency: string
  items: FolioItem[]
  payments: FolioPayment[]
}

export function useChargeCategories() {
  return useQuery({
    queryKey: ['charge-categories'],
    queryFn: () => api<ChargeCategory[]>('/api/charge-categories?no_pagination=1'),
  })
}

export function useFolio(folioId: number | null) {
  return useQuery({
    queryKey: ['folio', folioId],
    queryFn: () => api<Folio>(`/api/folios/${folioId}`),
    enabled: folioId !== null,
  })
}

export function useReservationFolio(reservationId: string | null) {
  return useQuery({
    queryKey: ['reservation-folio', reservationId],
    queryFn: () => api<Folio>(`/api/reservations/${reservationId}/folio`),
    enabled: Boolean(reservationId),
  })
}

function invalidateFolio(qc: ReturnType<typeof useQueryClient>, folioId: number, reservationId?: string) {
  return async () => {
    await qc.invalidateQueries({ queryKey: ['folio', folioId] })
    if (reservationId) await qc.invalidateQueries({ queryKey: ['reservation-folio', reservationId] })
    await qc.invalidateQueries({ queryKey: ['reservations'] })
    await qc.invalidateQueries({ queryKey: ['reports'] })
  }
}

export function useAddCharge(folioId: number, reservationId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      chargeCategoryId: number
      description: string
      quantity: number
      unitCents: number
      serviceDate?: string
    }) => api<FolioItem>(`/api/folios/${folioId}/charges`, { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: invalidateFolio(qc, folioId, reservationId),
  })
}

export function useAddPayment(folioId: number, reservationId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { method: string; amountCents: number; reference?: string; notes?: string }) =>
      api<FolioPayment>(`/api/folios/${folioId}/payments`, { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: invalidateFolio(qc, folioId, reservationId),
  })
}

export function useVoidCharge(folioId: number, reservationId?: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: number; reason: string }) =>
      api(`/api/folio-items/${input.id}/void`, { method: 'POST', body: JSON.stringify({ reason: input.reason }) }),
    onSuccess: invalidateFolio(qc, folioId, reservationId),
  })
}
