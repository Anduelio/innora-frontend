import type { ReactNode } from 'react'
import clsx from 'clsx'
import s from './Badge.module.scss'

type Tone = 'neutral' | 'ok' | 'warn'

export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={clsx(s.badge, s[tone])}>{children}</span>
}
