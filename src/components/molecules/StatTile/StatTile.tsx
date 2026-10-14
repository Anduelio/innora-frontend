import type { ReactNode } from 'react'
import clsx from 'clsx'
import s from './StatTile.module.scss'

export function StatTile({
  label,
  value,
  hint,
  icon,
  tone = 'neutral',
  onClick,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  tone?: 'neutral' | 'info' | 'success' | 'warning'
  onClick?: () => void
}) {
  const body = (
    <>
      <span className={s.top}>
        {icon ? <span className={clsx(s.icon, s[tone])}>{icon}</span> : null}
        <span className={s.label}>{label}</span>
      </span>
      <span className={s.value}>{value}</span>
      {hint ? <span className={s.hint}>{hint}</span> : null}
    </>
  )
  if (onClick) {
    return (
      <button type="button" className={clsx(s.tile, s.interactive)} onClick={onClick}>
        {body}
      </button>
    )
  }
  return <div className={s.tile}>{body}</div>
}
