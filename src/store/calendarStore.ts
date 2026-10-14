import { create } from 'zustand'
import type { CalendarView, DaySelection } from '@/types/domain'
import { addDaysIso, addMonthsIso, daysInMonth, startOfMonthIso } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { readPersistent } from '@/lib/hooks/usePersistentState'

export const DEFAULT_VIEW_KEY = 'calendar-view'

function defaultView(): CalendarView {
  const stored = readPersistent<number>(DEFAULT_VIEW_KEY, 7)
  return stored === 1 || stored === 30 ? stored : 7
}

export const VIEW_PARAM: Record<CalendarView, string> = { 1: 'dite', 7: 'jave', 30: 'muaj' }

export function viewFromParam(value: string | null): CalendarView | null {
  if (value === 'dite') return 1
  if (value === 'jave') return 7
  if (value === 'muaj') return 30
  return null
}

export function visibleDays(view: CalendarView, startDate: string): number {
  return view === 30 ? daysInMonth(startDate) : view
}

function readInitial(): { view: CalendarView; startDate: string; typeId: number } {
  if (typeof window === 'undefined') return { view: 7, startDate: TODAY, typeId: 0 }
  const params = new URLSearchParams(window.location.search)
  return {
    view: viewFromParam(params.get('pamja')) ?? defaultView(),
    startDate: params.get('nga') || TODAY,
    typeId: Number(params.get('tipi')) || 0,
  }
}

const initial = readInitial()

interface CalendarState {
  view: CalendarView
  startDate: string
  typeId: number
  selection: DaySelection | null
  setView: (view: CalendarView) => void
  setStartDate: (startDate: string) => void
  setTypeId: (typeId: number) => void
  step: (direction: 1 | -1) => void
  setSelection: (selection: DaySelection | null) => void
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  view: initial.view,
  startDate: initial.startDate,
  typeId: initial.typeId,
  selection: null,
  setView: (view) => set({ view, startDate: view === 30 ? startOfMonthIso(get().startDate) : get().startDate }),
  setStartDate: (startDate) => set({ startDate }),
  setTypeId: (typeId) => set({ typeId }),
  step: (direction) => {
    const { view, startDate } = get()
    set({ startDate: view === 30 ? addMonthsIso(startDate, direction) : addDaysIso(startDate, direction * view) })
  },
  setSelection: (selection) => set({ selection }),
}))
