import { create } from 'zustand'
import type { CalendarView, DaySelection, Density } from '@/types/domain'
import { addDaysIso } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'

function readInitial(): { view: CalendarView; startDate: string } {
  if (typeof window === 'undefined') return { view: 14, startDate: TODAY }
  const params = new URLSearchParams(window.location.search)
  const pamja = Number(params.get('pamja'))
  const view: CalendarView = pamja === 7 || pamja === 14 || pamja === 30 ? pamja : 14
  return { view, startDate: params.get('nga') || TODAY }
}

const initial = readInitial()

interface CalendarState {
  view: CalendarView
  startDate: string
  density: Density
  selection: DaySelection | null
  setView: (view: CalendarView) => void
  setStartDate: (startDate: string) => void
  moveStart: (days: number) => void
  setSelection: (selection: DaySelection | null) => void
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  view: initial.view,
  startDate: initial.startDate,
  density: 'komod',
  selection: null,
  setView: (view) => set({ view }),
  setStartDate: (startDate) => set({ startDate }),
  moveStart: (days) => set({ startDate: addDaysIso(get().startDate, days) }),
  setSelection: (selection) => set({ selection }),
}))
