import type { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'
import s from './Switch.module.scss'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'role'> & {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

export function Switch({ checked, onChange, label, className, ...props }: Props) {
  return (
    <button
      {...props}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={clsx(s.switch, checked && s.on, className)}
      onClick={() => onChange(!checked)}
    >
      <span className={s.knob} />
    </button>
  )
}
