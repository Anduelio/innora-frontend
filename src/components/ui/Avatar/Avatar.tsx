import s from './Avatar.module.scss'

export function Avatar({ initials }: { initials: string }) {
  return <span className={s.avatar}>{initials}</span>
}
