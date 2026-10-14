import s from './RadioGroup.module.scss'

export type RadioOption = { value: string; label: string; disabled?: boolean }

export function RadioGroup({
  name,
  label,
  value,
  options,
  onChange,
}: {
  name: string
  label: string
  value: string
  options: RadioOption[]
  onChange: (value: string) => void
}) {
  return (
    <div className={s.group} role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <label key={option.value} className={s.option}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            disabled={option.disabled}
            onChange={() => onChange(option.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  )
}
