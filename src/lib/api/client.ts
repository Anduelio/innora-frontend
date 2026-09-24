import { clearStoredTokens, isAccessTokenExpired, loadStoredTokens, saveStoredTokensWithTimestamp, type Authorization } from '@/lib/api/tokenStorage'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'

let refreshPromise: Promise<Authorization | null> | null = null

function unwrap<T>(body: unknown): T {
  if (body && typeof body === 'object' && !Array.isArray(body) && 'success' in body && 'data' in body) {
    return (body as { data: T }).data
  }
  return body as T
}

export function errorText(error: unknown, fallback: string): string {
  return error instanceof ApiError && error.message ? error.message : fallback
}

async function refreshAccessToken(): Promise<Authorization | null> {
  const current = loadStoredTokens()
  if (!current?.refresh_token) return null

  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: current.refresh_token }),
  })
  if (!response.ok) {
    clearStoredTokens()
    return null
  }
  const body = unwrap<{ authorization: Authorization }>(await response.json())
  saveStoredTokensWithTimestamp(body.authorization)
  return body.authorization
}

async function ensureBearer(): Promise<string | null> {
  let authorization = loadStoredTokens()
  if (!authorization?.access_token) return null
  if (authorization.refresh_token && isAccessTokenExpired(authorization)) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null
      })
    }
    authorization = (await refreshPromise) ?? loadStoredTokens()
  }
  return authorization?.access_token ?? null
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')
  if (init?.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

  if (!useMocks) {
    const token = await ensureBearer()
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(path, { ...init, headers })
  if (response.status === 401 && !useMocks) {
    clearStoredTokens()
  }
  if (!response.ok) {
    let message = response.statusText
    try {
      const body = (await response.json()) as { message?: string }
      if (body.message) message = body.message
    } catch {
      // përgjigje pa JSON
    }
    throw new ApiError(response.status, message)
  }
  if (response.status === 204) return undefined as T
  return unwrap<T>(await response.json())
}

export async function apiDownload(path: string, filename: string): Promise<void> {
  const headers = new Headers({ Accept: '*/*' })
  const token = await ensureBearer()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(path, { headers })
  if (!response.ok) throw new ApiError(response.status, response.statusText)
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
