import { useRef, type KeyboardEvent } from 'react'
import clsx from 'clsx'
import s from './Tabs.module.scss'

export type TabItem<T extends string> = { value: T; label: string; count?: number }

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  idPrefix,
}: {
  items: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  label: string
  idPrefix: string
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    event.preventDefault()
    const next = (index + step + items.length) % items.length
    const item = items[next]
    if (!item) return
    onChange(item.value)
    refs.current[next]?.focus()
  }

  return (
    <div className={s.tabs} role="tablist" aria-label={label}>
      {items.map((item, index) => {
        const selected = item.value === value
        return (
          <button
            key={item.value}
            ref={(node) => {
              refs.current[index] = node
            }}
            id={`${idPrefix}-tab-${item.value}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${item.value}`}
            tabIndex={selected ? 0 : -1}
            className={clsx(s.tab, selected && s.isSelected)}
            onClick={() => onChange(item.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {item.label}
            {item.count === undefined ? null : <span className={s.count}>{item.count}</span>}
          </button>
        )
      })}
    </div>
  )
}

export function tabPanelProps(idPrefix: string, value: string) {
  return {
    id: `${idPrefix}-panel-${value}`,
    role: 'tabpanel' as const,
    'aria-labelledby': `${idPrefix}-tab-${value}`,
    tabIndex: 0,
  }
}
