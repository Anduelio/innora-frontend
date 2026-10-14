import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { AppShell } from '@/layout/AppShell'
import { HyrjePage } from '@/features/hyrje/HyrjePage'
import { RequireAuth } from '@/features/hyrje/RequireAuth'
import { RequirePermission } from '@/features/hyrje/RequirePermission'

const SotPage = lazy(() => import('@/features/sot/SotPage').then((m) => ({ default: m.SotPage })))
const KalendariPage = lazy(() => import('@/features/kalendari/KalendariPage').then((m) => ({ default: m.KalendariPage })))
const RezervimetPage = lazy(() => import('@/features/rezervimet/RezervimetPage').then((m) => ({ default: m.RezervimetPage })))
const PagesatPage = lazy(() => import('@/features/pagesat/PagesatPage').then((m) => ({ default: m.PagesatPage })))
const RaportetPage = lazy(() => import('@/features/raportet/RaportetPage').then((m) => ({ default: m.RaportetPage })))
const CilesimetPage = lazy(() => import('@/features/cilesimet/CilesimetPage').then((m) => ({ default: m.CilesimetPage })))

export const router = createBrowserRouter([
  { path: '/hyrje', element: <HyrjePage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <SotPage /> },
      { path: 'kalendari', element: <KalendariPage /> },
      { path: 'rezervimet', element: <RezervimetPage /> },
      { path: 'pagesat', element: <PagesatPage /> },
      { path: 'raportet', element: <RaportetPage /> },
      {
        path: 'cilesimet',
        element: (
          <RequirePermission permission="settings.manage">
            <CilesimetPage />
          </RequirePermission>
        ),
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
