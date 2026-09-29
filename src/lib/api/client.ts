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

type ListMeta = {
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
}

export type ListPage<T> = {
  items: T[]
  hasMore: boolean
  page: number
  lastPage: number
  total: number | null
  pageSize: number | null
}

function splitBody(body: unknown): { data: unknown; meta?: ListMeta } {
  if (body && typeof body === 'object' && !Array.isArray(body) && 'success' in body && 'data' in body) {
    const envelope = body as { data: unknown; meta?: ListMeta }
    return { data: envelope.data, meta: envelope.meta }
  }
  return { data: body }
}

function unwrap<T>(body: unknown): T {
  return splitBody(body).data as T
}

function optionalNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function firstErrorMessage(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined
  const record = body as { message?: unknown; errors?: unknown }
  if (record.errors && typeof record.errors === 'object') {
    for (const value of Object.values(record.errors as Record<string, unknown>)) {
      if (typeof value === 'string' && value) return value
      if (Array.isArray(value) && typeof value[0] === 'string' && value[0]) return value[0]
    }
  }
  return typeof record.message === 'string' && record.message ? record.message : undefined
}

export function listFromBody<T>(body: unknown): ListPage<T> {
  const { data, meta } = splitBody(body)
  if (Array.isArray(data)) {
    const page = optionalNumber(meta?.current_page) ?? 1
    const lastPage = optionalNumber(meta?.last_page) ?? page
    return {
      items: data as T[],
      hasMore: page < lastPage,
      page,
      lastPage,
      total: optionalNumber(meta?.total),
      pageSize: optionalNumber(meta?.per_page),
    }
  }
  if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)) {
    const pageBody = data as {
      items: T[]
      hasMore?: boolean
      page?: number
      lastPage?: number
      last_page?: number
      total?: number
      pageSize?: number
      page_size?: number
    }
    const page = optionalNumber(pageBody.page) ?? 1
    const explicitLast = optionalNumber(pageBody.lastPage ?? pageBody.last_page)
    const hasMore = Boolean(pageBody.hasMore)
    const lastPage = explicitLast ?? (hasMore ? page + 1 : page)
    return {
      items: pageBody.items,
      hasMore: explicitLast == null ? hasMore : page < lastPage,
      page,
      lastPage,
      total: optionalNumber(pageBody.total),
      pageSize: optionalNumber(pageBody.pageSize ?? pageBody.page_size),
    }
  }
  return { items: [], hasMore: false, page: 1, lastPage: 1, total: 0, pageSize: null }
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

async function readJson(path: string, init?: RequestInit): Promise<unknown> {
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
      message = firstErrorMessage(await response.json()) ?? message
    } catch {
      // përgjigje pa JSON
    }
    throw new ApiError(response.status, message)
  }
  if (response.status === 204) return undefined
  return response.json()
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  return unwrap<T>(await readJson(path, init))
}

export async function apiList<T>(path: string, init?: RequestInit): Promise<ListPage<T>> {
  const body = await readJson(path, init)
  if (body === undefined) return { items: [], hasMore: false, page: 1, lastPage: 1, total: 0, pageSize: null }
  return listFromBody<T>(body)
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
