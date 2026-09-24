import { useId, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { useClickOutside } from '@/lib/hooks/useClickOutside'
import { useDisclosure } from '@/lib/hooks/useDisclosure'
import type { DropdownOption, DropdownProps } from '@/components/ui/Dropdown/types'
import s from './Dropdown.module.scss'

function selectedLabels(options: DropdownOption[], values: string[]): string[] {
  return values.map((value) => options.find((option) => option.value === value)?.label ?? value)
}

export function Dropdown(props: DropdownProps) {
  const {
    id,
    label,
    placeholder = '',
    disabled = false,
    invalid = false,
    options,
    searchable = false,
    searchValue,
    onSearchChange,
    searchPlaceholder = '',
    emptyLabel = '',
    loading = false,
    loadingLabel = '',
    hasMore = false,
    onLoadMore,
    loadMoreLabel = '',
  } = props
  const generatedId = useId()
  const controlId = id ?? generatedId
  const listId = `${controlId}-list`
  const rootRef = useRef<HTMLDivElement>(null)
  const { open, toggle, close } = useDisclosure(false)
  const [localQuery, setLocalQuery] = useState('')
  const query = searchValue ?? localQuery

  useClickOutside(rootRef, close, open)

  const visible = useMemo(() => {
    if (onSearchChange || !searchable) return options
    const needle = query.trim().toLowerCase()
    if (!needle) return options
    return options.filter((option) => option.label.toLowerCase().includes(needle))
  }, [onSearchChange, options, query, searchable])

  const values = props.multiple ? props.value : props.value ? [props.value] : []
  const summary = values.length > 0 ? selectedLabels(options, values).join(', ') : placeholder

  const choose = (option: DropdownOption) => {
    if (option.disabled) return
    if (props.multiple) {
      const next = props.value.includes(option.value)
        ? props.value.filter((item) => item !== option.value)
        : [...props.value, option.value]
      props.onChange(next)
      return
    }
    props.onChange(option.value)
    close()
  }

  const setQuery = (value: string) => {
    if (onSearchChange) onSearchChange(value)
    else setLocalQuery(value)
  }

  return (
    <div ref={rootRef} className={clsx(s.root, open && s.open, disabled && s.disabled)}>
      <button
        id={controlId}
        type="button"
        className={clsx(s.trigger, invalid && s.invalid)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label}
        disabled={disabled}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === 'Escape') close()
          if (event.key === 'ArrowDown' && !open) {
            event.preventDefault()
            toggle()
          }
        }}
      >
        <span className={clsx(s.summary, values.length === 0 && s.placeholder)}>{summary}</span>
        <span className={s.caret} aria-hidden="true" />
      </button>
      {open ? (
        <div className={s.panel}>
          {searchable ? (
            <input
              className={s.search}
              value={query}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder || label}
              onChange={(event) => setQuery(event.target.value)}
            />
          ) : null}
          <ul id={listId} className={s.list} role="listbox" aria-multiselectable={props.multiple || undefined} aria-label={label}>
            {visible.length === 0 ? <li className={s.empty}>{loading ? loadingLabel : emptyLabel}</li> : null}
            {visible.map((option) => {
              const selected = values.includes(option.value)
              return (
                <li key={option.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    className={clsx(s.option, selected && s.selected)}
                    aria-selected={selected}
                    disabled={option.disabled}
                    onClick={() => choose(option)}
                  >
                    {props.multiple ? <span className={s.mark} aria-hidden="true" /> : null}
                    <span>{option.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
          {hasMore && onLoadMore ? (
            <button type="button" className={s.more} onClick={onLoadMore} disabled={loading}>
              {loadMoreLabel}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
