import { forwardRef, type SelectHTMLAttributes } from 'react'
import clsx from 'clsx'
import s from './Select.module.scss'

type Props = SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }

export const Select = forwardRef<HTMLSelectElement, Props>(function Select({ className, invalid = false, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={clsx(s.select, invalid && s.invalid, className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  )
})
