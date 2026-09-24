import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SyncStatus } from '@/types/domain'
import { api } from '@/lib/api/client'

export function fetchSyncStatus(): Promise<SyncStatus> {
  return api<SyncStatus>('/api/sync/status')
}

export function retrySync(): Promise<SyncStatus> {
  return api<SyncStatus>('/api/sync/retry', { method: 'POST' })
}

export function simulateSyncProblem(): Promise<SyncStatus> {
  return api<SyncStatus>('/api/sync/fail', { method: 'POST' })
}

export function useSyncStatus() {
  return useQuery({ queryKey: ['sync'], queryFn: fetchSyncStatus })
}

export function useRetrySync() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: retrySync,
    onSuccess: (status) => qc.setQueryData(['sync'], status),
  })
}

export function useSimulateSyncProblem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: simulateSyncProblem,
    onSuccess: (status) => qc.setQueryData(['sync'], status),
  })
}
