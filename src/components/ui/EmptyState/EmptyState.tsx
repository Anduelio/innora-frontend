import s from './EmptyState.module.scss'

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <p className={s.empty}>
      <span className={s.title}>{title}</span>
      {hint ? <span className={s.hint}>{hint}</span> : null}
    </p>
  )
}
