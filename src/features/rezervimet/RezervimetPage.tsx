import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TODAY } from '@/lib/date/today'
import { useHotelReservations } from '@/lib/api/reservations'
import { EmptyState } from '@/components/ui/EmptyState/EmptyState'
import { FilterChip } from '@/components/ui/FilterChip/FilterChip'
import { SearchInput } from '@/components/ui/SearchInput/SearchInput'
import { Spinner } from '@/components/ui/Spinner/Spinner'
import { ReservationRow } from '@/features/rezervimet/ReservationRow'
import s from './RezervimetPage.module.scss'

const filters = ['all', 'today', 'pending', 'inHouse', 'completed', 'cancelled'] as const
type Filter = (typeof filters)[number]

export function RezervimetPage() {
  const { t } = useTranslation()
  const reservations = useHotelReservations()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const monthsShort = t('calendar.monthsShort', { returnObjects: true }) as string[]

  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('sq')
    return (reservations.data ?? [])
      .filter((reservation) => {
        if (q && !reservation.guestName.toLocaleLowerCase('sq').includes(q) && !reservation.roomId.includes(q)) {
          return false
        }
        if (filter === 'today') return reservation.checkIn === TODAY || reservation.checkOut === TODAY
        if (filter === 'pending') return reservation.status === 'RESERVED'
        if (filter === 'inHouse') return reservation.status === 'IN_HOUSE'
        if (filter === 'completed') return reservation.status === 'COMPLETED'
        if (filter === 'cancelled') return reservation.status === 'CANCELLED'
        return true
      })
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn) || a.guestName.localeCompare(b.guestName, 'sq'))
  }, [filter, query, reservations.data])

  if (reservations.isLoading && !reservations.data) return <Spinner />
  if (reservations.isError) return <EmptyState title={t('common.loadError')} />

  return (
    <div className={s.page}>
      <div className={s.tools}>
        <SearchInput label={t('common.search')} value={query} onChange={(event) => setQuery(event.target.value)} />
        <div className={s.filters}>
          {filters.map((item) => (
            <FilterChip
              key={item}
              label={t(`list.filters.${item}`)}
              selected={filter === item}
              onClick={() => setFilter(item)}
            />
          ))}
        </div>
      </div>
      <div className={s.table}>
        <div className={s.head}>
          <span>{t('list.guest')}</span>
          <span>{t('list.room')}</span>
          <span>{t('list.checkIn')}</span>
          <span>{t('list.checkOut')}</span>
          <span>{t('list.source')}</span>
          <span>{t('list.status')}</span>
        </div>
        {rows.length === 0 ? <EmptyState title={t('list.empty')} /> : null}
        {rows.map((reservation) => (
          <ReservationRow key={reservation.id} reservation={reservation} monthsShort={monthsShort} />
        ))}
      </div>
    </div>
  )
}
