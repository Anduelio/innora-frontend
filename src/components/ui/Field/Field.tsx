import type { ReactNode } from 'react'
import s from './Field.module.scss'

export function Field({
  label,
  htmlFor,
  children,
  error,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
  error?: string
}) {
  return (
    <div className={s.field}>
      <label className={s.label} htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? <p className={s.error}>{error}</p> : null}
    </div>
  )
}
