import clsx from 'clsx'
import s from './DayCell.module.scss'

export function DayCell({
  roomId,
  index,
  label,
  selected,
  today,
  weekend,
  focused,
}: {
  roomId: string
  index: number
  label: string
  selected: boolean
  today: boolean
  weekend: boolean
  focused: boolean
}) {
  return (
    <div
      id={`day-${roomId}-${index}`}
      role="gridcell"
      tabIndex={focused ? 0 : -1}
      aria-selected={selected}
      aria-label={label}
      data-day={index}
      data-room={roomId}
      className={clsx(
        s.cell,
        selected && s.isSelected,
        today && !selected && s.isToday,
        weekend && !today && !selected && s.isWeekend,
      )}
    />
  )
}
