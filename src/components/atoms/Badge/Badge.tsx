import type { ReactNode } from 'react'
import clsx from 'clsx'
import s from './Badge.module.scss'

export type BadgeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

export function Badge({
  tone = 'neutral',
  icon,
  children,
  className,
}: {
  tone?: BadgeTone
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <span className={clsx(s.badge, s[tone], className)}>
      {icon}
      {children}
    </span>
  )
}
