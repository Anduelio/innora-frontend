import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { Reservation } from '@/types/domain'
import { addDaysIso, fmtDate } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { useCurrentUser } from '@/lib/api/auth'
import { usePayments } from '@/lib/api/hotel'
import { useHotelReservations, useReservations } from '@/lib/api/reservations'
import { useHotelSettings, useRoomTypes, useRooms } from '@/lib/api/rooms'
import {
  DATA_COVERAGE_START,
  buildReport,
  formatPercent,
  hasFilters,
  startsBeforeCoverage,
  type CurrencyAmount,
  type Report,
} from '@/lib/reports'
import { Button } from '@/components/atoms/Button/Button'
import { IconArrive, IconBed, IconCalendar, IconChart, IconDepart, IconInfo, IconWallet } from '@/components/atoms/Icon/icons'
import { Money } from '@/components/atoms/Money/Money'
import { Skeleton } from '@/components/atoms/Skeleton/Skeleton'
import { Alert } from '@/components/molecules/Alert/Alert'
import { EmptyState } from '@/components/molecules/EmptyState/EmptyState'
import { StatTile } from '@/components/molecules/StatTile/StatTile'
import { ChannelCard } from '@/features/raportet/ChannelCard'
import { CollectedCard } from '@/features/raportet/CollectedCard'
import { EarnedCard } from '@/features/raportet/EarnedCard'
import { ForecastCard } from '@/features/raportet/ForecastCard'
import { MovementsCard } from '@/features/raportet/MovementsCard'
import { OccupancyCard } from '@/features/raportet/OccupancyCard'
import { OutstandingCard } from '@/features/raportet/OutstandingCard'
import { PayoutsCard } from '@/features/raportet/PayoutsCard'
import { ReportFilters } from '@/features/raportet/ReportFilters'
import { RoomNightsCard } from '@/features/raportet/RoomNightsCard'
import { useReportParams } from '@/features/raportet/useReportParams'
import s from './RaportetPage.module.scss'

function AmountStack({ amounts }: { amounts: readonly CurrencyAmount[] }) {
  const { t } = useTranslation()
  if (amounts.length === 0) return <>{t('raportet.empty')}</>
  return (
    <span className={s.stack}>
      {amounts.map((amount) => (
        <Money key={amount.currency} cents={amount.cents} currency={amount.currency} />
      ))}
    </span>
  )
}

function HeadlineTiles({ report, financial }: { report: Report; financial: boolean }) {
  const { t } = useTranslation()
  const { occupancy, earned } = report
  const collected = report.collected.map((group) => ({ currency: group.currency, cents: group.netCents }))
  return (
    <div className={s.tiles}>
      <StatTile
        label={t('raportet.occupancy.title')}
        value={formatPercent(occupancy.rate)}
        hint={t('raportet.occupancy.tileHint', {
          sold: occupancy.sold,
          available: occupancy.available,
          blocked: occupancy.blocked,
        })}
        icon={<IconBed />}
        tone="info"
      />
      <StatTile
        label={t('raportet.roomNights.title')}
        value={report.roomNights}
        hint={t('raportet.roomNights.hint', { days: report.nights })}
        icon={<IconCalendar />}
      />
      {financial ? (
        <>
          <StatTile
            label={t('raportet.earned.tile')}
            value={<AmountStack amounts={earned.totals} />}
            hint={t('raportet.earned.tileHint')}
            icon={<IconChart />}
            tone="success"
          />
          <StatTile
            label={t('raportet.collected.title')}
            value={<AmountStack amounts={collected} />}
            hint={t('raportet.collected.tileHint')}
            icon={<IconWallet />}
          />
        </>
      ) : (
        <>
          <StatTile label={t('raportet.movements.arrivals.title')} value={report.movements.arrivals.count} icon={<IconArrive />} tone="info" />
          <StatTile label={t('raportet.movements.departures.title')} value={report.movements.departures.count} icon={<IconDepart />} tone="warning" />
        </>
      )}
    </div>
  )
}

const SKELETON_CARDS = ['a', 'b', 'c', 'd'] as const
const SKELETON_TILES = ['a', 'b', 'c', 'd'] as const

function ReportSkeleton() {
  const { t } = useTranslation()
  return (
    <div className={s.content} aria-busy="true" aria-label={t('common.loading')}>
      <div className={s.tiles}>
        {SKELETON_TILES.map((key) => (
          <Skeleton key={key} height={116} />
        ))}
      </div>
      <div className={s.grid}>
        {SKELETON_CARDS.map((key) => (
          <Skeleton key={key} height={280} />
        ))}
      </div>
    </div>
  )
}

