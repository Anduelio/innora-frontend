import { useQuery } from '@tanstack/react-query'
import type { ChannelMapping, Payment, PaymentMethod, StaffUser, SyncStatus } from '@/types/domain'
import { api } from '@/lib/api/client'

export function usePayments(from: string, to: string, method?: PaymentMethod | '') {
  const params = new URLSearchParams({ from, to })
  if (method) params.set('method', method)
  return useQuery({
    queryKey: ['payments', from, to, method ?? ''],
    queryFn: () => api<Payment[]>(`/api/payments?${params}`),
    placeholderData: (previous) => previous,
  })
}

export function useSyncStatus() {
  return useQuery({
    queryKey: ['sync-status'],
    queryFn: () => api<SyncStatus>('/api/sync/status'),
    refetchInterval: 60_000,
  })
}

export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: () => api<StaffUser[]>('/api/users') })
}

export function useChannelMappings() {
  return useQuery({
    queryKey: ['channel-mappings'],
    queryFn: () => api<ChannelMapping[]>('/api/settings/channel-mappings'),
  })
}
