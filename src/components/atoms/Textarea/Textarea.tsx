import { forwardRef, type TextareaHTMLAttributes } from 'react'
import clsx from 'clsx'
import s from './Textarea.module.scss'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={clsx(s.area, className)} {...props} />
  },
)
