import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'
import { AppShell } from '@/layout/AppShell'
import { HyrjePage } from '@/features/hyrje/HyrjePage'
import { RequireAuth } from '@/features/hyrje/RequireAuth'

const PermbledhjePage = lazy(() => import('@/features/permbledhje/PermbledhjePage').then((m) => ({ default: m.PermbledhjePage })))
const KalendariPage = lazy(() => import('@/features/kalendari/KalendariPage').then((m) => ({ default: m.KalendariPage })))
const RezervimetPage = lazy(() => import('@/features/rezervimet/RezervimetPage').then((m) => ({ default: m.RezervimetPage })))
const DhomatPage = lazy(() => import('@/features/dhomat/DhomatPage').then((m) => ({ default: m.DhomatPage })))
const KlientetPage = lazy(() => import('@/features/klientet/KlientetPage').then((m) => ({ default: m.KlientetPage })))
const RaportePage = lazy(() => import('@/features/raporte/RaportePage').then((m) => ({ default: m.RaportePage })))
const CilesimetPage = lazy(() => import('@/features/cilesimet/CilesimetPage').then((m) => ({ default: m.CilesimetPage })))

const desk = [
  { index: true, element: <PermbledhjePage /> },
  { path: 'kalendari', element: <KalendariPage /> },
  { path: 'rezervimet', element: <RezervimetPage /> },
  { path: 'dhomat', element: <DhomatPage /> },
  { path: 'klientet', element: <KlientetPage /> },
  { path: 'raporte', element: <RaportePage /> },
  { path: 'cilesimet', element: <CilesimetPage /> },
  { path: '*', element: <Navigate to="/" replace /> },
]

const useMocks = import.meta.env.VITE_USE_MOCKS !== 'false'

export const router = createBrowserRouter(
  useMocks
    ? [{ path: '/', element: <AppShell />, children: desk }]
    : [
        { path: '/hyrje', element: <HyrjePage /> },
        { path: '/', element: <RequireAuth><AppShell /></RequireAuth>, children: desk },
      ],
)
