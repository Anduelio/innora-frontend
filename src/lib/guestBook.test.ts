import { describe, expect, it } from 'vitest'
import { guestMatches, guestPageHonors, resolveGuestPage } from '@/lib/guestBook'
import type { Guest } from '@/types/domain'
import type { ListPage } from '@/lib/api/client'

function guest(partial: Partial<Guest> = {}): Guest {
  return {
    id: '1',
    name: 'Ana Kola',
    phonePrefix: '+355',
    phone: '692345566',
    stays: 1,
    lastStay: '2026-09-19',
    ...partial,
  }
}

describe('guest book', () => {
  it('matches a name, a spaced phone, or digits', () => {
    const ana = guest()
    expect(guestMatches(ana, { q: 'kola' })).toBe(true)
    expect(guestMatches(ana, { q: '69 234' })).toBe(true)
    expect(guestMatches(ana, { q: 'ben' })).toBe(false)
    expect(guestMatches(guest({ phone: '' }), { withPhone: true })).toBe(false)
  })

  it('falls back to a local page when the server ignores the filter', () => {
    const server: ListPage<Guest> = {
      items: [guest(), guest({ id: '2', name: 'Drita Leka', phone: '', phonePrefix: null })],
      hasMore: false,
      page: 1,
      lastPage: 1,
      total: 2,
      pageSize: 15,
    }
    expect(guestPageHonors(server.items, { withPhone: true })).toBe(false)
    const resolved = resolveGuestPage(server, [guest(), guest({ id: '2', name: 'Drita Leka', phone: '' })], {
      q: '',
      withPhone: true,
      page: 1,
      pageSize: 15,
    })
    expect(resolved.items.map((item) => item.name)).toEqual(['Ana Kola'])
    expect(resolved.total).toBe(1)
    expect(resolved.pendingFallback).toBe(false)
  })

  it('waits for the full list before showing an ignored page', () => {
    const server: ListPage<Guest> = {
      items: [guest({ name: 'Pa filtruar' })],
      hasMore: true,
      page: 1,
      lastPage: 3,
      total: 40,
      pageSize: 15,
    }
    expect(resolveGuestPage(server, undefined, { q: 'ana', withPhone: false, page: 1, pageSize: 15 }).pendingFallback).toBe(
      true,
    )
  })
})
