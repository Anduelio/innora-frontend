import type { ReactNode } from 'react'
import clsx from 'clsx'
import s from './Card.module.scss'

export function Card({
  title,
  description,
  icon,
  actions,
  children,
  flush = false,
  className,
  id,
}: {
  title?: ReactNode
  description?: ReactNode
  icon?: ReactNode
  actions?: ReactNode
  children: ReactNode
  flush?: boolean
  className?: string
  id?: string
}) {
  return (
    <section className={clsx(s.card, className)} id={id}>
      {title ? (
        <header className={s.header}>
          {icon ? <span className={s.icon}>{icon}</span> : null}
          <div className={s.heading}>
            <h2 className={s.title}>{title}</h2>
            {description ? <p className={s.description}>{description}</p> : null}
          </div>
          {actions ? <div className={s.actions}>{actions}</div> : null}
        </header>
      ) : null}
      <div className={clsx(s.body, flush && s.flush)}>{children}</div>
    </section>
  )
}
