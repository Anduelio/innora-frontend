import { useTranslation } from 'react-i18next'
import type { CalendarView, RoomTypeInfo } from '@/types/domain'
import { Button } from '@/components/atoms/Button/Button'
import { IconButton } from '@/components/atoms/IconButton/IconButton'
import { IconChevronLeft, IconChevronRight } from '@/components/atoms/Icon/icons'
import { Select } from '@/components/atoms/Select/Select'
import { SegmentedControl } from '@/components/molecules/SegmentedControl/SegmentedControl'
import { fmtDate, monthSpanLabel, weekdayIndex } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { useCalendarStore, visibleDays } from '@/store/calendarStore'
import s from './CalendarToolbar.module.scss'

export function CalendarToolbar({ roomTypes }: { roomTypes: RoomTypeInfo[] }) {
  const { t } = useTranslation()
  const view = useCalendarStore((state) => state.view)
  const startDate = useCalendarStore((state) => state.startDate)
  const typeId = useCalendarStore((state) => state.typeId)
  const setView = useCalendarStore((state) => state.setView)
  const setStartDate = useCalendarStore((state) => state.setStartDate)
  const setTypeId = useCalendarStore((state) => state.setTypeId)
  const step = useCalendarStore((state) => state.step)
  const months = t('calendar.months', { returnObjects: true }) as string[]
  const monthsShort = t('calendar.monthsShort', { returnObjects: true }) as string[]
  const weekdays = t('calendar.weekdaysLong', { returnObjects: true }) as string[]
  const label =
    view === 1
      ? `${weekdays[weekdayIndex(startDate)] ?? ''}, ${fmtDate(startDate)}`
      : monthSpanLabel(startDate, visibleDays(view, startDate), months, monthsShort)

  return (
    <div className={s.toolbar}>
      <div className={s.nav}>
        <IconButton variant="secondary" label={t('kalendari.previous')} onClick={() => step(-1)}>
          <IconChevronLeft />
        </IconButton>
        <Button variant="secondary" onClick={() => setStartDate(TODAY)}>
          {t('common.today')}
        </Button>
        <IconButton variant="secondary" label={t('kalendari.next')} onClick={() => step(1)}>
          <IconChevronRight />
        </IconButton>
        <h2 className={s.label} aria-live="polite">
          {label}
        </h2>
      </div>
      <div className={s.controls}>
        <SegmentedControl<CalendarView>
          label={t('kalendari.view')}
          value={view}
          onChange={setView}
          options={[
            { value: 1, label: t('kalendari.views.day') },
            { value: 7, label: t('kalendari.views.week') },
            { value: 30, label: t('kalendari.views.month') },
          ]}
        />
        <Select aria-label={t('kalendari.type')} className={s.type} value={typeId} onChange={(event) => setTypeId(Number(event.target.value))}>
          <option value={0}>{t('kalendari.allTypes')}</option>
          {roomTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </Select>
      </div>
    </div>
  )
}
