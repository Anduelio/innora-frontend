import { forwardRef, type InputHTMLAttributes } from 'react'
import clsx from 'clsx'
import s from './TextInput.module.scss'

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...props }, ref) {
    return <input ref={ref} className={clsx(s.input, className)} {...props} />
  },
)
