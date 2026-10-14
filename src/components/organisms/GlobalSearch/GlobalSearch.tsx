import { Fragment, useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { useClickOutside } from '@/lib/hooks/useClickOutside'
import { Avatar } from '@/components/atoms/Avatar/Avatar'
import { IconArrowRight, IconSearch } from '@/components/atoms/Icon/icons'
import { StatusBadge } from '@/components/molecules/StatusBadge/StatusBadge'
import { GROUP_ORDER, useSearchResults, type SearchResult } from './useSearchResults'
import s from './GlobalSearch.module.scss'

interface Props {
  /** Fokusohet sapo shfaqet (kërkimi i hapur nga ikona në celular). */
  autoFocus?: boolean
  /** Thirret pasi zgjidhet një rezultat ose shtypet Escape. */
  onDismiss?: () => void
}

/** Kërkimi i kokës: faqe, veprime, rezervime, klientë dhe dhoma, me një kuti të vetme. */
export function GlobalSearch({ autoFocus, onDismiss }: Props) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const close = useCallback(() => setOpen(false), [])
  useClickOutside(rootRef, close, open)

  const finish = useCallback(() => {
    setOpen(false)
    setQuery('')
    inputRef.current?.blur()
    onDismiss?.()
  }, [onDismiss])

  const results = useSearchResults(query, finish)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const shortcut = (event.key === 'k' || event.key === 'K') && (event.metaKey || event.ctrlKey)
      if (!shortcut && (event.key !== '/' || target?.closest('input, textarea, select, [contenteditable="true"]')))
        return
      event.preventDefault()
      inputRef.current?.focus()
      inputRef.current?.select()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const move = (step: number) => {
    setOpen(true)
    setActive((index) => (results.length ? (index + step + results.length) % results.length : 0))
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      move(event.key === 'ArrowDown' ? 1 : -1)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      results[active]?.run()
    } else if (event.key === 'Escape') {
      if (query) setQuery('')
      else finish()
      setActive(0)
    }
  }

  // Rezultatet vijnë të grupuara; rendi i listës për tastierën ndjek të njëjtin grupim.
  const grouped = GROUP_ORDER.map((group) => ({ group, items: results.filter((item) => item.group === group) })).filter(
    (entry) => entry.items.length > 0,
  )
  const ordered = grouped.flatMap((entry) => entry.items)
  const activeItem = ordered[active]
  const optionId = (item: SearchResult) => `${listId}-${item.id}`
  const searching = query.trim().length > 0

  useEffect(() => {
    if (!open || !activeItem) return
    document.getElementById(optionId(activeItem))?.scrollIntoView?.({ block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, open])

  return (
    <div ref={rootRef} className={s.root}>
      <IconSearch size={18} className={s.icon} />
      <input
        ref={inputRef}
        type="search"
        className={s.input}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && activeItem ? optionId(activeItem) : undefined}
        aria-autocomplete="list"
        aria-label={t('search.label')}
        placeholder={t('search.placeholder')}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      <kbd className={s.kbd} aria-hidden="true">
        /
      </kbd>
      {open ? (
        <div className={s.panel}>
          <ul id={listId} className={s.list} role="listbox" aria-label={t('search.results')}>
            {searching && ordered.length === 0 ? (
              <li className={s.empty} role="presentation">
                {t('search.empty', { query: query.trim() })}
              </li>
            ) : (
              grouped.map(({ group, items }) => (
                <Fragment key={group}>
                  <li className={s.heading} role="presentation">
                    {t(`search.groups.${group}`)}
                  </li>
                  {items.map((item) => {
                    const index = ordered.indexOf(item)
                    const Icon = item.icon
                    return (
                      <li
                        key={item.id}
                        id={optionId(item)}
                        role="option"
                        aria-selected={index === active}
                        className={clsx(s.option, index === active && s.active)}
                        onMouseEnter={() => setActive(index)}
                        onMouseDown={(event) => {
                          event.preventDefault()
                          item.run()
                        }}
                      >
                        {item.person ? (
                          <Avatar name={item.person} size="sm" />
                        ) : (
                          <span className={s.glyph} aria-hidden="true">
                            {Icon ? <Icon size={18} /> : null}
                          </span>
                        )}
                        <span className={s.main}>
                          <span className={s.name}>{item.title}</span>
                          {item.meta ? <span className={s.meta}>{item.meta}</span> : null}
                        </span>
                        {item.reservation ? (
                          <StatusBadge status={item.reservation.status} />
                        ) : (
                          <IconArrowRight size={16} className={s.go} />
                        )}
                      </li>
                    )
                  })}
                </Fragment>
              ))
            )}
          </ul>
          <p className={s.hint} aria-hidden="true">
            {t('search.hint')}
          </p>
        </div>
      ) : null}
    </div>
  )
}
