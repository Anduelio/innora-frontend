import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { IconArrive, IconChevronRight, IconDepart } from '@/components/icons'
import { EmptyState } from '@/components/ui/EmptyState/EmptyState'
import { KpiCard } from '@/components/ui/KpiCard/KpiCard'
import { Spinner } from '@/components/ui/Spinner/Spinner'
import { useHotelReservations } from '@/lib/api/reservations'
import { useDashboardFinance } from '@/lib/api/reports'
import { useRooms } from '@/lib/api/rooms'
import { TODAY } from '@/lib/date/today'
import { useMoney } from '@/lib/format/useMoney'
import { coversDay } from '@/lib/stay'
import { ArrivalRow } from '@/features/permbledhje/ArrivalRow'
import { DepartureRow } from '@/features/permbledhje/DepartureRow'
import s from './PermbledhjePage.module.scss'

function OutstandingKpi() {
  const { t } = useTranslation()
  const money = useMoney()
  const due = useDashboardFinance()
  return (
    <KpiCard
      label={t('overview.outstanding')}
      value={money(due.data?.outstandingCents ?? 0)}
      note={t('overview.outstandingCount', { count: due.data?.outstandingCount ?? 0 })}
      dot="warn"
    />
  )
}

export function PermbledhjePage() {
  const { t } = useTranslation()
  const rooms = useRooms()
  const reservations = useHotelReservations()

  if ((rooms.isLoading && !rooms.data) || (reservations.isLoading && !reservations.data)) return <Spinner />
  if (rooms.isError || reservations.isError) return <EmptyState title={t('common.loadError')} />

  const list = reservations.data ?? []
  const roomCount = rooms.data?.length ?? 0
  const occupied = new Set(list.filter((item) => coversDay(item, TODAY)).map((item) => item.roomId)).size
  const arrivals = list
    .filter((item) => item.checkIn === TODAY && (item.status === 'RESERVED' || item.status === 'IN_HOUSE'))
    .sort((a, b) => (a.expectedArrival ?? '').localeCompare(b.expectedArrival ?? ''))
  const departures = list.filter((item) => item.checkOut === TODAY && item.status !== 'CANCELLED')
  const pendingIn = arrivals.filter((item) => item.status === 'RESERVED').length
  const pendingOut = departures.filter((item) => item.status === 'IN_HOUSE').length

  return (
    <div className={s.page}>
      <div className={s.kpis}>
        <KpiCard label={t('overview.occupiedRooms')} value={occupied} note={t('overview.ofTotal', { count: roomCount })} dot="accent" />
        <KpiCard label={t('overview.freeRooms')} value={roomCount - occupied} note={t('overview.readyTonight')} dot="muted" />
        <KpiCard
          label={t('overview.arrivals')}
          value={arrivals.length}
          note={pendingIn === 0 ? t('overview.allArrived') : t('overview.notArrivedYet', { count: pendingIn })}
          dot="reserved"
        />
        <KpiCard
          label={t('overview.departures')}
          value={departures.length}
          note={pendingOut === 0 ? t('overview.allLeft') : t('overview.notLeftYet', { count: pendingOut })}
          dot="warn"
        />
        <OutstandingKpi />
      </div>
      <div className={s.columns}>
        <section className={s.panel}>
          <header className={s.head}>
            <IconArrive />
            <h2>{t('overview.arrivalsTitle')}</h2>
            <span>{t('overview.guests', { count: arrivals.length })}</span>
          </header>
          {arrivals.length === 0 ? (
            <EmptyState title={t('overview.noArrivals')} />
          ) : (
            <ul className={s.list}>
              {arrivals.map((reservation) => (
                <ArrivalRow key={reservation.id} reservation={reservation} />
              ))}
            </ul>
          )}
        </section>
        <section className={s.panel}>
          <header className={s.head}>
            <span className={s.depart}>
              <IconDepart />
            </span>
            <h2>{t('overview.departuresTitle')}</h2>
            <span>{t('overview.guests', { count: departures.length })}</span>
          </header>
          {departures.length === 0 ? (
            <EmptyState title={t('overview.noDepartures')} />
          ) : (
            <ul className={s.list}>
              {departures.map((reservation) => (
                <DepartureRow key={reservation.id} reservation={reservation} />
              ))}
            </ul>
          )}
        </section>
      </div>
      <Link className={s.calendar} to="/kalendari">
        <span>
          <span className={s.calendarTitle}>{t('overview.openCalendar')}</span>
          <span className={s.calendarSub}>{t('overview.openCalendarSub')}</span>
        </span>
        <IconChevronRight />
      </Link>
    </div>
  )
}
