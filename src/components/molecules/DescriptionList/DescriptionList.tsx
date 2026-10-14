import type { ReactNode } from 'react'
import clsx from 'clsx'
import s from './DescriptionList.module.scss'

export type DescriptionItem = { label: string; value: ReactNode; emphasis?: boolean }

export function DescriptionList({ items, columns = 1 }: { items: DescriptionItem[]; columns?: 1 | 2 | 3 }) {
  return (
    <dl className={clsx(s.list, s[`cols${columns}`])}>
      {items.map((item) => (
        <div key={item.label} className={clsx(s.item, item.emphasis && s.emphasis)}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
