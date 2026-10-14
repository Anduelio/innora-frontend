import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import type { Reservation } from '@/types/domain'
import { useHotelReservations } from '@/lib/api/reservations'
import { useHotelSettings, useRoomTypes, useRooms } from '@/lib/api/rooms'
import { useCurrentUser } from '@/lib/api/auth'
import { useSyncStatus } from '@/lib/api/hotel'
import { addDaysIso, fmtDate } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { occupiesNight, typeFreeOn } from '@/lib/inventory'
import { balanceCents } from '@/lib/reservation'
import { useUiStore } from '@/store/uiStore'
import { Button } from '@/components/atoms/Button/Button'
import { Money } from '@/components/atoms/Money/Money'
import { Skeleton } from '@/components/atoms/Skeleton/Skeleton'
import {
  IconAlert,
  IconArrive,
  IconArrowRight,
  IconBed,
  IconCalendar,
  IconDepart,
  IconPlus,
  IconUsers,
  IconWallet,
} from '@/components/atoms/Icon/icons'
import { Alert } from '@/components/molecules/Alert/Alert'
import { Card } from '@/components/molecules/Card/Card'
import { EmptyState } from '@/components/molecules/EmptyState/EmptyState'
import { StatTile } from '@/components/molecules/StatTile/StatTile'
import { AvailabilityGrid } from '@/features/calendar/AvailabilityGrid'
import { StayRow } from '@/features/today/StayRow'
import s from './TodayPage.module.scss'

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function byArrival(a: Reservation, b: Reservation) {
  return (
    (a.expectedArrival ?? '99').localeCompare(b.expectedArrival ?? '99') || a.guestName.localeCompare(b.guestName, 'sq')
  )
}

