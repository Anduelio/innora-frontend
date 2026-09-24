const TOKEN_STORAGE_KEY = 'innora-session-tokens'

export type Authorization = {
  token_type: string
  expires_in: number
  access_token: string
  refresh_token?: string | null
}

let memoryAuthorization: Authorization | null = null

function isAuthorization(value: unknown): value is Authorization {
  if (!value || typeof value !== 'object') return false
  const auth = value as Record<string, unknown>
  return typeof auth.access_token === 'string' && auth.access_token.length > 0
}

export function loadStoredTokens(): Authorization | null {
  if (memoryAuthorization) return memoryAuthorization
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isAuthorization(parsed)) return null
    memoryAuthorization = parsed
    return parsed
  } catch {
    return null
  }
}

export function saveStoredTokens(authorization: Authorization): void {
  memoryAuthorization = authorization
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(authorization))
  } catch {
    /* ignore quota */
  }
}

export function clearStoredTokens(): void {
  memoryAuthorization = null
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function isAccessTokenExpired(authorization: Authorization, skewSeconds = 30): boolean {
  if (!authorization.expires_in) return false
  const savedAt = (() => {
    try {
      const raw = localStorage.getItem(`${TOKEN_STORAGE_KEY}:at`)
      return raw ? Number(raw) : Date.now()
    } catch {
      return Date.now()
    }
  })()
  return Date.now() >= savedAt + authorization.expires_in * 1000 - skewSeconds * 1000
}

export function saveStoredTokensWithTimestamp(authorization: Authorization): void {
  saveStoredTokens(authorization)
  try {
    localStorage.setItem(`${TOKEN_STORAGE_KEY}:at`, String(Date.now()))
  } catch {
    /* ignore */
  }
}
