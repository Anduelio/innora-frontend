import type { InputHTMLAttributes } from 'react'
import clsx from 'clsx'
import s from './DateField.module.scss'

export type DateFieldMode = 'date' | 'time' | 'datetime' | 'month' | 'week'

const inputType: Record<DateFieldMode, InputHTMLAttributes<HTMLInputElement>['type']> = {
  date: 'date',
  time: 'time',
  datetime: 'datetime-local',
  month: 'month',
  week: 'week',
}

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'onChange'> & {
  mode?: DateFieldMode
  value: string
  onChange: (value: string) => void
}

export function DateField({ mode = 'date', value, onChange, className, ...props }: Props) {
  return (
    <input
      {...props}
      className={clsx(s.input, className)}
      type={inputType[mode]}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  )
}
