import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'
import { IconArrive, IconChevronRight, IconDepart } from '@/components/icons'
import { Button } from '@/components/ui/Button/Button'
import { EmptyState } from '@/components/ui/EmptyState/EmptyState'
import { KpiCard } from '@/components/ui/KpiCard/KpiCard'
import { Spinner } from '@/components/ui/Spinner/Spinner'
import { useDeskReservations } from '@/lib/api/reservations'
import { useDashboardFinance } from '@/lib/api/reports'
import { useRooms } from '@/lib/api/rooms'
import { TODAY } from '@/lib/date/today'
import { deskRows, isArrivalOn, isDepartureOn, isInHouseOn } from '@/lib/desk'
import { useMoney } from '@/lib/format/useMoney'
import type { Reservation } from '@/types/domain'
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

function byGuest(a: Reservation, b: Reservation): number {
  return (a.expectedArrival ?? '99:99').localeCompare(b.expectedArrival ?? '99:99') || a.guestName.localeCompare(b.guestName, 'sq')
}

export function PermbledhjePage() {
  const { t } = useTranslation()
  const rooms = useRooms()
  const arrivalsQuery = useDeskReservations({ arrivingOn: TODAY })
  const departuresQuery = useDeskReservations({ departingOn: TODAY })
  const inHouseQuery = useDeskReservations({ inHouseOn: TODAY })
  const desk = [arrivalsQuery, departuresQuery, inHouseQuery]
  const waiting = (rooms.isLoading && !rooms.data) || desk.some((query) => query.isLoading && !query.data)
  const failed = rooms.isError || desk.some((query) => query.isError)

  if (waiting) return <Spinner />
  if (failed) {
    return (
      <div className={s.error}>
        <EmptyState title={t('common.loadError')} />
        <Button
          onClick={() => {
            void rooms.refetch()
            for (const query of desk) void query.refetch()
          }}
        >
          {t('actions.retry')}
        </Button>
      </div>
    )
  }

  const roomCount = rooms.data?.length ?? 0
  const occupied = new Set(deskRows(inHouseQuery.data, (item) => isInHouseOn(item, TODAY)).map((item) => item.roomId)).size
  const arrivals = deskRows(arrivalsQuery.data, (item) => isArrivalOn(item, TODAY)).sort(byGuest)
  const departures = deskRows(departuresQuery.data, (item) => isDepartureOn(item, TODAY)).sort(byGuest)
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
        <section className={`${s.panel} ${s.arrival}`}>
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
        <section className={`${s.panel} ${s.departure}`}>
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
