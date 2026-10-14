import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useMe } from '@/lib/api/auth'
import { loadStoredTokens } from '@/lib/api/tokenStorage'
import { Spinner } from '@/components/atoms/Spinner/Spinner'

export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation()
  const me = useMe()
  const from = `${location.pathname}${location.search}`

  if (!loadStoredTokens() || me.isError) {
    return <Navigate to={`/hyrje${from === '/' ? '' : `?kthehu=${encodeURIComponent(from)}`}`} replace />
  }
  if (!me.data) return <Spinner />
  return children
}
