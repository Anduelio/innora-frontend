import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import type { Reservation } from '@/types/domain'
import { useHotelReservations } from '@/lib/api/reservations'
import { fmtDayMonth } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { useClickOutside } from '@/lib/hooks/useClickOutside'
import { isActiveStay, matchReservation } from '@/lib/reservation'
import { useUiStore } from '@/store/uiStore'
import { Avatar } from '@/components/atoms/Avatar/Avatar'
import { IconSearch } from '@/components/atoms/Icon/icons'
import { StatusBadge } from '@/components/molecules/StatusBadge/StatusBadge'
import s from './GuestSearch.module.scss'

function rank(item: Reservation): number {
  if (item.status === 'IN_HOUSE') return 0
  if (isActiveStay(item) && item.checkIn >= TODAY) return 1
  return 2
}

export function GuestSearch() {
  const { t } = useTranslation()
  const reservations = useHotelReservations()
  const openDrawer = useUiStore((state) => state.openDrawer)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()
  const close = useCallback(() => setOpen(false), [])
  useClickOutside(rootRef, close, open)

  const results = useMemo(
    () =>
      (reservations.data ?? [])
        .filter((item) => query.trim() !== '' && matchReservation(item, query))
        .sort((a, b) => rank(a) - rank(b) || a.checkIn.localeCompare(b.checkIn))
        .slice(0, 8),
    [query, reservations.data],
  )

  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (event.key !== '/' || target?.closest('input, textarea, select, [contenteditable="true"]')) return
      event.preventDefault()
      inputRef.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const choose = (item: Reservation | undefined) => {
    if (!item) return
    openDrawer(item.id)
    setOpen(false)
    setQuery('')
    inputRef.current?.blur()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setOpen(true)
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((index) => (results.length ? (index + step + results.length) % results.length : 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      choose(results[active])
    } else if (event.key === 'Escape') {
      setOpen(false)
      setQuery('')
    }
  }

  const showList = open && query.trim().length > 0

  return (
    <div ref={rootRef} className={s.root}>
      <IconSearch size={18} className={s.icon} />
      <input
        ref={inputRef}
        type="search"
        className={s.input}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-activedescendant={showList && results[active] ? `${listId}-${results[active]?.id}` : undefined}
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
      {showList ? (
        <ul id={listId} className={s.list} role="listbox" aria-label={t('search.results')}>
          {results.length === 0 ? (
            <li className={s.empty} role="presentation">
              {t('search.empty')}
            </li>
          ) : (
            results.map((item, index) => (
              <li
                key={item.id}
                id={`${listId}-${item.id}`}
                role="option"
                aria-selected={index === active}
                className={clsx(s.option, index === active && s.active)}
                onMouseEnter={() => setActive(index)}
                onMouseDown={(event) => {
                  event.preventDefault()
                  choose(item)
                }}
              >
                <Avatar name={item.guestName} size="sm" />
                <span className={s.main}>
                  <span className={s.name}>{item.guestName}</span>
                  <span className={s.meta}>
                    {fmtDayMonth(item.checkIn)} → {fmtDayMonth(item.checkOut)} ·{' '}
                    {item.roomId ? t('common.roomNumber', { room: item.roomId }) : t('room.unassigned')} · {item.code}
                  </span>
                </span>
                <StatusBadge status={item.status} />
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
