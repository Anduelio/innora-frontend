import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import clsx from 'clsx'
import s from './TextInput.module.scss'

type Props = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean
  start?: ReactNode
  end?: ReactNode
}

export const TextInput = forwardRef<HTMLInputElement, Props>(function TextInput(
  { className, invalid = false, start, end, ...props },
  ref,
) {
  if (!start && !end) {
    return <input ref={ref} className={clsx(s.input, invalid && s.invalid, className)} aria-invalid={invalid || undefined} {...props} />
  }
  return (
    <span className={clsx(s.group, invalid && s.invalid, className)}>
      {start ? <span className={s.adornment}>{start}</span> : null}
      <input ref={ref} aria-invalid={invalid || undefined} {...props} />
      {end ? <span className={s.adornment}>{end}</span> : null}
    </span>
  )
})
