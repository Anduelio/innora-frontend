import { useQuery } from '@tanstack/react-query'
import type { HotelSettings, Room, RoomTypeInfo } from '@/types/domain'
import { api } from '@/lib/api/client'

export function fetchRooms(): Promise<Room[]> {
  return api<Room[]>('/api/rooms?no_pagination=1')
}

export function useRooms() {
  return useQuery({ queryKey: ['rooms'], queryFn: fetchRooms, staleTime: 5 * 60_000 })
}

export function useRoomTypes() {
  return useQuery({
    queryKey: ['room-types'],
    queryFn: () => api<RoomTypeInfo[]>('/api/room-types?no_pagination=1'),
    staleTime: 5 * 60_000,
    select: (types) => [...types].sort((a, b) => a.sort - b.sort),
  })
}

export function useHotelSettings() {
  return useQuery({
    queryKey: ['hotel-settings'],
    queryFn: () => api<HotelSettings>('/api/settings/hotel'),
    staleTime: 10 * 60_000,
  })
}
