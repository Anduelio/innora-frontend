import type { ReactNode } from 'react'
import clsx from 'clsx'
import { IconAlert, IconCheckCircle, IconInfo, IconXCircle } from '@/components/atoms/Icon/icons'
import s from './Alert.module.scss'

type Tone = 'info' | 'success' | 'warning' | 'danger'

const icons: Record<Tone, ReactNode> = {
  info: <IconInfo />,
  success: <IconCheckCircle />,
  warning: <IconAlert />,
  danger: <IconXCircle />,
}

export function Alert({
  tone = 'info',
  title,
  children,
  action,
  className,
}: {
  tone?: Tone
  title: ReactNode
  children?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={clsx(s.alert, s[tone], className)} role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}>
      <span className={s.icon}>{icons[tone]}</span>
      <div className={s.body}>
        <p className={s.title}>{title}</p>
        {children ? <div className={s.text}>{children}</div> : null}
      </div>
      {action ? <div className={s.action}>{action}</div> : null}
    </div>
  )
}
