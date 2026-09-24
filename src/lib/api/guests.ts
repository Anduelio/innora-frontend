import { useQuery } from '@tanstack/react-query'
import type { Guest } from '@/types/domain'
import { api } from '@/lib/api/client'

export function fetchGuests(): Promise<Guest[]> {
  return api<Guest[]>('/api/guests?no_pagination=1')
}

export function useGuests() {
  return useQuery({ queryKey: ['guests'], queryFn: fetchGuests })
}
