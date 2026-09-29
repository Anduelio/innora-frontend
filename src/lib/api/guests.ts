import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Guest } from '@/types/domain'
import { api, apiList, type ListPage } from '@/lib/api/client'
import {
  GUEST_PICKER_PAGE_SIZE,
  guestPageHonors,
  resolveGuestPage,
  type GuestBookFilters,
} from '@/lib/guestBook'

export type GuestPage = ListPage<Guest>

export function fetchGuests(filters: { q?: string; withPhone?: boolean } = {}): Promise<Guest[]> {
  const params = new URLSearchParams({ no_pagination: '1' })
  if (filters.q?.trim()) params.set('q', filters.q.trim())
  if (filters.withPhone) params.set('withPhone', '1')
  return api<Guest[]>(`/api/guests?${params}`)
}

export function fetchGuestPage(
  query: string,
  page: number,
  options?: { withPhone?: boolean; pageSize?: number },
): Promise<GuestPage> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(options?.pageSize ?? GUEST_PICKER_PAGE_SIZE),
  })
  const term = query.trim()
  if (term) params.set('q', term)
  if (options?.withPhone) params.set('withPhone', '1')
  return apiList<Guest>(`/api/guests?${params}`)
}

export function useGuests(filters: { q?: string; withPhone?: boolean } = {}) {
  return useQuery({
    queryKey: ['guests', filters.q ?? '', filters.withPhone ? '1' : '0'],
    queryFn: () => fetchGuests(filters),
  })
}

export function useGuestBook(filters: GuestBookFilters) {
  const server = useQuery({
    queryKey: ['guests', 'page', filters.q, filters.withPhone ? '1' : '0', filters.page, filters.pageSize],
    queryFn: () =>
      fetchGuestPage(filters.q, filters.page, { withPhone: filters.withPhone, pageSize: filters.pageSize }),
    placeholderData: keepPreviousData,
  })
  const fresh = server.isPlaceholderData ? undefined : server.data
  const honors = fresh ? guestPageHonors(fresh.items, filters) : true
  const fallback = useQuery({
    queryKey: ['guests', 'all'],
    queryFn: () => fetchGuests(),
    enabled: Boolean(fresh) && !honors,
  })
  const resolved = fresh
    ? resolveGuestPage(fresh, honors ? undefined : fallback.data, filters)
    : {
        items: server.data?.items ?? [],
        page: server.data?.page ?? filters.page,
        lastPage: Math.max(1, server.data?.lastPage ?? 1),
        total: server.data?.total ?? null,
        pendingFallback: false,
      }

  return {
    items: resolved.items,
    page: resolved.page,
    lastPage: resolved.lastPage,
    total: resolved.total,
    isLoading: (server.isLoading && !server.data) || resolved.pendingFallback,
    isError: server.isError || (Boolean(server.data) && !honors && fallback.isError),
    isFetching: server.isFetching || fallback.isFetching,
    refetch: () => {
      void server.refetch()
      if (!honors) void fallback.refetch()
    },
  }
}

export function useSaveGuest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { id?: string; name: string; phonePrefix?: string; phone?: string }) => {
      const { id, ...body } = input
      if (id) {
        return api<Guest>(`/api/guests/${id}`, { method: 'PUT', body: JSON.stringify(body) })
      }
      return api<Guest>('/api/guests', { method: 'POST', body: JSON.stringify(body) })
    },
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: ['guests'] })
    },
  })
}

export function useDeleteGuest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api(`/api/guests/${id}`, { method: 'DELETE' }),
    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: ['guests'] })
    },
  })
}
