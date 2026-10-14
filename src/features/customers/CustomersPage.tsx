import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { Customer } from '@/types/domain'
import { useCustomers } from '@/lib/api/customers'
import { filterCustomer, matchCustomer, sortCustomers, type CustomerFilter, type CustomerSort } from '@/lib/customers'
import { fmtDate } from '@/lib/date/calendar'
import { Avatar } from '@/components/atoms/Avatar/Avatar'
import { Badge } from '@/components/atoms/Badge/Badge'
import { Button } from '@/components/atoms/Button/Button'
import {
  IconAlert,
  IconChevronRight,
  IconDownload,
  IconPlus,
  IconSearch,
  IconStar,
  IconUsers,
  IconWallet,
} from '@/components/atoms/Icon/icons'
import { Money } from '@/components/atoms/Money/Money'
import { Select } from '@/components/atoms/Select/Select'
import { Skeleton } from '@/components/atoms/Skeleton/Skeleton'
import { EmptyState } from '@/components/molecules/EmptyState/EmptyState'
import { FilterChip } from '@/components/molecules/FilterChip/FilterChip'
import { SearchInput } from '@/components/molecules/SearchInput/SearchInput'
import { SourceBadge } from '@/components/molecules/SourceBadge/SourceBadge'
import { StatTile } from '@/components/molecules/StatTile/StatTile'
import { downloadCsv } from '@/features/reports/csv'
import { centsToDecimal } from '@/lib/reports'
import { CustomerFormSheet } from './CustomerFormSheet'
import { CustomerSheet } from './CustomerSheet'
import s from './CustomersPage.module.scss'

const FILTERS: CustomerFilter[] = ['all', 'inHouse', 'upcoming', 'returning', 'direct', 'booking', 'owing', 'noBooking']
const SORTS: CustomerSort[] = ['recent', 'name', 'bookings']
const PAGE = 40

function isFilter(value: string | null): value is CustomerFilter {
  return FILTERS.includes(value as CustomerFilter)
}

function isSort(value: string | null): value is CustomerSort {
  return SORTS.includes(value as CustomerSort)
}

function Amounts({ amounts, tone }: { amounts: Customer['value']; tone?: 'danger' }) {
  if (amounts.length === 0) return <span className={s.sub}>—</span>
  return (
    <span className={s.amounts}>
      {amounts.map((amount) => (
        <Money key={amount.currency} cents={amount.cents} currency={amount.currency} tone={tone} />
      ))}
    </span>
  )
}

function CustomerBadges({ customer }: { customer: Customer }) {
  const { t } = useTranslation()
  return (
    <>
      {customer.inHouse ? <Badge tone="success">{t('klientet.badges.inHouse')}</Badge> : null}
      {customer.bookings >= 2 ? (
        <Badge tone="info" icon={<IconStar size={14} />}>
          {t('klientet.badges.returning')}
        </Badge>
      ) : null}
      {customer.reservations.length === 0 ? <Badge>{t('klientet.badges.manual')}</Badge> : null}
      {customer.balance.length > 0 ? (
        <Badge tone="danger" icon={<IconAlert size={14} />}>
          {t('klientet.badges.owing')}
        </Badge>
      ) : null}
    </>
  )
}

