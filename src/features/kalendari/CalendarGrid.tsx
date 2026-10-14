import { Fragment, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import type { DaySelection, Reservation, Room, RoomTypeInfo } from '@/types/domain'
import { columnWidth, isWeekend, rangeOf, ROOM_COLUMN_PX, weekdayIndex } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { useDragSelect } from '@/lib/hooks/useDragSelect'
import { useCalendarStore, visibleDays } from '@/store/calendarStore'
import { useUiStore } from '@/store/uiStore'
import { CalendarHeaderRow } from '@/features/kalendari/CalendarHeaderRow'
import { CalendarLegend } from '@/features/kalendari/CalendarLegend'
import { RoomRow } from '@/features/kalendari/RoomRow'
import { TypeHeaderRow } from '@/features/kalendari/TypeHeaderRow'
import { UnassignedLanes } from '@/features/kalendari/UnassignedLanes'
import s from './CalendarGrid.module.scss'

export function CalendarGrid({
  rooms,
  roomTypes,
  reservations,
  onComplete,
}: {
  rooms: Room[]
  roomTypes: RoomTypeInfo[]
  reservations: Reservation[]
  onComplete: (selection: DaySelection) => void
}) {
  const { t } = useTranslation()
  const view = useCalendarStore((state) => state.view)
  const startDate = useCalendarStore((state) => state.startDate)
  const typeId = useCalendarStore((state) => state.typeId)
  const selection = useCalendarStore((state) => state.selection)
  const setSelection = useCalendarStore((state) => state.setSelection)
  const openDrawer = useUiStore((state) => state.openDrawer)
  const drag = useDragSelect(onComplete)
  const [focus, setFocus] = useState({ room: 0, day: 0 })
  const shouldFocus = useRef(false)
  const dayNames = t('calendar.weekdaysShort', { returnObjects: true }) as string[]
  const days = visibleDays(view, startDate)
  const dates = useMemo(() => rangeOf(startDate, days), [startDate, days])
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [trackWidth, setTrackWidth] = useState(0)
  const colW = Math.max(columnWidth(view), Math.floor(trackWidth / dates.length))

  useLayoutEffect(() => {
    const node = scrollerRef.current
    if (!node) return
    const measure = () => setTrackWidth(Math.max(0, node.clientWidth - ROOM_COLUMN_PX))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const groups = useMemo(
    () =>
      roomTypes
        .filter((type) => !typeId || type.id === typeId)
        .map((type) => ({ type, rooms: rooms.filter((room) => room.roomTypeId === type.id) }))
        .filter((group) => group.rooms.length > 0),
    [roomTypes, rooms, typeId],
  )
  const ordered = useMemo(() => groups.flatMap((group) => group.rooms), [groups])
  const laneReservations = useMemo(
    () => (typeId ? reservations.filter((item) => item.roomTypeId === typeId) : reservations),
    [reservations, typeId],
  )

  useEffect(() => {
    if (!shouldFocus.current) return
    shouldFocus.current = false
    const room = ordered[focus.room]
    if (!room) return
    const cell = document.getElementById(`day-${room.id}-${focus.day}`)
    cell?.focus({ preventScroll: true })
    cell?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [focus, ordered])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const horizontal = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    const vertical = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0
    const room = ordered[focus.room]
    if (event.key === 'Enter' && room && (event.target as HTMLElement).dataset.day !== undefined) {
      event.preventDefault()
      const current = useCalendarStore.getState().selection
      onComplete(current && current.roomId === room.id ? current : { roomId: room.id, a: focus.day, b: focus.day })
      setSelection(null)
      return
    }
    if ((!horizontal && !vertical) || (event.target as HTMLElement).dataset.day === undefined) return
    event.preventDefault()
    const nextRoom = Math.min(ordered.length - 1, Math.max(0, focus.room + vertical))
    const nextDay = Math.min(dates.length - 1, Math.max(0, focus.day + horizontal))
    if (event.shiftKey && horizontal && room) {
      const existing = useCalendarStore.getState().selection
      setSelection({ roomId: room.id, a: existing && existing.roomId === room.id ? existing.a : focus.day, b: nextDay })
    }
    shouldFocus.current = true
    setFocus({ room: nextRoom, day: nextDay })
  }

  const headerDays = useMemo(
    () =>
      dates.map((iso) => ({
        iso,
        label: dayNames[weekdayIndex(iso)] ?? '',
        number: String(Number(iso.slice(8, 10))),
        today: iso === TODAY,
        weekend: isWeekend(iso),
      })),
    [dates, dayNames],
  )

  let roomIndex = -1

  return (
    <section className={s.frame}>
      <div ref={scrollerRef} className={s.scroller}>
        <div
          className={clsx(s.sheet, view === 30 ? s.month : s.week)}
          style={{ '--col-w': `${colW}px` } as CSSProperties}
          role="grid"
          aria-label={t('nav.kalendari')}
          aria-rowcount={ordered.length + groups.length + 1}
          onKeyDown={onKeyDown}
        >
          <CalendarHeaderRow days={headerDays} />
          {groups.map((group) => (
            <Fragment key={group.type.id}>
              <TypeHeaderRow type={group.type} rooms={rooms} dates={dates} reservations={reservations} />
              {group.rooms.map((room) => {
                roomIndex += 1
                const index = roomIndex
                return (
                  <RoomRow
                    key={room.id}
                    room={room}
                    dates={dates}
                    reservations={reservations}
                    colW={colW}
                    selection={selection?.roomId === room.id ? selection : null}
                    focusedDay={focus.room === index ? focus.day : null}
                    onBegin={(id, day) => {
                      drag.begin(id, day)
                      shouldFocus.current = true
                      setFocus({ room: index, day })
                    }}
                    onExtend={drag.extend}
                    onOpen={openDrawer}
                  />
                )
              })}
            </Fragment>
          ))}
          <UnassignedLanes dates={dates} reservations={laneReservations} colW={colW} onOpen={openDrawer} />
        </div>
      </div>
      <CalendarLegend />
    </section>
  )
}
