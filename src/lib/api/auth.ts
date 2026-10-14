import { useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CurrentUser, SaveUserInput, StaffUser } from '@/types/domain'
import { api } from '@/lib/api/client'
import { hasPermission, type Permission } from '@/lib/permissions'
import { clearStoredTokens, loadStoredTokens, saveStoredTokensWithTimestamp, type Authorization } from '@/lib/api/tokenStorage'

export type LoginResult = {
  user: CurrentUser
  authorization: Authorization
}

export function fetchMe(): Promise<CurrentUser> {
  return api<CurrentUser>('/api/me')
}

export async function login(email: string, password: string): Promise<CurrentUser> {
  const result = await api<LoginResult>('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), password }),
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

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: fetchMe,
    retry: false,
    staleTime: 5 * 60_000,
    enabled: Boolean(loadStoredTokens()),
  })
}

/** Përdoruesi i hyrë dhe kontrolli i lejeve; rregullat jetojnë te lib/permissions. */
export function useCurrentUser() {
  const me = useMe()
  const user = me.data
  const can = useCallback((permission: Permission) => hasPermission(user?.role, permission), [user?.role])
  return { user, can, isLoading: me.isLoading }
}

export function useSignOut() {
  const qc = useQueryClient()
  return useCallback(async () => {
    await logout()
    qc.clear()
  }, [qc])
}

export function useSaveUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id?: number; input: SaveUserInput }) =>
      api<StaffUser>(id ? `/api/users/${id}` : '/api/users', {
        method: id ? 'PATCH' : 'POST',
        body: JSON.stringify(input),
      }),
    onSettled: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}
