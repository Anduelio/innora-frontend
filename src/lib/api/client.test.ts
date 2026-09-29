import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError, errorText, listFromBody } from '@/lib/api/client'
import { fetchGuestPage } from '@/lib/api/guests'
import { fetchDeskReservations } from '@/lib/api/reservations'

afterEach(() => {
  vi.unstubAllGlobals()
})

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

describe('api', () => {
  it('unwraps a success envelope', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ success: true, data: { id: 1 } })))
    await expect(api<{ id: number }>('/api/rooms')).resolves.toEqual({ id: 1 })
  })

  it('returns nothing for 204', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 204 })))
    await expect(api('/api/rooms/1')).resolves.toBeUndefined()
  })

  it('throws the server message', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({ message: 'Nuk u gjet.' }, 404)))
    await expect(api('/api/missing')).rejects.toMatchObject({ status: 404, message: 'Nuk u gjet.' })
    try {
      await api('/api/missing')
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      expect(errorText(error, 'fallback')).toBe('Nuk u gjet.')
    }
  })

  it('requests a guest page from the list envelope', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toContain('/api/guests?')
      expect(String(input)).toContain('q=ana')
      expect(String(input)).toContain('page=2')
      expect(String(input)).toContain('page_size=4')
      return jsonResponse({
        success: true,
        data: [{ id: '1', name: 'Ana' }],
        meta: { current_page: 2, last_page: 3 },
      })
    })
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchGuestPage('ana', 2)).resolves.toEqual({
      items: [{ id: '1', name: 'Ana' }],
      hasMore: true,
      page: 2,
      lastPage: 3,
      total: null,
      pageSize: null,
    })
  })

  it('sends the phone chip and page size', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      expect(url).toContain('withPhone=1')
      expect(url).toContain('page_size=15')
      expect(url).not.toContain('q=')
      return jsonResponse({
        success: true,
        data: [],
        meta: { current_page: 1, last_page: 1, per_page: 15, total: 0 },
      })
    })
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchGuestPage('  ', 1, { withPhone: true, pageSize: 15 })).resolves.toMatchObject({
      items: [],
      total: 0,
      pageSize: 15,
      lastPage: 1,
    })
  })

  it('prefers a field error over a generic message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        jsonResponse(
          { message: 'The given data was invalid.', errors: { roomId: ['Dhoma është e zënë për këto data.'] } },
          422,
        ),
      ),
    )
    await expect(api('/api/reservations', { method: 'POST' })).rejects.toMatchObject({
      status: 422,
      message: 'Dhoma është e zënë për këto data.',
    })
  })

  it('asks the desk board for today', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      expect(url).toContain('arriving_on=2026-09-21')
      expect(url).toContain('no_pagination=1')
      return jsonResponse({ success: true, data: [] })
    })
    vi.stubGlobal('fetch', fetchMock)
    await expect(fetchDeskReservations({ arrivingOn: '2026-09-21' })).resolves.toEqual([])
  })

  it('reads a mock page that already has items', () => {
    expect(listFromBody({ items: [{ id: '1' }], hasMore: true })).toEqual({
      items: [{ id: '1' }],
      hasMore: true,
      page: 1,
      lastPage: 2,
      total: null,
      pageSize: null,
    })
  })
})
