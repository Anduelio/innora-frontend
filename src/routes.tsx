import { lazy } from 'react'
import { createBrowserRouter, Navigate, Outlet } from 'react-router'
import { AppShell } from '@/layout/AppShell'
import { LoginPage } from '@/features/login/LoginPage'
import { RequireAuth } from '@/features/login/RequireAuth'
import { RequirePermission } from '@/features/login/RequirePermission'

const TodayPage = lazy(() => import('@/features/today/TodayPage').then((m) => ({ default: m.TodayPage })))
const CalendarPage = lazy(() => import('@/features/calendar/CalendarPage').then((m) => ({ default: m.CalendarPage })))
const ReservationsPage = lazy(() => import('@/features/reservations/ReservationsPage').then((m) => ({ default: m.ReservationsPage })))
const CustomersPage = lazy(() => import('@/features/customers/CustomersPage').then((m) => ({ default: m.CustomersPage })))
const PaymentsPage = lazy(() => import('@/features/payments/PaymentsPage').then((m) => ({ default: m.PaymentsPage })))
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })))
const SettingsHome = lazy(() => import('@/features/settings/SettingsHome').then((m) => ({ default: m.SettingsHome })))
const HotelSection = lazy(() => import('@/features/settings/HotelSection').then((m) => ({ default: m.HotelSection })))
const RoomsSection = lazy(() => import('@/features/settings/RoomsSection').then((m) => ({ default: m.RoomsSection })))
const BlocksSection = lazy(() => import('@/features/settings/BlocksSection').then((m) => ({ default: m.BlocksSection })))
const BookingSection = lazy(() => import('@/features/settings/BookingSection').then((m) => ({ default: m.BookingSection })))
const UsersSection = lazy(() => import('@/features/settings/UsersSection').then((m) => ({ default: m.UsersSection })))
const AppearanceSection = lazy(() => import('@/features/settings/AppearanceSection').then((m) => ({ default: m.AppearanceSection })))
const DemoSection = lazy(() => import('@/features/settings/DemoSection').then((m) => ({ default: m.DemoSection })))

export const router = createBrowserRouter([
  { path: '/hyrje', element: <LoginPage /> },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <TodayPage /> },
      { path: 'kalendari', element: <CalendarPage /> },
      { path: 'rezervimet', element: <ReservationsPage /> },
      { path: 'klientet', element: <CustomersPage /> },
      { path: 'pagesat', element: <PaymentsPage /> },
      { path: 'raportet', element: <ReportsPage /> },
      {
        path: 'cilesimet',
        element: (
          <RequirePermission permission="settings.manage">
            <Outlet />
          </RequirePermission>
        ),
        children: [
          { index: true, element: <SettingsHome /> },
          { path: 'hoteli', element: <HotelSection /> },
          { path: 'dhomat', element: <RoomsSection /> },
          { path: 'mirembajtje', element: <BlocksSection /> },
          { path: 'booking', element: <BookingSection /> },
          { path: 'perdoruesit', element: <UsersSection /> },
          { path: 'pamja', element: <AppearanceSection /> },
          { path: 'demo', element: <DemoSection /> },
          { path: '*', element: <Navigate to="/cilesimet" replace /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
