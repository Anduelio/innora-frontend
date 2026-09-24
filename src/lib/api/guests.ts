import { useQuery } from '@tanstack/react-query'
import type { Guest } from '@/types/domain'
import { api } from '@/lib/api/client'

export type GuestPage = { items: Guest[]; page: number; hasMore: boolean }

export function fetchGuests(): Promise<Guest[]> {
  return api<Guest[]>('/api/guests?no_pagination=1')
}

export function fetchGuestPage(query: string, page: number): Promise<GuestPage> {
  const params = new URLSearchParams({ q: query, page: String(page), per_page: '4' })
  return api<GuestPage>(`/api/guests?${params}`)
}

export function useGuests() {
  return useQuery({ queryKey: ['guests'], queryFn: fetchGuests })
}
