import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { SESSION_ENDED_EVENT } from '@/lib/api/client'
import { logout } from '@/lib/api/auth'

/** Kompjuteri i recepsionit është i përbashkët: pas kësaj kohe pa veprim, sesioni mbyllet vetë. */
export const IDLE_LIMIT_MS = 30 * 60_000
const CHECK_EVERY_MS = 30_000
const ACTIVITY = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const

export function useSessionGuard() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const lastActivity = useRef(Date.now())

  useEffect(() => {
    let ended = false
    const end = (signOut: boolean) => {
      if (ended) return
      ended = true
      void (signOut ? logout() : Promise.resolve()).finally(() => {
        qc.clear()
        void navigate('/hyrje?arsye=skadoi', { replace: true })
      })
    }
    const onActivity = () => {
      lastActivity.current = Date.now()
    }
    const onEnded = () => end(false)
    const timer = window.setInterval(() => {
      if (Date.now() - lastActivity.current > IDLE_LIMIT_MS) end(true)
    }, CHECK_EVERY_MS)

    for (const name of ACTIVITY) window.addEventListener(name, onActivity, { passive: true })
    window.addEventListener(SESSION_ENDED_EVENT, onEnded)
    return () => {
      window.clearInterval(timer)
      for (const name of ACTIVITY) window.removeEventListener(name, onActivity)
      window.removeEventListener(SESSION_ENDED_EVENT, onEnded)
    }
  }, [navigate, qc])
}
