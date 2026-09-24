import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'
import s from './IconButton.module.scss'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  tone?: 'plain' | 'muted'
  children: ReactNode
}

export function IconButton({ label, tone = 'plain', children, type = 'button', ...props }: Props) {
  return (
    <button type={type} className={clsx(s.button, tone === 'muted' && s.muted)} aria-label={label} {...props}>
      {children}
    </button>
  )
}
