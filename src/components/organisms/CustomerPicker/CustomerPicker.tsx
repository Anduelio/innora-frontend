import { useDeferredValue, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Customer } from '@/types/domain'
import { matchCustomer } from '@/lib/customers'
import { fmtDate } from '@/lib/date/calendar'
import { Avatar } from '@/components/atoms/Avatar/Avatar'
import { Badge } from '@/components/atoms/Badge/Badge'
import { Skeleton } from '@/components/atoms/Skeleton/Skeleton'
import { IconStar } from '@/components/atoms/Icon/icons'
import { SearchInput } from '@/components/molecules/SearchInput/SearchInput'
import s from './CustomerPicker.module.scss'

const SHOWN = 6

export function CustomerOption({ customer, onSelect }: { customer: Customer; onSelect: (customer: Customer) => void }) {
  const { t } = useTranslation()
  return (
    <li>
      <button type="button" className={s.option} onClick={() => onSelect(customer)}>
        <Avatar name={customer.name} size="sm" />
        <span className={s.text}>
          <span className={s.name}>
            {customer.name}
            {customer.bookings >= 2 ? (
              <Badge tone="info" icon={<IconStar size={12} />}>
                {t('klientet.badges.returning')}
              </Badge>
            ) : null}
          </span>
          <span className={s.sub}>{customer.phone || customer.email || '—'}</span>
        </span>
        <span className={s.meta}>
          {customer.reservations.length === 0 ? (
            <span>{t('klientet.noBookingYet')}</span>
          ) : (
            <>
              <span>{t('klientet.picker.stays', { count: customer.bookings })}</span>
              <span>{t('klientet.picker.last', { date: fmtDate(customer.lastStay) })}</span>
            </>
          )}
        </span>
      </button>
    </li>
  )
}

/** Kërkim i klientëve ekzistues brenda formës së rezervimit. */
export function CustomerPicker({
  customers,
  loading,
  onSelect,
  inputId,
}: {
  customers: Customer[]
  loading: boolean
  onSelect: (customer: Customer) => void
  inputId?: string
}) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const deferred = useDeferredValue(query)
  const searching = deferred.trim().length > 0

  const results = useMemo(
    () => (searching ? customers.filter((item) => matchCustomer(item, deferred)) : customers).slice(0, SHOWN),
    [customers, deferred, searching],
  )

  return (
    <div className={s.picker}>
      <SearchInput id={inputId} data-autofocus label={t('klientet.picker.search')} value={query} onValueChange={setQuery} />
      {loading && customers.length === 0 ? (
        <div className={s.skeletons} role="status" aria-label={t('klientet.picker.loading')}>
          <Skeleton height={52} />
          <Skeleton height={52} />
        </div>
      ) : customers.length === 0 ? (
        <p className={s.hint}>{t('klientet.picker.none')}</p>
      ) : (
        <>
          <p className={s.hint}>{searching ? t('klientet.picker.results') : t('klientet.picker.recent')}</p>
          {results.length === 0 ? (
            <p className={s.empty}>{t('klientet.picker.noResults')}</p>
          ) : (
            <ul className={s.list}>
              {results.map((customer) => (
                <CustomerOption key={customer.id} customer={customer} onSelect={onSelect} />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
