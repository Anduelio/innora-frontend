import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { BlockKind, HotelRoomType, HotelSettings, OperationalStatus, Room, RoomAmenity } from '@/types/domain'
import { api } from '@/lib/api/client'

export function fetchRooms(): Promise<Room[]> {
  return api<Room[]>('/api/rooms?no_pagination=1')
}

export function useRooms() {
  return useQuery({ queryKey: ['rooms'], queryFn: fetchRooms })
}

function useRoomRefresh() {
  const qc = useQueryClient()
  return {
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: ['rooms'] })
      await qc.invalidateQueries({ queryKey: ['room-types'] })
    },
  }
}

export function useCreateRoom() {
  const refresh = useRoomRefresh()
  return useMutation({
    mutationFn: (input: { roomTypeId: number; number: string; floor?: string; building?: string; notes?: string; operationalStatus?: OperationalStatus }) =>
      api<Room>('/api/rooms', { method: 'POST', body: JSON.stringify(input) }),
    ...refresh,
  })
}

export function useBulkRooms() {
  const refresh = useRoomRefresh()
  return useMutation({
    mutationFn: (input: { roomTypeId: number; numbers?: string[]; from?: string; to?: string; floor?: string; building?: string }) =>
      api<Room[]>('/api/rooms/bulk', { method: 'POST', body: JSON.stringify(input) }),
    ...refresh,
  })
}

export function useRoomStatus() {
  const refresh = useRoomRefresh()
  return useMutation({
    mutationFn: (input: { number: string; operationalStatus: OperationalStatus }) =>
      api<Room>(`/api/rooms/${encodeURIComponent(input.number)}/status`, {
        method: 'POST',
        body: JSON.stringify({ operationalStatus: input.operationalStatus }),
      }),
    ...refresh,
  })
}

export function useBlockRoom() {
  const refresh = useRoomRefresh()
  return useMutation({
    mutationFn: (input: { number: string; startsOn: string; endsOn: string; type: BlockKind; reason?: string }) =>
      api(`/api/rooms/${encodeURIComponent(input.number)}/blocks`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    ...refresh,
  })
}

export function useRoomTypes() {
  return useQuery({
    queryKey: ['room-types'],
    queryFn: () => api<HotelRoomType[]>('/api/room-types?no_pagination=1'),
  })
}

export function useAmenities() {
  return useQuery({
    queryKey: ['amenities'],
    queryFn: () => api<RoomAmenity[]>('/api/amenities?no_pagination=1'),
  })
}

export function useSaveRoomType() {
  const refresh = useRoomRefresh()
  return useMutation({
    mutationFn: (input: Record<string, unknown> & { id?: number }) => {
      const { id, ...body } = input
      return api<HotelRoomType>(id ? `/api/room-types/${id}` : '/api/room-types', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(body),
      })
    },
    ...refresh,
  })
}

export function useHotelSettings() {
  return useQuery({
    queryKey: ['hotel-settings'],
    queryFn: () => api<HotelSettings>('/api/settings/hotel'),
    enabled: import.meta.env.VITE_USE_MOCKS === 'false',
  })
}

export function useSaveHotelSettings() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { checkInTime: string; checkOutTime: string; currency: string }) =>
      api<HotelSettings>('/api/settings/hotel', { method: 'PUT', body: JSON.stringify(input) }),
    onSuccess: async (data) => {
      qc.setQueryData(['hotel-settings'], data)
    },
  })
}
