import type { SelectHTMLAttributes } from 'react'
import s from './Select.module.scss'

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={s.select} {...props} />
}
