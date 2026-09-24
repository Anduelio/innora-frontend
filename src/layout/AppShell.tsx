import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Spinner } from '@/components/ui/Spinner/Spinner'
import { Toaster } from '@/components/ui/Toast/Toaster'
import { upsertReservation } from '@/lib/api/cache'
import { useEventSource } from '@/lib/hooks/useEventSource'
import { ReservationSurfaces } from '@/features/rezervimi/ReservationSurfaces'
import { Sidebar } from '@/layout/Sidebar'
import { Topbar } from '@/layout/Topbar'
import s from './AppShell.module.scss'

function useReservationStream() {
  const qc = useQueryClient()
  useEventSource('/api/stream', (event) => {
    if (event.type === 'sync.status') {
      qc.setQueryData(['sync'], event.status)
      return
    }
    upsertReservation(qc, event.reservation)
  })
}

export function AppShell() {
  useReservationStream()
  return (
    <div className={s.shell}>
      <Sidebar />
      <div className={s.main}>
        <Topbar />
        <div className={s.content}>
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        </div>
      </div>
      <ReservationSurfaces />
      <Toaster />
    </div>
  )
}
