import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { useSignOut } from '@/lib/api/auth'

export function useLogout() {
  const navigate = useNavigate()
  const signOut = useSignOut()
  return useCallback(async () => {
    await signOut()
    void navigate('/hyrje?arsye=dalje', { replace: true })
  }, [navigate, signOut])
}
