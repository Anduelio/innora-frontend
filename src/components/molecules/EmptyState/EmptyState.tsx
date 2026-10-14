import type { ReactNode } from 'react'
import clsx from 'clsx'
import s from './EmptyState.module.scss'

export function EmptyState({
  title,
  description,
  icon,
  action,
  compact = false,
}: {
  title: string
  description?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  compact?: boolean
}) {
  return (
    <div className={clsx(s.empty, compact && s.compact)}>
      {icon ? <span className={s.icon}>{icon}</span> : null}
      <p className={s.title}>{title}</p>
      {description ? <p className={s.description}>{description}</p> : null}
      {action ? <div className={s.action}>{action}</div> : null}
    </div>
  )
}
