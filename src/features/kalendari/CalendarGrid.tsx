import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import type { DaySelection, Reservation, Room } from '@/types/domain'
import { columnWidth, isWeekend, rangeOf, weekdayIndex } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { useDragSelect } from '@/lib/hooks/useDragSelect'
import { useCalendarStore } from '@/store/calendarStore'
import { useUiStore } from '@/store/uiStore'
import { CalendarHeaderRow } from '@/features/kalendari/CalendarHeaderRow'
import { CalendarLegend } from '@/features/kalendari/CalendarLegend'
import { RoomRow } from '@/features/kalendari/RoomRow'
import s from './CalendarGrid.module.scss'

export function CalendarGrid({
  rooms,
  reservations,
  onComplete,
}: {
  rooms: Room[]
  reservations: Reservation[]
  onComplete: (selection: DaySelection) => void
}) {
  const { t } = useTranslation()
  const view = useCalendarStore((state) => state.view)
  const startDate = useCalendarStore((state) => state.startDate)
  const density = useCalendarStore((state) => state.density)
  const setSelection = useCalendarStore((state) => state.setSelection)
  const openDrawer = useUiStore((state) => state.openDrawer)
  const drag = useDragSelect(onComplete)
  const [focus, setFocus] = useState({ room: 0, day: 0 })
  const shouldFocus = useRef(false)
  const dayNames = t('calendar.days', { returnObjects: true }) as string[]
  const monthsShort = t('calendar.monthsShort', { returnObjects: true }) as string[]
  const dates = rangeOf(startDate, view)
  const colW = columnWidth(view)

  useEffect(() => {
    if (!shouldFocus.current) return
    shouldFocus.current = false
    const room = rooms[focus.room]
    if (!room) return
    const cell = document.getElementById(`day-${room.id}-${focus.day}`)
    cell?.focus({ preventScroll: true })
    cell?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [focus, rooms])

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const horizontal = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    const vertical = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0
    if (event.key === 'Enter') {
      event.preventDefault()
      const room = rooms[focus.room]
      if (!room) return
      const current = useCalendarStore.getState().selection
      if (current && current.roomId === room.id) onComplete(current)
      else onComplete({ roomId: room.id, a: focus.day, b: focus.day })
      setSelection(null)
      return
    }
    if (!horizontal && !vertical) return
    event.preventDefault()
    const nextRoom = Math.min(rooms.length - 1, Math.max(0, focus.room + vertical))
    const nextDay = Math.min(view - 1, Math.max(0, focus.day + horizontal))
    const room = rooms[focus.room]
    if (event.shiftKey && horizontal && room) {
      const existing = useCalendarStore.getState().selection
      const anchor = existing && existing.roomId === room.id ? existing.a : focus.day
      setSelection({ roomId: room.id, a: anchor, b: nextDay })
    }
    shouldFocus.current = true
    setFocus({ room: nextRoom, day: nextDay })
  }

  const headerDays = dates.map((iso) => ({
    iso,
    label: dayNames[weekdayIndex(iso)] ?? '',
    number: String(Number(iso.slice(8, 10))),
    today: iso === TODAY,
    weekend: isWeekend(iso),
  }))

  return (
    <section className={s.frame}>
      <div className={s.scroller}>
        <div
          className={clsx(s.sheet, s[`view${view}`], density === 'kompakt' && s.kompakt)}
          role="grid"
          aria-label={t('nav.kalendari')}
          onKeyDown={onKeyDown}
        >
          <CalendarHeaderRow days={headerDays} />
          {rooms.map((room, roomIndex) => (
            <RoomRow
              key={room.id}
              room={room}
              dates={dates}
              reservations={reservations}
              colW={colW}
              monthsShort={monthsShort}
              focusedDay={focus.room === roomIndex ? focus.day : null}
              comfortable={density === 'komod'}
              onBegin={(roomId, day) => {
                drag.begin(roomId, day)
                shouldFocus.current = true
                setFocus({ room: roomIndex, day })
              }}
              onExtend={drag.extend}
              onOpen={openDrawer}
            />
          ))}
        </div>
      </div>
      <CalendarLegend />
    </section>
  )
}
