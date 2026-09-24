import type { InputHTMLAttributes, ReactNode } from 'react'
import s from './Checkbox.module.scss'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: ReactNode
}

export function Checkbox({ label, id, ...props }: Props) {
  return (
    <label className={s.row} htmlFor={id}>
      <input id={id} className={s.box} type="checkbox" {...props} />
      <span>{label}</span>
    </label>
  )
}
