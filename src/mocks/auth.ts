import { HttpResponse, type PathParams } from 'msw'
import type { CurrentUser, StaffUser } from '@/types/domain'
import { hasPermission, permissionsFor, type Permission } from '@/lib/permissions'
import { getDb, persist } from '@/mocks/db'

export const MAX_ATTEMPTS = 5
export const LOCK_MS = 60_000
/** Kompjuteri i recepsionit përdoret nga disa veta: sesioni mbyllet pas 30 minutash pa veprim. */
export const SESSION_IDLE_MS = 30 * 60_000

const attempts = new Map<string, { count: number; lockedUntil: number }>()

export function fail(status: number, code: string, message: string) {
  return HttpResponse.json({ error: { code, message } }, { status })
}

export function toCurrentUser(user: StaffUser): CurrentUser {
  return { ...user, permissions: permissionsFor(user.role) }
}

function tokenOf(request: Request): string | null {
  const header = request.headers.get('Authorization') ?? ''
  return header.startsWith('Bearer ') ? header.slice(7) : null
}

export function currentUser(request: Request): StaffUser | null {
  const token = tokenOf(request)
  if (!token) return null
  const db = getDb()
  const session = db.sessions[token]
  if (!session) return null
  if (Date.now() - session.lastSeenAt > SESSION_IDLE_MS) {
    delete db.sessions[token]
    persist(db)
    return null
  }
  const user = db.users.find((item) => item.id === session.userId && item.isActive)
  if (!user) return null
  session.lastSeenAt = Date.now()
  return user
}

export function login(email: string, password: string): Response {
  const key = email.trim().toLowerCase()
  const db = getDb()
  const state = attempts.get(key) ?? { count: 0, lockedUntil: 0 }
  if (state.lockedUntil > Date.now()) {
    const seconds = Math.ceil((state.lockedUntil - Date.now()) / 1000)
    return fail(429, 'TOO_MANY_ATTEMPTS', `Shumë përpjekje të gabuara. Provoni përsëri pas ${seconds} sekondash.`)
  }
  const user = db.users.find((item) => item.email.toLowerCase() === key)
  if (!user || db.passwords[user.id] !== password) {
    state.count += 1
    if (state.count >= MAX_ATTEMPTS) {
      state.count = 0
      state.lockedUntil = Date.now() + LOCK_MS
    }
    attempts.set(key, state)
    const left = MAX_ATTEMPTS - state.count
    return fail(
      401,
      'INVALID_CREDENTIALS',
      state.lockedUntil > Date.now()
        ? 'Shumë përpjekje të gabuara. Provoni përsëri pas 60 sekondash.'
        : `Email-i ose fjalëkalimi nuk është i saktë. Ju mbeten ${left} përpjekje.`,
    )
  }
  if (!user.isActive) return fail(403, 'USER_INACTIVE', 'Kjo llogari është çaktivizuar. Kërkojini pronarit ta aktivizojë.')
  attempts.delete(key)
  const token = `demo-${user.id}-${crypto.randomUUID()}`
  db.sessions[token] = { userId: user.id, lastSeenAt: Date.now() }
  user.lastLoginAt = new Date().toISOString()
  persist(db)
  return HttpResponse.json({
    user: toCurrentUser(user),
    authorization: { token_type: 'Bearer', expires_in: 0, access_token: token },
  })
}

export function logout(request: Request): void {
  const token = tokenOf(request)
  if (!token) return
  const db = getDb()
  delete db.sessions[token]
  persist(db)
}

type Info = { request: Request; params: PathParams }

/** Çdo kërkesë kërkon sesion; disa kërkojnë edhe një leje të veçantë (403 në shqip). */
export function authed(permission: Permission | null, resolver: (info: Info, user: StaffUser) => Response | Promise<Response>) {
  return async (info: Info) => {
    const user = currentUser(info.request)
    if (!user) return fail(401, 'UNAUTHENTICATED', 'Sesioni ka mbaruar. Hyni përsëri.')
    if (permission && !hasPermission(user.role, permission)) {
      return fail(403, 'FORBIDDEN', 'Ky veprim lejohet vetëm për pronarin e hotelit.')
    }
    return resolver(info, user)
  }
}
