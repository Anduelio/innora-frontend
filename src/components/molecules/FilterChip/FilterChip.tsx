import clsx from 'clsx'
import s from './FilterChip.module.scss'

export function FilterChip({
  label,
  selected,
  count,
  onClick,
}: {
  label: string
  selected: boolean
  count?: number
  onClick: () => void
}) {
  return (
    <button type="button" className={clsx(s.chip, selected && s.isSelected)} aria-pressed={selected} onClick={onClick}>
      {label}
      {count === undefined ? null : <span className={s.count}>{count}</span>}
    </button>
  )
}
