import s from './NumberStepper.module.scss'

export function NumberStepper({
  value,
  min,
  max,
  onChange,
  decreaseLabel,
  increaseLabel,
}: {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
  decreaseLabel: string
  increaseLabel: string
}) {
  return (
    <div className={s.stepper}>
      <button type="button" className={s.step} aria-label={decreaseLabel} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
        −
      </button>
      <div className={s.value}>{value}</div>
      <button type="button" className={s.step} aria-label={increaseLabel} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>
        +
      </button>
    </div>
  )
}
