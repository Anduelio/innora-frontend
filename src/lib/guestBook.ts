import type { Guest } from '@/types/domain'
import type { ListPage } from '@/lib/api/client'

export const GUEST_PICKER_PAGE_SIZE = 4
export const GUEST_PAGE_SIZES = [15, 25, 50] as const

export type GuestBookFilters = {
  q: string
  withPhone: boolean
  page: number
  pageSize: number
}

export function guestMatches(guest: Guest, filters: { q?: string; withPhone?: boolean }): boolean {
  const nationalDigits = (guest.phone ?? '').replace(/\D/g, '')
  const phoneDigits = `${guest.phonePrefix ?? ''}${nationalDigits}`.replace(/\D/g, '')
  if (filters.withPhone && nationalDigits.length === 0) return false
  const term = (filters.q ?? '').trim().toLocaleLowerCase('sq')
  if (!term) return true
  const haystack = `${guest.name} ${guest.phone ?? ''} ${guest.phonePrefix ?? ''}`.toLocaleLowerCase('sq')
  if (haystack.includes(term)) return true
  const termDigits = term.replace(/\D/g, '')
  return termDigits.length >= 3 && phoneDigits.includes(termDigits)
}

export function guestPageHonors(items: Guest[], filters: { q?: string; withPhone?: boolean }): boolean {
  return items.every((guest) => guestMatches(guest, filters))
}

export function resolveGuestPage(
  server: ListPage<Guest> | undefined,
  fallback: Guest[] | undefined,
  filters: GuestBookFilters,
): {
  items: Guest[]
  page: number
  lastPage: number
  total: number | null
  pendingFallback: boolean
} {
  if (!server) {
    return { items: [], page: filters.page, lastPage: 1, total: null, pendingFallback: false }
  }
  if (guestPageHonors(server.items, filters)) {
    return {
      items: server.items,
      page: server.page,
      lastPage: Math.max(1, server.lastPage),
      total: server.total,
      pendingFallback: false,
    }
  }
  if (!fallback) {
    return { items: [], page: filters.page, lastPage: 1, total: null, pendingFallback: true }
  }
  const filtered = fallback.filter((guest) => guestMatches(guest, filters))
  const lastPage = Math.max(1, Math.ceil(filtered.length / filters.pageSize))
  const page = Math.min(Math.max(1, filters.page), lastPage)
  const start = (page - 1) * filters.pageSize
  return {
    items: filtered.slice(start, start + filters.pageSize),
    page,
    lastPage,
    total: filtered.length,
    pendingFallback: false,
  }
}
