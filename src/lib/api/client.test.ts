import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError, errorText } from '@/lib/api/client'
import { fetchCustomers } from '@/lib/api/customers'

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

  it('reads the stable error code and Albanian message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ error: { code: 'NO_AVAILABILITY', message: 'Nuk ka dhomë të lirë.' } }, 409)),
    )
    await expect(api('/api/reservations')).rejects.toMatchObject({ status: 409, code: 'NO_AVAILABILITY', message: 'Nuk ka dhomë të lirë.' })
  })

  it('requests the customer list', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toContain('/api/customers')
      return jsonResponse([])
    })
    vi.stubGlobal('fetch', fetchMock)
    await fetchCustomers()
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})
