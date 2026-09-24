import { createBrowserRouter, Navigate } from 'react-router'
import { AppShell } from '@/layout/AppShell'
import { CilesimetPage } from '@/features/cilesimet/CilesimetPage'
import { DhomatPage } from '@/features/dhomat/DhomatPage'
import { HyrjePage } from '@/features/hyrje/HyrjePage'
import { RequireAuth } from '@/features/hyrje/RequireAuth'
import { KalendariPage } from '@/features/kalendari/KalendariPage'
import { KlientetPage } from '@/features/klientet/KlientetPage'
import { PermbledhjePage } from '@/features/permbledhje/PermbledhjePage'
import { RaportePage } from '@/features/raporte/RaportePage'
import { RezervimetPage } from '@/features/rezervimet/RezervimetPage'

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
