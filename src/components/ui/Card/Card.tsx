import type { ReactNode } from 'react'
import clsx from 'clsx'
import s from './Card.module.scss'

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={clsx(s.card, className)}>{children}</section>
}
