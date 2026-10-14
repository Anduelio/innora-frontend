import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { DaySelection } from '@/types/domain'
import { addDaysIso, fmtDate, weekdayIndex } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { maxFreeNights } from '@/lib/inventory'
import { useKnownReservations } from '@/lib/api/reservations'
import { useRoomTypes, useRooms } from '@/lib/api/rooms'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { useCalendarStore, VIEW_PARAM, viewFromParam } from '@/store/calendarStore'
import { useUiStore } from '@/store/uiStore'
import { Button } from '@/components/atoms/Button/Button'
import { IconButton } from '@/components/atoms/IconButton/IconButton'
import { IconChevronLeft, IconChevronRight } from '@/components/atoms/Icon/icons'
import { Skeleton } from '@/components/atoms/Skeleton/Skeleton'
import { Card } from '@/components/molecules/Card/Card'
import { EmptyState } from '@/components/molecules/EmptyState/EmptyState'
import { SegmentedControl } from '@/components/molecules/SegmentedControl/SegmentedControl'
import { AvailabilityGrid } from '@/features/kalendari/AvailabilityGrid'
import { CalendarGrid } from '@/features/kalendari/CalendarGrid'
import { CalendarToolbar } from '@/features/kalendari/CalendarToolbar'
import { DayBoard } from '@/features/kalendari/DayBoard'
import s from './KalendariPage.module.scss'

function CalendarUrlSync() {
  const [params, setParams] = useSearchParams()
  const view = useCalendarStore((state) => state.view)
  const startDate = useCalendarStore((state) => state.startDate)
  const typeId = useCalendarStore((state) => state.typeId)
  const setView = useCalendarStore((state) => state.setView)
  const setStartDate = useCalendarStore((state) => state.setStartDate)
  const setTypeId = useCalendarStore((state) => state.setTypeId)

  useEffect(() => {
    const onPop = () => {
      const next = new URLSearchParams(window.location.search)
      const nextView = viewFromParam(next.get('pamja'))
      if (nextView) setView(nextView)
      setStartDate(next.get('nga') || TODAY)
      setTypeId(Number(next.get('tipi')) || 0)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [setStartDate, setTypeId, setView])

  useEffect(() => {
    const wanted = { nga: startDate, pamja: VIEW_PARAM[view], tipi: typeId ? String(typeId) : '' }
    if (params.get('nga') === wanted.nga && params.get('pamja') === wanted.pamja && (params.get('tipi') ?? '') === wanted.tipi) return
    const next = new URLSearchParams(params)
    next.set('nga', wanted.nga)
    next.set('pamja', wanted.pamja)
    if (wanted.tipi) next.set('tipi', wanted.tipi)
    else next.delete('tipi')
    setParams(next, { replace: true })
  }, [params, setParams, startDate, typeId, view])

  return null
}

type MobileView = 'day' | 'availability'

export function KalendariPage() {
  const { t } = useTranslation()
  const rooms = useRooms()
  const roomTypes = useRoomTypes()
  const known = useKnownReservations()
  const view = useCalendarStore((state) => state.view)
  const startDate = useCalendarStore((state) => state.startDate)
  const typeId = useCalendarStore((state) => state.typeId)
  const setStartDate = useCalendarStore((state) => state.setStartDate)
  const openCreate = useUiStore((state) => state.openCreate)
  const phone = useMediaQuery('(max-width: 767px)')
  const [mobileView, setMobileView] = useState<MobileView>('day')
  const weekdays = t('calendar.weekdaysLong', { returnObjects: true }) as string[]

  const roomList = rooms.data ?? []
  const typeList = roomTypes.data ?? []
  const roomData = rooms.data

  const onComplete = useCallback(
    (selection: DaySelection) => {
      const start = Math.min(selection.a, selection.b)
      const end = Math.max(selection.a, selection.b)
      const checkIn = addDaysIso(startDate, start)
      const room = roomData?.find((item) => item.id === selection.roomId)
      const max = maxFreeNights(known.reservations, room, checkIn)
      if (max < 1) return
      openCreate({ roomId: selection.roomId, checkIn, checkOut: addDaysIso(checkIn, Math.min(end - start + 1, max)) })
    },
    [known.reservations, openCreate, roomData, startDate],
  )

  if (rooms.isError || (known.isError && !known.reservations.length)) {
    return <EmptyState title={t('common.loadError')} description={t('common.loadErrorHint')} />
  }

  const loading = rooms.isLoading || roomTypes.isLoading || known.isLoading

  if (phone) {
    return (
      <div className={s.page}>
        <SegmentedControl<MobileView>
          label={t('kalendari.mobileTabs')}
          value={mobileView}
          onChange={setMobileView}
          block
          options={[
            { value: 'day', label: t('kalendari.dayList') },
            { value: 'availability', label: t('kalendari.availability') },
          ]}
        />
        {mobileView === 'day' ? (
          <>
            <div className={s.dayNav}>
              <IconButton variant="secondary" label={t('kalendari.previous')} onClick={() => setStartDate(addDaysIso(startDate, -1))}>
                <IconChevronLeft />
              </IconButton>
              <p className={s.dayLabel}>
                {weekdays[weekdayIndex(startDate)]}, {fmtDate(startDate)}
              </p>
              <IconButton variant="secondary" label={t('kalendari.next')} onClick={() => setStartDate(addDaysIso(startDate, 1))}>
                <IconChevronRight />
              </IconButton>
            </div>
            {startDate !== TODAY ? (
              <Button variant="ghost" onClick={() => setStartDate(TODAY)}>
                {t('common.today')}
              </Button>
            ) : null}
            {loading ? (
              <Skeleton height={300} />
            ) : (
              <DayBoard day={startDate} rooms={roomList} roomTypes={typeList} reservations={known.reservations} typeId={0} />
            )}
          </>
        ) : (
          <Card title={t('kalendari.availability')} description={t('kalendari.availabilityHint')}>
            <AvailabilityGrid start={TODAY} nights={14} rooms={roomList} roomTypes={typeList} reservations={known.reservations} />
          </Card>
        )}
      </div>
    )
  }

  return (
    <div className={s.page}>
      <CalendarUrlSync />
      <CalendarToolbar roomTypes={typeList} />
      {loading ? (
        <Skeleton height={480} />
      ) : view === 1 ? (
        <DayBoard day={startDate} rooms={roomList} roomTypes={typeList} reservations={known.reservations} typeId={typeId} />
      ) : (
        <CalendarGrid rooms={roomList} roomTypes={typeList} reservations={known.reservations} onComplete={onComplete} />
      )}
    </div>
  )
}
