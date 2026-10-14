import { useDeferredValue, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { Reservation, ReservationSource, ReservationStatus, RoomTypeInfo } from '@/types/domain'
import { useHotelReservations } from '@/lib/api/reservations'
import { useRoomTypes } from '@/lib/api/rooms'
import { fmtDayMonth } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { balanceCents, matchReservation, payState, stayNights } from '@/lib/reservation'
import { useUiStore } from '@/store/uiStore'
import { Avatar } from '@/components/atoms/Avatar/Avatar'
import { Button } from '@/components/atoms/Button/Button'
import { IconAlert, IconChevronRight, IconSearch } from '@/components/atoms/Icon/icons'
import { Money } from '@/components/atoms/Money/Money'
import { Select } from '@/components/atoms/Select/Select'
import { Skeleton } from '@/components/atoms/Skeleton/Skeleton'
import { EmptyState } from '@/components/molecules/EmptyState/EmptyState'
import { PaymentBadge } from '@/components/molecules/PaymentBadge/PaymentBadge'
import { SearchInput } from '@/components/molecules/SearchInput/SearchInput'
import { SourceBadge } from '@/components/molecules/SourceBadge/SourceBadge'
import { StatusBadge } from '@/components/molecules/StatusBadge/StatusBadge'
import { Tabs, tabPanelProps } from '@/components/molecules/Tabs/Tabs'
import s from './RezervimetPage.module.scss'

const FILTERS = ['today', 'upcoming', 'inHouse', 'unassigned', 'past', 'all'] as const
type Filter = (typeof FILTERS)[number]
const SOURCES: ReservationSource[] = ['BOOKING', 'TELEFON', 'RECEPSION']
const STATUSES: ReservationStatus[] = ['RESERVED', 'IN_HOUSE', 'COMPLETED', 'CANCELLED', 'NO_SHOW']
const PAGE = 40

const inFilter: Record<Filter, (item: Reservation) => boolean> = {
  today: (item) =>
    item.status !== 'CANCELLED' && (item.checkIn === TODAY || item.checkOut === TODAY || item.status === 'IN_HOUSE'),
  upcoming: (item) => item.status === 'RESERVED' && item.checkIn > TODAY,
  inHouse: (item) => item.status === 'IN_HOUSE',
  unassigned: (item) => item.status === 'RESERVED' && !item.roomId,
  past: (item) => item.checkOut < TODAY || item.status === 'COMPLETED' || item.status === 'NO_SHOW',
  all: () => true,
}

function isFilter(value: string | null): value is Filter {
  return FILTERS.includes(value as Filter)
}

function RowCells({ item, types }: { item: Reservation; types: Map<number, RoomTypeInfo> }) {
  const { t } = useTranslation()
  const due = balanceCents(item)
  return (
    <>
      <td className={s.guestCell}>
        <Avatar name={item.guestName} size="sm" />
        <span className={s.guestText}>
          <span className={s.name}>{item.guestName}</span>
          <span className={s.sub}>{item.code}</span>
        </span>
      </td>
      <td>
        <span className={s.dates}>
          {fmtDayMonth(item.checkIn)} → {fmtDayMonth(item.checkOut)}
        </span>
        <span className={s.sub}>{t('common.night', { count: stayNights(item) })}</span>
      </td>
      <td>
        {item.roomId ? (
          <span className={s.room}>{item.roomId}</span>
        ) : (
          <span className={s.unassigned}>
            <IconAlert size={15} />
            {t('room.unassignedShort')}
          </span>
        )}
        <span className={s.sub}>{types.get(item.roomTypeId)?.name ?? ''}</span>
      </td>
      <td>
        <SourceBadge source={item.source} />
      </td>
      <td>
        <StatusBadge status={item.status} />
      </td>
      <td>
        {item.status === 'CANCELLED' ? (
          <span className={s.sub}>—</span>
        ) : (
          <span className={s.payment}>
            <PaymentBadge state={payState(item)} />
            {due > 0 ? <Money cents={due} currency={item.currency} tone="danger" /> : null}
          </span>
        )}
      </td>
    </>
  )
}

export function RezervimetPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const reservations = useHotelReservations()
  const roomTypes = useRoomTypes()
  const openDrawer = useUiStore((state) => state.openDrawer)
  const [limit, setLimit] = useState(PAGE)

  const rawFilter = params.get('filter')
  const filter: Filter = isFilter(rawFilter) ? rawFilter : 'today'
  const query = params.get('q') ?? ''
  const source = params.get('burimi') ?? ''
  const status = params.get('statusi') ?? ''
  const deferredQuery = useDeferredValue(query)

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
    setLimit(PAGE)
  }

  const types = useMemo(() => new Map((roomTypes.data ?? []).map((type) => [type.id, type])), [roomTypes.data])

  const matched = useMemo(
    () =>
      (reservations.data ?? []).filter(
        (item) =>
          matchReservation(item, deferredQuery) &&
          (!source || item.source === source) &&
          (!status || item.status === status),
      ),
    [deferredQuery, reservations.data, source, status],
  )

  const counts = useMemo(() => {
    const result = {} as Record<Filter, number>
    for (const key of FILTERS) result[key] = matched.filter(inFilter[key]).length
    return result
  }, [matched])

  const rows = useMemo(() => {
    const list = matched.filter(inFilter[filter])
    return filter === 'past' || filter === 'all'
      ? list.toSorted((a, b) => b.checkIn.localeCompare(a.checkIn))
      : list.toSorted((a, b) => a.checkIn.localeCompare(b.checkIn) || a.guestName.localeCompare(b.guestName, 'sq'))
  }, [filter, matched])

  const visible = rows.slice(0, limit)
  const filtersActive = Boolean(query || source || status)

  return (
    <div className={s.page}>
      <div className={s.toolbar}>
        <SearchInput
          className={s.search}
          label={t('rezervimet.search')}
          value={query}
          onValueChange={(value) => setParam('q', value)}
        />
        <Select aria-label={t('rezervimet.source')} className={s.filter} value={source} onChange={(event) => setParam('burimi', event.target.value)}>
          <option value="">{t('rezervimet.anySource')}</option>
          {SOURCES.map((item) => (
            <option key={item} value={item}>
              {t(`source.${item}`)}
            </option>
          ))}
        </Select>
        <Select aria-label={t('rezervimet.status')} className={s.filter} value={status} onChange={(event) => setParam('statusi', event.target.value)}>
          <option value="">{t('rezervimet.anyStatus')}</option>
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {t(`status.${item}`)}
            </option>
          ))}
        </Select>
      </div>

      <Tabs<Filter>
        idPrefix="rezervimet"
        label={t('rezervimet.tabs')}
        value={filter}
        onChange={(value) => setParam('filter', value === 'today' ? '' : value)}
        items={FILTERS.map((key) => ({ value: key, label: t(`rezervimet.filters.${key}`), count: counts[key] }))}
      />

      <section {...tabPanelProps('rezervimet', filter)} className={s.panel}>
        {reservations.isLoading && !reservations.data ? (
          <div className={s.skeletons}>
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} height={52} />
            ))}
          </div>
        ) : reservations.isError ? (
          <EmptyState
            title={t('common.loadError')}
            description={t('common.loadErrorHint')}
            action={<Button onClick={() => void reservations.refetch()}>{t('common.retry')}</Button>}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<IconSearch />}
            title={t('rezervimet.empty')}
            description={t('rezervimet.emptyHint')}
            action={
              filtersActive ? (
                <Button variant="secondary" onClick={() => setParams(filter === 'today' ? {} : { filter }, { replace: true })}>
                  {t('rezervimet.clearFilters')}
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <p className={s.summary}>{t('rezervimet.count', { count: rows.length })}</p>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">{t('rezervimet.columns.guest')}</th>
                  <th scope="col">{t('rezervimet.columns.dates')}</th>
                  <th scope="col">{t('rezervimet.columns.room')}</th>
                  <th scope="col">{t('rezervimet.columns.source')}</th>
                  <th scope="col">{t('rezervimet.columns.status')}</th>
                  <th scope="col">{t('rezervimet.columns.payment')}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr key={item.id} tabIndex={0} onClick={() => openDrawer(item.id)} onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      openDrawer(item.id)
                    }
                  }}>
                    <RowCells item={item} types={types} />
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className={s.cards}>
              {visible.map((item) => {
                const due = balanceCents(item)
                return (
                  <li key={item.id}>
                    <button type="button" className={s.card} onClick={() => openDrawer(item.id)}>
                      <span className={s.cardTop}>
                        <Avatar name={item.guestName} size="sm" />
                        <span className={s.guestText}>
                          <span className={s.name}>{item.guestName}</span>
                          <span className={s.sub}>
                            {fmtDayMonth(item.checkIn)} → {fmtDayMonth(item.checkOut)} ·{' '}
                            {item.roomId ? t('common.roomNumber', { room: item.roomId }) : t('room.unassignedShort')}
                          </span>
                        </span>
                        <IconChevronRight size={18} className={s.chevron} />
                      </span>
                      <span className={s.cardBadges}>
                        <StatusBadge status={item.status} />
                        <SourceBadge source={item.source} />
                        {item.status === 'CANCELLED' ? null : <PaymentBadge state={payState(item)} />}
                        {due > 0 && item.status !== 'CANCELLED' ? <Money cents={due} currency={item.currency} tone="danger" strong /> : null}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            {rows.length > limit ? (
              <Button variant="secondary" block onClick={() => setLimit((value) => value + PAGE)}>
                {t('rezervimet.showMore', { count: Math.min(PAGE, rows.length - limit) })}
              </Button>
            ) : null}
          </>
        )}
      </section>
    </div>
  )
}