export function CustomersPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const customers = useCustomers()
  const [limit, setLimit] = useState(PAGE)
  const [form, setForm] = useState<{ customer: Customer | null } | null>(null)

  // Shkurtorja nga kërkimi i kokës: `?i-ri=1` hap formën e klientit të ri.
  const wantsNew = params.get('i-ri')
  useEffect(() => {
    if (!wantsNew) return
    setForm({ customer: null })
    const next = new URLSearchParams(params)
    next.delete('i-ri')
    setParams(next, { replace: true })
  }, [wantsNew, params, setParams])

  const rawFilter = params.get('filter')
  const filter: CustomerFilter = isFilter(rawFilter) ? rawFilter : 'all'
  const rawSort = params.get('rendit')
  const sort: CustomerSort = isSort(rawSort) ? rawSort : 'recent'
  const query = params.get('q') ?? ''
  const selectedId = params.get('klienti')
  const deferredQuery = useDeferredValue(query)

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
    setLimit(PAGE)
  }

  const all = useMemo(() => customers.data ?? [], [customers.data])
  const searched = useMemo(() => all.filter((item) => matchCustomer(item, deferredQuery)), [all, deferredQuery])
  const counts = useMemo(() => {
    const result = {} as Record<CustomerFilter, number>
    for (const key of FILTERS) result[key] = searched.filter((item) => filterCustomer(item, key)).length
    return result
  }, [searched])
  const rows = useMemo(
    () =>
      sortCustomers(
        searched.filter((item) => filterCustomer(item, filter)),
        sort,
      ),
    [searched, filter, sort],
  )
  const visible = rows.slice(0, limit)
  const selected = useMemo(() => all.find((item) => item.id === selectedId) ?? null, [all, selectedId])

  const open = (customer: Customer) => setParam('klienti', customer.id)
  const saved = (customer: Customer) => {
    setForm(null)
    setParams(new URLSearchParams({ klienti: customer.id }), { replace: true })
  }

  const exportCsv = () => {
    downloadCsv('klientet.csv', [
      [
        t('klientet.columns.customer'),
        t('klientet.csv.phone'),
        t('klientet.csv.email'),
        t('klientet.csv.bookings'),
        t('klientet.csv.nights'),
        t('klientet.csv.lastStay'),
        t('klientet.csv.value'),
        t('klientet.csv.balance'),
      ],
      ...rows.map((item) => [
        item.name,
        item.phone,
        item.email,
        item.bookings,
        item.nights,
        item.reservations.length === 0 ? '' : item.lastStay,
        item.value.map((amount) => `${centsToDecimal(amount.cents)} ${amount.currency}`).join(' + '),
        item.balance.map((amount) => `${centsToDecimal(amount.cents)} ${amount.currency}`).join(' + '),
      ]),
    ])
  }

  const returning = all.filter((item) => item.bookings >= 2).length
  const inHouse = all.filter((item) => item.inHouse).length
  const owing = all.filter((item) => item.balance.length > 0).length

  return (
    <div className={s.page}>
      <div className={s.tiles}>
        <StatTile
          label={t('klientet.tiles.total')}
          value={all.length}
          hint={t('klientet.tiles.totalHint')}
          icon={<IconUsers />}
          tone="info"
          onClick={() => setParam('filter', '')}
        />
        <StatTile
          label={t('klientet.tiles.returning')}
          value={returning}
          hint={t('klientet.tiles.returningHint')}
          icon={<IconStar />}
          tone="success"
          onClick={() => setParam('filter', 'returning')}
        />
        <StatTile
          label={t('klientet.tiles.inHouse')}
          value={inHouse}
          hint={t('klientet.tiles.inHouseHint')}
          icon={<IconUsers />}
          onClick={() => setParam('filter', 'inHouse')}
        />
        <StatTile
          label={t('klientet.tiles.owing')}
          value={owing}
          hint={t('klientet.tiles.owingHint')}
          icon={<IconWallet />}
          tone="warning"
          onClick={() => setParam('filter', 'owing')}
        />
      </div>

      <div className={s.toolbar}>
        <SearchInput
          className={s.search}
          label={t('klientet.search')}
          value={query}
          onValueChange={(value) => setParam('q', value)}
        />
        <Select
          aria-label={t('klientet.sort.label')}
          value={sort}
          onChange={(event) => setParam('rendit', event.target.value === 'recent' ? '' : event.target.value)}
        >
          {SORTS.map((item) => (
            <option key={item} value={item}>
              {t(`klientet.sort.${item}`)}
            </option>
          ))}
        </Select>
        <Button variant="secondary" icon={<IconDownload />} onClick={exportCsv} disabled={rows.length === 0}>
          {t('klientet.export')}
        </Button>
        <Button className={s.add} icon={<IconPlus />} onClick={() => setForm({ customer: null })}>
          {t('klientet.form.new')}
        </Button>
      </div>

      <div className={s.chips} role="group" aria-label={t('klientet.filters.label')}>
        {FILTERS.map((key) => (
          <FilterChip
            key={key}
            label={t(`klientet.filters.${key}`)}
            count={counts[key]}
            selected={filter === key}
            onClick={() => setParam('filter', key === 'all' ? '' : key)}
          />
        ))}
      </div>

      {customers.isLoading && !customers.data ? (
        <div className={s.skeletons}>
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} height={60} />
          ))}
        </div>
      ) : customers.isError ? (
        <EmptyState
          title={t('common.loadError')}
          description={t('common.loadErrorHint')}
          action={<Button onClick={() => void customers.refetch()}>{t('common.retry')}</Button>}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<IconSearch />}
          title={t('klientet.empty')}
          description={t('klientet.emptyHint')}
          action={
            query || filter !== 'all' ? (
              <Button variant="secondary" onClick={() => setParams({}, { replace: true })}>
                {t('klientet.clear')}
              </Button>
            ) : (
              <Button icon={<IconPlus />} onClick={() => setForm({ customer: null })}>
                {t('klientet.form.new')}
              </Button>
            )
          }
        />
      ) : (
        <>
          <p className={s.summary}>{t('klientet.count', { count: rows.length })}</p>
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">{t('klientet.columns.customer')}</th>
                <th scope="col">{t('klientet.columns.bookings')}</th>
                <th scope="col">{t('klientet.columns.lastStay')}</th>
                <th scope="col">{t('klientet.columns.source')}</th>
                <th scope="col">{t('klientet.columns.value')}</th>
                <th scope="col">{t('klientet.columns.balance')}</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((customer) => (
                <tr
                  key={customer.id}
                  tabIndex={0}
                  onClick={() => open(customer)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      open(customer)
                    }
                  }}
                >
                  <td>
                    <span className={s.identity}>
                      <Avatar name={customer.name} size="sm" />
                      <span className={s.text}>
                        <span className={s.name}>{customer.name}</span>
                        <span className={s.sub}>{customer.phone || customer.email || '—'}</span>
                      </span>
                      <span className={s.badges}>
                        <CustomerBadges customer={customer} />
                      </span>
                    </span>
                  </td>
                  <td>
                    <span className={s.strong}>
                      {customer.reservations.length === 0
                        ? t('klientet.noBookingYet')
                        : t('klientet.bookingsCount', { count: customer.bookings })}
                    </span>
                    <span className={s.sub}>
                      {customer.reservations.length === 0
                        ? t('klientet.addedOn', { date: fmtDate(customer.lastStay) })
                        : customer.bookings === 0 && customer.cancelled > 0
                          ? t('klientet.onlyCancelled', { count: customer.cancelled })
                          : t('common.night', { count: customer.nights })}
                    </span>
                  </td>
                  <td>
                    <span className={s.strong}>
                      {customer.reservations.length === 0 ? '—' : fmtDate(customer.lastStay)}
                    </span>
                    {customer.upcoming > 0 ? (
                      <span className={s.sub}>{t('klientet.upcoming', { count: customer.upcoming })}</span>
                    ) : null}
                  </td>
                  <td>
                    <span className={s.sources}>
                      {customer.sources.map((source) => (
                        <SourceBadge key={source} source={source} />
                      ))}
                    </span>
                  </td>
                  <td>
                    <Amounts amounts={customer.value} />
                  </td>
                  <td>
                    <Amounts amounts={customer.balance} tone="danger" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className={s.cards}>
            {visible.map((customer) => (
              <li key={customer.id}>
                <button type="button" className={s.card} onClick={() => open(customer)}>
                  <span className={s.cardTop}>
                    <Avatar name={customer.name} />
                    <span className={s.text}>
                      <span className={s.name}>{customer.name}</span>
                      <span className={s.sub}>{customer.phone || customer.email || '—'}</span>
                    </span>
                    <IconChevronRight size={18} className={s.chevron} />
                  </span>
                  <span className={s.cardMeta}>
                    <span>
                      {customer.reservations.length === 0
                        ? t('klientet.noBookingYet')
                        : t('klientet.bookingsCount', { count: customer.bookings })}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {customer.reservations.length === 0
                        ? t('klientet.addedOn', { date: fmtDate(customer.lastStay) })
                        : t('klientet.lastStayShort', { date: fmtDate(customer.lastStay) })}
                    </span>
                  </span>
                  <span className={s.badges}>
                    <CustomerBadges customer={customer} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {rows.length > limit ? (
            <Button variant="secondary" block onClick={() => setLimit((value) => value + PAGE)}>
              {t('klientet.showMore', { count: Math.min(PAGE, rows.length - limit) })}
            </Button>
          ) : null}
        </>
      )}

      <CustomerSheet
        customer={selected}
        onClose={() => setParam('klienti', '')}
        onEdit={(customer) => setForm({ customer })}
      />
      {form ? <CustomerFormSheet customer={form.customer} onClose={() => setForm(null)} onSaved={saved} /> : null}
    </div>
  )
}
