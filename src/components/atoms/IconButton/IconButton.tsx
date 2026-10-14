import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import clsx from 'clsx'
import s from './IconButton.module.scss'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  variant?: 'ghost' | 'secondary'
  children: ReactNode
}

export const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  { label, variant = 'ghost', children, type = 'button', className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={clsx(s.button, s[variant], className)}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  )
})
