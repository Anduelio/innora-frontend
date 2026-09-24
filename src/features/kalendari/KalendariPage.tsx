import { useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { DaySelection } from '@/types/domain'
import { addDaysIso } from '@/lib/date/calendar'
import { useKnownReservations } from '@/lib/api/reservations'
import { useRooms } from '@/lib/api/rooms'
import { maxFreeNights } from '@/lib/stay'
import { useCalendarStore } from '@/store/calendarStore'
import { useUiStore } from '@/store/uiStore'
import { EmptyState } from '@/components/ui/EmptyState/EmptyState'
import { Spinner } from '@/components/ui/Spinner/Spinner'
import { CalendarGrid } from '@/features/kalendari/CalendarGrid'
import { CalendarToolbar } from '@/features/kalendari/CalendarToolbar'
import s from './KalendariPage.module.scss'

function CalendarUrlSync() {
  const [params, setParams] = useSearchParams()
  const view = useCalendarStore((state) => state.view)
  const startDate = useCalendarStore((state) => state.startDate)
  const setView = useCalendarStore((state) => state.setView)
  const setStartDate = useCalendarStore((state) => state.setStartDate)

  useEffect(() => {
    const onPop = () => {
      const next = new URLSearchParams(window.location.search)
      const pamja = Number(next.get('pamja'))
      const nga = next.get('nga')
      if (nga) setStartDate(nga)
      if (pamja === 7 || pamja === 14 || pamja === 30) setView(pamja)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [setStartDate, setView])

  useEffect(() => {
    if (params.get('nga') === startDate && params.get('pamja') === String(view)) return
    const next = new URLSearchParams(params)
    next.set('nga', startDate)
    next.set('pamja', String(view))
    setParams(next, { replace: true })
  }, [params, setParams, startDate, view])

  return null
}

export function KalendariPage() {
  const { t } = useTranslation()
  const rooms = useRooms()
  const known = useKnownReservations()
  const startDate = useCalendarStore((state) => state.startDate)
  const openCreate = useUiStore((state) => state.openCreate)

  const onComplete = useCallback(
    (selection: DaySelection) => {
      const start = Math.min(selection.a, selection.b)
      const end = Math.max(selection.a, selection.b)
      const checkIn = addDaysIso(startDate, start)
      const max = maxFreeNights(known.reservations, selection.roomId, checkIn)
      if (max < 1) return
      openCreate({
        roomId: selection.roomId,
        checkIn,
        nights: Math.min(end - start + 1, max),
      })
    },
    [known.reservations, openCreate, startDate],
  )

  return (
    <div className={s.page}>
      <CalendarUrlSync />
      <CalendarToolbar />
      {rooms.isLoading || known.isLoading ? <Spinner /> : null}
      {rooms.isError || known.isError ? <EmptyState title={t('common.loadError')} /> : null}
      {rooms.data && !known.isLoading && !known.isError ? (
        <>
          {known.reservations.some((item) => item.roomId === '') ? (
            <p>{t('room.unassigned')}: {known.reservations.filter((item) => item.roomId === '').map((item) => item.guestName).join(', ')}</p>
          ) : null}
          <CalendarGrid rooms={rooms.data} reservations={known.reservations} onComplete={onComplete} />
        </>
      ) : null}
    </div>
  )
}
