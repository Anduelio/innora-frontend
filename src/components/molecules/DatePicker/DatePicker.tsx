import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import {
  addDaysIso,
  addMonthsIso,
  daysInMonth,
  fmtDate,
  parseISODate,
  startOfMonthIso,
  startOfWeekIso,
} from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { useClickOutside } from '@/lib/hooks/useClickOutside'
import { IconCalendar, IconChevronLeft, IconChevronRight } from '@/components/atoms/Icon/icons'
import s from './DatePicker.module.scss'

export function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  label,
  invalid = false,
  align = 'start',
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  min?: string
  max?: string
  label: string
  invalid?: boolean
  align?: 'start' | 'end'
}) {
  const { t } = useTranslation()
  const generated = useId()
  const controlId = id ?? generated
  const months = t('calendar.months', { returnObjects: true }) as string[]
  const weekdays = t('calendar.weekdaysMondayFirst', { returnObjects: true }) as string[]
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => startOfMonthIso(value || TODAY))
  const [focusDay, setFocusDay] = useState(value || TODAY)
  const rootRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const close = useCallback(() => setOpen(false), [])
  useClickOutside(rootRef, close, open)

  useEffect(() => {
    if (!open) return
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-day="${focusDay}"]`)?.focus()
  }, [focusDay, open, month])

  const days = useMemo(() => {
    const lead = (parseISODate(month).getDay() + 6) % 7
    const count = Math.ceil((lead + daysInMonth(month)) / 7) * 7
    const first = startOfWeekIso(month)
    return Array.from({ length: count }, (_, index) => addDaysIso(first, index))
  }, [month])

  const allowed = (iso: string) => (!min || iso >= min) && (!max || iso <= max)

  const toggle = () => {
    if (open) {
      setOpen(false)
      return
    }
    const start = value || (min && min > TODAY ? min : TODAY)
    setMonth(startOfMonthIso(start))
    setFocusDay(start)
    setOpen(true)
  }

  const choose = (iso: string) => {
    if (!allowed(iso)) return
    onChange(iso)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const move = (days: number) => {
    const next = addDaysIso(focusDay, days)
    setFocusDay(next)
    if (startOfMonthIso(next) !== month) setMonth(startOfMonthIso(next))
  }

  const onGridKey = (event: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    const step = steps[event.key]
    if (step) {
      event.preventDefault()
      move(step)
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
    }
  }

  const monthDate = parseISODate(month)

  return (
    <div ref={rootRef} className={s.root}>
      <button
        ref={triggerRef}
        id={controlId}
        type="button"
        className={clsx(s.trigger, invalid && s.invalid)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={value ? `${label}: ${fmtDate(value)}` : label}
        onClick={toggle}
      >
        <IconCalendar size={18} className={s.icon} />
        <span className={clsx(!value && s.placeholder)}>{value ? fmtDate(value) : 'dd.mm.vvvv'}</span>
      </button>
      {open ? (
        <div className={clsx(s.panel, align === 'end' && s.alignEnd)} role="dialog" aria-label={label}>
          <div className={s.head}>
            <button
              type="button"
              className={s.nav}
              aria-label={t('calendar.previousMonth')}
              onClick={() => setMonth(addMonthsIso(month, -1))}
            >
              <IconChevronLeft size={18} />
            </button>
            <p className={s.month} aria-live="polite">
              {months[monthDate.getMonth()]} {monthDate.getFullYear()}
            </p>
            <button
              type="button"
              className={s.nav}
              aria-label={t('calendar.nextMonth')}
              onClick={() => setMonth(addMonthsIso(month, 1))}
            >
              <IconChevronRight size={18} />
            </button>
          </div>
          <div className={s.weekdays} aria-hidden="true">
            {weekdays.map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>
          <div ref={gridRef} className={s.grid} role="grid" onKeyDown={onGridKey}>
            {days.map((iso) => {
              const outside = startOfMonthIso(iso) !== month
              return (
                <button
                  key={iso}
                  type="button"
                  data-day={iso}
                  tabIndex={iso === focusDay ? 0 : -1}
                  className={clsx(
                    s.day,
                    outside && s.outside,
                    iso === TODAY && s.today,
                    iso === value && s.selected,
                  )}
                  disabled={!allowed(iso)}
                  aria-pressed={iso === value}
                  aria-label={fmtDate(iso)}
                  onClick={() => choose(iso)}
                >
                  {Number(iso.slice(8, 10))}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
