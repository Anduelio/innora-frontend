import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api/client'
import { clearStoredTokens, saveStoredTokensWithTimestamp, type Authorization } from '@/lib/api/tokenStorage'

export interface DeskUser {
  name: string
  email: string
  role?: string
  permissions?: string[]
}

export type LoginResult = {
  user: DeskUser
  authorization: Authorization
}

export function fetchMe(): Promise<DeskUser> {
  return api<DeskUser>('/api/me')
}

export async function login(email: string, password: string): Promise<DeskUser> {
  const result = await api<LoginResult>('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  saveStoredTokensWithTimestamp(result.authorization)
  return result.user
}

export async function logout(): Promise<void> {
  try {
    await api('/api/logout', { method: 'POST' })
  } finally {
    clearStoredTokens()
  }
}

export async function changePassword(currentPassword: string, newPassword: string, newPasswordConfirmation: string): Promise<DeskUser> {
  return api<DeskUser>('/api/auth/password', {
    method: 'POST',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPasswordConfirmation,
    }),
  })
}

export function useMe() {
  const hasToken = typeof window !== 'undefined' && Boolean(
    (() => {
      try {
        return localStorage.getItem('innora-session-tokens')
      } catch {
        return null
      }
    })(),
  )

  return useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    retry: false,
    enabled: import.meta.env.VITE_USE_MOCKS === 'false' && hasToken,
  })
}

export function useSignOut() {
  const qc = useQueryClient()
  return async () => {
    await logout()
    qc.clear()
  }
}
