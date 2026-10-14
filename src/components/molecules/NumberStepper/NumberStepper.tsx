import { IconMinus, IconPlus } from '@/components/atoms/Icon/icons'
import s from './NumberStepper.module.scss'

export function NumberStepper({
  id,
  value,
  min,
  max,
  onChange,
  decreaseLabel,
  increaseLabel,
}: {
  id?: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  decreaseLabel: string
  increaseLabel: string
}) {
  return (
    <div className={s.stepper}>
      <button
        type="button"
        className={s.step}
        aria-label={decreaseLabel}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        <IconMinus size={18} />
      </button>
      <output id={id} className={s.value} aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        className={s.step}
        aria-label={increaseLabel}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
      >
        <IconPlus size={18} />
      </button>
    </div>
  )
}
