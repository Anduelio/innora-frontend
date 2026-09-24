import s from './EmptyState.module.scss'

export function EmptyState({ title }: { title: string }) {
  return <p className={s.empty}>{title}</p>
}
