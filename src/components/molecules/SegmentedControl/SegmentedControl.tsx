import type { ReactNode } from 'react'
import clsx from 'clsx'
import s from './SegmentedControl.module.scss'

export function SegmentedControl<T extends string | number>({
  value,
  options,
  onChange,
  label,
  block = false,
}: {
  value: T
  options: { value: T; label: string; icon?: ReactNode }[]
  onChange: (value: T) => void
  label: string
  block?: boolean
}) {
  return (
    <div className={clsx(s.group, block && s.block)} role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          className={clsx(s.option, option.value === value && s.isActive)}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.icon}
          {option.label}
        </button>
      ))}
    </div>
  )
}
