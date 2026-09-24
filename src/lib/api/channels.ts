import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'

export type ChannelField = {
  key: string
  secret: boolean
  required: boolean
}

export type ChannelProvider = {
  code: string
  label: string
  baseUrl: string
  fields: ChannelField[]
}

export type ChannelConnection = {
  id: number
  providerCode: string
  label: string
  isActive: boolean
  credentials: Record<string, string>
}

export function useChannelCatalog() {
  return useQuery({
    queryKey: ['channel-catalog'],
    queryFn: () => api<{ providers: ChannelProvider[] }>('/api/channels/catalog'),
  })
}

export function useChannelConnections() {
  return useQuery({
    queryKey: ['channels'],
    queryFn: () => api<ChannelConnection[]>('/api/channels'),
  })
}

export function useSaveChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { providerCode: string; isActive: boolean; credentials: Record<string, string> }) =>
      api<ChannelConnection>('/api/channels', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}

export function useDeleteChannel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api(`/api/channels/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['channels'] })
    },
  })
}
