import { DateField, type DateFieldMode } from '@/components/ui/DateField/DateField'
import s from './DateField.module.scss'

export function DateRangeField({
  mode = 'date',
  from,
  to,
  onFromChange,
  onToChange,
  fromLabel,
  toLabel,
  fromId,
  toId,
  min,
  max,
}: {
  mode?: Extract<DateFieldMode, 'date' | 'datetime' | 'time'>
  from: string
  to: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  fromLabel: string
  toLabel: string
  fromId?: string
  toId?: string
  min?: string
  max?: string
}) {
  return (
    <div className={s.range}>
      <label className={s.rangeField} htmlFor={fromId}>
        <span>{fromLabel}</span>
        <DateField id={fromId} mode={mode} value={from} min={min} max={to || max} onChange={onFromChange} />
      </label>
      <label className={s.rangeField} htmlFor={toId}>
        <span>{toLabel}</span>
        <DateField id={toId} mode={mode} value={to} min={from || min} max={max} onChange={onToChange} />
      </label>
    </div>
  )
}