export function RaportetPage() {
  const { t } = useTranslation()
  const params = useReportParams(TODAY)
  const { can } = useCurrentUser()
  const financial = can('reports.financial')
  const { start, end, roomTypeId, source } = params

  const hotel = useHotelReservations()
  const ranged = useReservations(addDaysIso(start, -1), addDaysIso(end, 1))
  const rooms = useRooms()
  const roomTypes = useRoomTypes()
  const settings = useHotelSettings()
  const payments = usePayments(start, end)
  const primary = settings.data?.currency ?? 'EUR'

  const reservations = useMemo(() => {
    const merged = new Map<string, Reservation>()
    for (const item of hotel.data ?? []) merged.set(item.id, item)
    for (const item of ranged.data ?? []) merged.set(item.id, item)
    return [...merged.values()]
  }, [hotel.data, ranged.data])

  const reservationsById = useMemo(() => new Map(reservations.map((item) => [item.id, item])), [reservations])

  const typeNames = useMemo(
    () => new Map((roomTypes.data ?? []).map((type) => [type.id, type.name])),
    [roomTypes.data],
  )

  const report = useMemo(
    () =>
      buildReport({
        reservations,
        rooms: rooms.data ?? [],
        payments: payments.data ?? [],
        period: { start, end },
        filters: { roomTypeId, source },
        today: TODAY,
        primaryCurrency: primary,
      }),
    [reservations, rooms.data, payments.data, start, end, roomTypeId, source, primary],
  )

  const queries = [hotel, ranged, rooms, payments]
  const failed = queries.some((query) => query.isError && !query.data)
  const loading = queries.some((query) => query.isPending)
  const updating = ranged.isPlaceholderData || payments.isPlaceholderData
  const retry = () => {
    for (const query of queries) if (query.isError) void query.refetch()
  }

  const filtered = hasFilters({ roomTypeId, source })
  const filterLabels = [
    roomTypeId !== null ? typeNames.get(roomTypeId) : null,
    source !== null ? t(`source.${source}`) : null,
  ].filter(Boolean)

  return (
    <div className={s.page}>
      <ReportFilters params={params} roomTypes={roomTypes.data ?? []} />

      <div className={s.summary}>
        <p className={s.period}>
          <IconCalendar size={18} aria-hidden="true" />
          <span>
            {t('raportet.summary', { from: fmtDate(start), to: fmtDate(end) })} ·{' '}
            {t('raportet.summaryNights', { count: report.nights })}
            {filterLabels.length > 0 ? ` · ${filterLabels.join(' · ')}` : null}
          </span>
        </p>
        <span className={s.updating} aria-live="polite">
          {updating ? t('raportet.updating') : null}
        </span>
      </div>

      <p className={s.disclaimer}>
        <IconInfo size={18} aria-hidden="true" />
        <span>{t('raportet.disclaimer')}</span>
      </p>

      {startsBeforeCoverage({ start, end }) ? (
        <Alert tone="warning" title={t('raportet.coverage.title')}>
          {t('raportet.coverage.body', { date: fmtDate(DATA_COVERAGE_START) })}
        </Alert>
      ) : null}

      {failed ? (
        <EmptyState
          title={t('common.loadError')}
          description={t('common.loadErrorHint')}
          icon={<IconChart />}
          action={
            <Button variant="secondary" onClick={retry}>
              {t('common.retry')}
            </Button>
          }
        />
      ) : loading ? (
        <ReportSkeleton />
      ) : (
        <div className={s.content}>
          <HeadlineTiles report={report} financial={financial} />
          {financial ? null : <Alert tone="info" title={t('raportet.staffLimited')} />}
          <div className={s.grid}>
            <OccupancyCard occupancy={report.occupancy} period={report.period} today={TODAY} />
            <RoomNightsCard
              total={report.roomNights}
              byType={report.roomNightsByType}
              futureNights={report.futureRoomNights}
              typeNames={typeNames}
              period={report.period}
            />
            {financial ? (
              <>
                <EarnedCard earned={report.earned} period={report.period} />
                <ForecastCard forecast={report.forecast} period={report.period} />
                <CollectedCard
                  collected={report.collected}
                  payments={report.payments}
                  period={report.period}
                  filtered={filtered}
                  reservationsById={reservationsById}
                />
              </>
            ) : null}
            <MovementsCard movements={report.movements} period={report.period} />
            {financial ? (
              <>
                <ChannelCard channels={report.channels} currencies={report.currencies} period={report.period} />
                <PayoutsCard />
              </>
            ) : null}
            <OutstandingCard groups={report.outstanding} period={report.period} />
          </div>
        </div>
      )}
    </div>
  )
}
