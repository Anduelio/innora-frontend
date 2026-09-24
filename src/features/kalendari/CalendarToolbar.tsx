import { useTranslation } from 'react-i18next'
import { IconChevronLeft, IconChevronRight } from '@/components/icons'
import { Button } from '@/components/ui/Button/Button'
import { IconButton } from '@/components/ui/IconButton/IconButton'
import { SegmentedControl } from '@/components/ui/SegmentedControl/SegmentedControl'
import { monthSpanLabel } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { useCalendarStore } from '@/store/calendarStore'
import type { CalendarView } from '@/types/domain'
import s from './CalendarToolbar.module.scss'

export function CalendarToolbar() {
  const { t } = useTranslation()
  const view = useCalendarStore((state) => state.view)
  const startDate = useCalendarStore((state) => state.startDate)
  const setView = useCalendarStore((state) => state.setView)
  const setStartDate = useCalendarStore((state) => state.setStartDate)
  const moveStart = useCalendarStore((state) => state.moveStart)
  const months = t('calendar.months', { returnObjects: true }) as string[]
  const monthsShort = t('calendar.monthsShort', { returnObjects: true }) as string[]

  return (
    <div className={s.toolbar}>
      <div className={s.nav}>
        <IconButton label={t('common.previousDays')} onClick={() => moveStart(-7)}>
          <IconChevronLeft />
        </IconButton>
        <div className={s.label}>{monthSpanLabel(startDate, view, months, monthsShort)}</div>
        <IconButton label={t('common.nextDays')} onClick={() => moveStart(7)}>
          <IconChevronRight />
        </IconButton>
      </div>
      <Button variant="secondary" onClick={() => setStartDate(TODAY)}>
        {t('common.today')}
      </Button>
      <SegmentedControl<CalendarView>
        label={t('nav.kalendari')}
        value={view}
        onChange={setView}
        options={[
          { value: 7, label: t('calendar.view7') },
          { value: 14, label: t('calendar.view14') },
          { value: 30, label: t('calendar.view30') },
        ]}
      />
    </div>
  )
}
