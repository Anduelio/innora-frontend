import { memo } from 'react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import s from './CalendarHeaderRow.module.scss'

export const CalendarHeaderRow = memo(function CalendarHeaderRow({
  days,
}: {
  days: { iso: string; label: string; number: string; today: boolean; weekend: boolean }[]
}) {
  const { t } = useTranslation()
  return (
    <div className={s.row} role="row">
      <div className={s.room} role="columnheader">
        {t('kalendari.roomsColumn')}
      </div>
      {days.map((day) => (
        <div
          key={day.iso}
          role="columnheader"
          aria-current={day.today ? 'date' : undefined}
          className={clsx(s.day, day.today && s.isToday, day.weekend && !day.today && s.isWeekend)}
        >
          <span className={s.dow}>{day.label}</span>
          <span className={s.num}>{day.number}</span>
        </div>
      ))}
    </div>
  )
})
