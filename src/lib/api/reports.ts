import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

export type ReportPreset = 'today' | 'this_week' | 'this_month' | 'last_month'

export function useRevenueReport(preset: ReportPreset, from?: string, to?: string) {
  const params = new URLSearchParams(from && to ? { from, to } : { preset })
  return useQuery({
    queryKey: ['reports', 'revenue', preset, from, to],
    queryFn: () =>
      api<{
        totalCents: number
        roomCents: number
        extraCents: number
        byCategory: { code: string; name: string; amountCents: number }[]
        note: string
      }>(`/api/reports/revenue?${params}`),
  })
}

export function usePaymentsReport(preset: ReportPreset, from?: string, to?: string) {
  const params = new URLSearchParams(from && to ? { from, to } : { preset })
  return useQuery({
    queryKey: ['reports', 'payments', preset, from, to],
    queryFn: () =>
      api<{
        totalCents: number
        byMethod: { method: string; amountCents: number }[]
        note: string
      }>(`/api/reports/payments?${params}`),
  })
}

export function useOutstandingReport(enabled = true) {
  return useQuery({
    queryKey: ['reports', 'outstanding'],
    queryFn: () =>
      api<{
        totalBalanceCents: number
        count: number
        rows: {
          folioId: number
          folioNumber: string
          reservationId: string
          guestName: string
          checkOut: string
          chargesCents: number
          paymentsCents: number
          balanceCents: number
        }[]
      }>('/api/reports/outstanding'),
    enabled,
  })
}

export function useSourceReport(preset: ReportPreset) {
  return useQuery({
    queryKey: ['reports', 'source', preset],
    queryFn: () =>
      api<{ totalCents: number; bySource: { source: string; amountCents: number }[] }>(
        `/api/reports/source?preset=${preset}`,
      ),
  })
}

export function useDailyReport(date: string) {
  return useQuery({
    queryKey: ['reports', 'daily', date],
    queryFn: () =>
      api<{
        date: string
        operations: { arrivals: number; departures: number; inHouse: number }
        rooms: { occupied: number; free: number; dirty: number; outOfOrder: number }
        finance: { revenueCents: number; paymentsCents: number; outstandingCents: number }
        paymentsByMethod: { method: string; amountCents: number }[]
      }>(`/api/reports/daily?date=${date}`),
  })
}

export function useOccupancyReport(preset: ReportPreset) {
  return useQuery({
    queryKey: ['reports', 'occupancy', preset],
    queryFn: () =>
      api<{
        availableRoomNights: number
        roomsSold: number
        roomRevenueCents: number
        occupancy: number
        adrCents: number
        revparCents: number
        cancellations: number
        noShows: number
        formulas: Record<string, string>
      }>(`/api/reports/occupancy?preset=${preset}`),
  })
}

export function useDashboardFinance() {
  return useQuery({
    queryKey: ['reports', 'dashboard'],
    queryFn: () => api<{ outstandingCents: number; outstandingCount: number }>('/api/desk/outstanding'),
  })
}

export async function downloadReportCsv(type: 'revenue' | 'payments' | 'outstanding', preset: ReportPreset) {
  const { apiDownload } = await import('@/lib/api/client')
  await apiDownload(`/api/reports/export/${type}?preset=${preset}`, `${type}-report.csv`)
}
