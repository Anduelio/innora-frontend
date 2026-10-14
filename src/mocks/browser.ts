import { getResponse } from 'msw'
import { handlers } from '@/mocks/handlers'

/**
 * Përgjigjet e `/api` jepen brenda faqes, pa service worker, pa proxy dhe pa server.
 * Çdo `fetch` drejt `/api` kalon nga të njëjtat handlers që përdorin testet.
 */
export function installMockApi(): void {
  // Versionet e vjetra përdornin service worker; heqim çdo regjistrim të mbetur.
  void navigator.serviceWorker?.getRegistrations().then((list) => list.forEach((r) => void r.unregister()))

  const realFetch = window.fetch.bind(window)

  window.fetch = async (input, init) => {
    const request = new Request(input, init)
    const { pathname } = new URL(request.url, window.location.origin)
    if (!pathname.startsWith('/api/')) return realFetch(input, init)

    const response = await getResponse(handlers, request)
    return (
      response ??
      new Response(JSON.stringify({ message: 'Rruga nuk ekziston.' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  }
}
