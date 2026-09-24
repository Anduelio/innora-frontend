import type { InputHTMLAttributes } from 'react'
import { IconSearch } from '@/components/icons'
import s from './SearchInput.module.scss'

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string }

export function SearchInput({ label, ...props }: Props) {
  return (
    <label className={s.wrap}>
      <IconSearch />
      <span className={s.hidden}>{label}</span>
      <input className={s.input} placeholder={label} {...props} />
    </label>
  )
}
