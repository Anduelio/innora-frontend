import type { ReactNode } from 'react'
import s from './VisuallyHidden.module.scss'

export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className={s.hidden}>{children}</span>
}
