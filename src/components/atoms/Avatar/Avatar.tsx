import clsx from 'clsx'
import { initials } from '@/lib/reservation'
import s from './Avatar.module.scss'

const tones = [s.t1, s.t2, s.t3, s.t4, s.t5]

function toneFor(name: string): string | undefined {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return tones[hash % tones.length]
}

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={clsx(s.avatar, s[size], toneFor(name))} aria-hidden="true">
      {initials(name)}
    </span>
  )
}