export function TodayPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const rooms = useRooms()
  const roomTypes = useRoomTypes()
  const reservations = useHotelReservations()
  const hotel = useHotelSettings()
  const sync = useSyncStatus()
  const { can } = useCurrentUser()
  const openDrawer = useUiStore((state) => state.openDrawer)
  const openCreate = useUiStore((state) => state.openCreate)

  const day = useMemo(() => {
    const list = reservations.data ?? []
    const roomList = rooms.data ?? []
    const types = roomTypes.data ?? []
    const arrivals = list
      .filter((item) => item.checkIn === TODAY && (item.status === 'RESERVED' || item.status === 'IN_HOUSE'))
      .toSorted(byArrival)
    const departures = list
      .filter((item) => item.checkOut === TODAY && (item.status === 'IN_HOUSE' || item.status === 'COMPLETED'))
      .toSorted((a, b) => Number(a.status === 'COMPLETED') - Number(b.status === 'COMPLETED'))
    const inHouse = list.filter((item) => item.status === 'IN_HOUSE' && occupiesNight(item, TODAY))
    const freeByType = types.map((type) => ({ type, free: Math.max(0, typeFreeOn(type.id, TODAY, roomList, list)) }))
    const unpaid = list
      .filter(
        (item) =>
          item.status !== 'CANCELLED' && item.status !== 'NO_SHOW' && balanceCents(item) > 0 && item.checkIn <= TODAY,
      )
      .toSorted((a, b) => a.checkOut.localeCompare(b.checkOut))
    const unassigned = list
      .filter((item) => item.status === 'RESERVED' && !item.roomId)
      .toSorted((a, b) => a.checkIn.localeCompare(b.checkIn))
    return {
      arrivals,
      departures,
      inHouse,
      pendingArrivals: arrivals.filter((item) => item.status === 'RESERVED').length,
      pendingDepartures: departures.filter((item) => item.status === 'IN_HOUSE').length,
      freeTonight: freeByType.reduce((sum, item) => sum + item.free, 0),
      lastRoomTypes: freeByType.filter((item) => item.free === 1).map((item) => item.type.name),
      unpaid,
      unassigned,
    }
  }, [reservations.data, roomTypes.data, rooms.data])

  const loading = (reservations.isLoading && !reservations.data) || (rooms.isLoading && !rooms.data)
  if (reservations.isError || rooms.isError) {
    return (
      <EmptyState
        title={t('common.loadError')}
        description={t('common.loadErrorHint')}
        action={<Button onClick={() => void reservations.refetch()}>{t('common.retry')}</Button>}
      />
    )
  }

  const roomList = rooms.data ?? []
  const list = reservations.data ?? []
  const checkOutTime = hotel.data?.checkOutTime ?? '11:00'
  const issues = sync.data?.openIssues.length ?? 0
  const syncProblem = sync.data?.level === 'problem'

  return (
    <div className={s.page}>
      {issues > 0 || syncProblem ? (
        <Alert
          tone="warning"
          title={t('sync.banner', { count: Math.max(issues, 1) })}
          action={
            can('channel.manage') ? (
              <Button variant="secondary" onClick={() => void navigate('/cilesimet?seksioni=booking')}>
                {t('sync.see')}
              </Button>
            ) : null
          }
        >
          {day.lastRoomTypes.length > 0 ? (
            <strong>{t('sync.lastRoomWarn', { type: day.lastRoomTypes.join(', ') })}</strong>
          ) : (
            t('sync.bannerDetail')
          )}
        </Alert>
      ) : null}

      <section className={s.stats} aria-label={t('nav.sot')}>
        <StatTile
          label={t('sot.arrivals')}
          value={loading ? <Skeleton height={30} width={40} /> : day.arrivals.length}
          hint={day.pendingArrivals ? t('sot.arrivalsHint', { count: day.pendingArrivals }) : t('sot.arrivalsDone')}
          icon={<IconArrive />}
          tone="info"
          onClick={() => scrollToId('mberritjet')}
        />
        <StatTile
          label={t('sot.departures')}
          value={loading ? <Skeleton height={30} width={40} /> : day.departures.length}
          hint={
            day.pendingDepartures ? t('sot.departuresHint', { count: day.pendingDepartures }) : t('sot.departuresDone')
          }
          icon={<IconDepart />}
          tone="warning"
          onClick={() => scrollToId('largimet')}
        />
        <StatTile
          label={t('sot.inHouse')}
          value={loading ? <Skeleton height={30} width={40} /> : day.inHouse.length}
          hint={t('sot.inHouseHint')}
          icon={<IconUsers />}
          tone="success"
          onClick={() => void navigate('/rezervimet?filter=inHouse')}
        />
        <StatTile
          label={t('sot.free')}
          value={loading ? <Skeleton height={30} width={40} /> : day.freeTonight}
          hint={t('sot.freeHint')}
          icon={<IconBed />}
          onClick={() => scrollToId('disponueshmeria')}
        />
      </section>

      <div className={s.columns}>
        <Card
          id="mberritjet"
          title={t('sot.arrivalsTitle')}
          icon={<IconArrive />}
          actions={<span className={s.count}>{day.arrivals.length}</span>}
          flush
        >
          {loading ? (
            <div className={s.skeletons}>
              <Skeleton height={56} />
              <Skeleton height={56} />
            </div>
          ) : day.arrivals.length === 0 ? (
            <EmptyState compact title={t('sot.noArrivals')} description={t('sot.noArrivalsHint')} />
          ) : (
            <ul className={s.list}>
              {day.arrivals.map((item) => (
                <StayRow
                  key={item.id}
                  kind="arrival"
                  reservation={item}
                  rooms={roomList}
                  reservations={list}
                  checkOutTime={checkOutTime}
                />
              ))}
            </ul>
          )}
        </Card>
        <Card
          id="largimet"
          title={t('sot.departuresTitle')}
          icon={<IconDepart />}
          actions={<span className={s.count}>{day.departures.length}</span>}
          flush
        >
          {loading ? (
            <div className={s.skeletons}>
              <Skeleton height={56} />
            </div>
          ) : day.departures.length === 0 ? (
            <EmptyState compact title={t('sot.noDepartures')} />
          ) : (
            <ul className={s.list}>
              {day.departures.map((item) => (
                <StayRow
                  key={item.id}
                  kind="departure"
                  reservation={item}
                  rooms={roomList}
                  reservations={list}
                  checkOutTime={checkOutTime}
                />
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className={s.columns}>
        <Card
          title={t('sot.unpaidTitle')}
          icon={<IconWallet />}
          actions={
            <Link className={s.more} to="/pagesat">
              {t('common.seeAll')} ({day.unpaid.length})
              <IconArrowRight size={16} />
            </Link>
          }
          flush
        >
          {day.unpaid.length === 0 ? (
            <EmptyState compact title={t('sot.unpaidEmpty')} />
          ) : (
            <ul className={s.compactList}>
              {day.unpaid.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <button type="button" className={s.compactRow} onClick={() => openDrawer(item.id)}>
                    <span className={s.compactName}>{item.guestName}</span>
                    <span className={s.compactMeta}>
                      {item.roomId ? t('common.roomNumber', { room: item.roomId }) : t('room.unassignedShort')}
                    </span>
                    <Money cents={balanceCents(item)} currency={item.currency} tone="danger" strong />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card
          title={t('sot.unassignedTitle')}
          description={day.unassigned.length ? t('sot.unassignedHint') : undefined}
          icon={<IconAlert />}
          actions={<span className={s.count}>{day.unassigned.length}</span>}
          flush
        >
          {day.unassigned.length === 0 ? (
            <EmptyState compact title={t('sot.unassignedEmpty')} />
          ) : (
            <ul className={s.compactList}>
              {day.unassigned.slice(0, 4).map((item) => (
                <li key={item.id}>
                  <button type="button" className={s.compactRow} onClick={() => openDrawer(item.id)}>
                    <span className={s.compactName}>{item.guestName}</span>
                    <span className={s.compactMeta}>
                      {item.checkIn === TODAY
                        ? t('common.today')
                        : item.checkIn === addDaysIso(TODAY, 1)
                          ? t('common.tomorrow')
                          : fmtDate(item.checkIn)}
                    </span>
                    <span className={s.assignLink}>{t('sot.assign')}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card
        id="disponueshmeria"
        title={t('sot.availabilityTitle')}
        description={t('sot.availabilityHint')}
        icon={<IconCalendar />}
        actions={
          <Link className={s.more} to="/kalendari">
            {t('sot.openCalendar')}
            <IconArrowRight size={16} />
          </Link>
        }
      >
        <AvailabilityGrid
          start={TODAY}
          nights={7}
          rooms={roomList}
          roomTypes={roomTypes.data ?? []}
          reservations={list}
        />
      </Card>

      <div className={s.mobileCta}>
        <Button
          size="lg"
          block
          icon={<IconPlus />}
          onClick={() => openCreate({ checkIn: TODAY, checkOut: addDaysIso(TODAY, 1) })}
        >
          {t('common.newReservation')}
        </Button>
      </div>
    </div>
  )
}
