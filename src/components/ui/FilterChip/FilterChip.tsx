import clsx from 'clsx'
import s from './FilterChip.module.scss'

export function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button type="button" className={clsx(s.chip, selected && s.isSelected)} aria-pressed={selected} onClick={onClick}>
      {label}
    </button>
  )
}
