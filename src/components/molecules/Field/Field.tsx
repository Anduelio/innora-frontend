import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import s from './Field.module.scss'

export function Field({
  label,
  htmlFor,
  children,
  hint,
  error,
  optional = false,
  aside,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
  hint?: ReactNode
  error?: string
  optional?: boolean
  aside?: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <div className={s.field}>
      <div className={s.top}>
        <label className={s.label} htmlFor={htmlFor}>
          {label}
          {optional ? <span className={s.optional}> {t('common.optional')}</span> : null}
        </label>
        {aside}
      </div>
      {children}
      {error ? (
        <p className={s.error} role="alert">
          {error}
        </p>
      ) : hint ? (
        <div className={s.hint}>{hint}</div>
      ) : null}
    </div>
  )
}
