import type { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'
import s from './Button.module.scss'

type Variant = 'primary' | 'secondary' | 'danger'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  block?: boolean
  spaced?: boolean
}

export function Button({ variant = 'primary', block = false, spaced = false, className, type = 'button', ...props }: Props) {
  return <button type={type} className={clsx(s.button, s[variant], block && s.block, spaced && s.spaced, className)} {...props} />
}
