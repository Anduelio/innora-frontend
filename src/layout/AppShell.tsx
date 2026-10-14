import { Suspense } from 'react'
import { Outlet } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Spinner } from '@/components/atoms/Spinner/Spinner'
import { Toaster } from '@/components/organisms/Toast/Toaster'
import { upsertReservation } from '@/lib/api/cache'
import { useEventSource } from '@/lib/hooks/useEventSource'
import { usePersistentState } from '@/lib/hooks/usePersistentState'
import { useSessionGuard } from '@/lib/hooks/useSessionGuard'
import { ReservationSurfaces } from '@/features/rezervimi/ReservationSurfaces'
import { BottomNav } from '@/layout/BottomNav'
import { Sidebar } from '@/layout/Sidebar'
import { Topbar } from '@/layout/Topbar'
import s from './AppShell.module.scss'

function useReservationStream() {
  const qc = useQueryClient()
  useEventSource('/api/stream', (event) => {
    if (event.type === 'reservation.created' || event.type === 'reservation.updated') {
      upsertReservation(qc, event.reservation)
    }
  })
}

export function AppShell() {
  const { t } = useTranslation()
  const [collapsed, setCollapsed] = usePersistentState('sidebar-collapsed', false)
  useReservationStream()
  useSessionGuard()

  return (
    <div className={s.shell}>
      <a className={s.skip} href="#content">
        {t('app.skipToContent')}
      </a>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className={s.main}>
        <Topbar />
        <main id="content" className={s.content} tabIndex={-1}>
          <Suspense fallback={<Spinner />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <BottomNav />
      <ReservationSurfaces />
      <Toaster />
    </div>
  )
}
