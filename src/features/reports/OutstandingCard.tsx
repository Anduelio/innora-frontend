import { useTranslation } from 'react-i18next'
import { fmtDate } from '@/lib/date/calendar'
import { centsToDecimal, type OutstandingGroup, type ReportPeriod } from '@/lib/reports'
import { useUiStore } from '@/store/uiStore'
import { IconChevronRight, IconWallet } from '@/components/atoms/Icon/icons'
import { Money } from '@/components/atoms/Money/Money'
import { csvFileName, downloadCsv } from '@/features/reports/csv'
import { MetricCard } from '@/features/reports/MetricCard'
import s from './report.module.scss'

export function OutstandingCard({ groups, period }: { groups: OutstandingGroup[]; period: ReportPeriod }) {
  const { t } = useTranslation()
  const openDrawer = useUiStore((state) => state.openDrawer)

  const exportCsv = () =>
    downloadCsv(csvFileName('detyrime', period), [
      [
        t('raportet.outstanding.guest'),
        t('raportet.outstanding.code'),
        t('raportet.outstanding.room'),
        t('raportet.outstanding.csvCheckIn'),
        t('raportet.outstanding.csvCheckOut'),
        t('raportet.currencyCol'),
        t('pay.balance'),
      ],
      ...groups.flatMap((group) =>
        group.rows.map(({ reservation, balanceCents }) => [
          reservation.guestName,
          reservation.code,
          reservation.roomId || t('room.unassignedShort'),
          fmtDate(reservation.checkIn),
          fmtDate(reservation.checkOut),
          group.currency,
          centsToDecimal(balanceCents),
        ]),
      ),
    ])

  return (
    <MetricCard
      title={t('raportet.outstanding.title')}
      definition={t('raportet.outstanding.definition')}
      basis={t('raportet.basis.endDate', { date: fmtDate(period.end) })}
      icon={<IconWallet />}
      onExport={groups.length ? exportCsv : undefined}
      wide
    >
      {groups.length === 0 ? (
        <p className={s.muted}>{t('raportet.outstanding.empty')}</p>
      ) : (
        groups.map((group) => (
          <div key={group.currency} className={s.group}>
            <p className={s.groupHead}>
              <span>{t('raportet.outstanding.total', { currency: group.currency })}</span>
              <Money cents={group.totalCents} currency={group.currency} tone="danger" strong />
            </p>
            <div className={s.listHead} aria-hidden="true">
              <span>{t('raportet.outstanding.guest')}</span>
              <span>{t('raportet.outstanding.code')}</span>
              <span>{t('raportet.outstanding.room')}</span>
              <span className={s.alignEnd}>{t('pay.balance')}</span>
            </div>
            <ul className={s.list}>
              {group.rows.map(({ reservation, balanceCents }) => {
                const room = reservation.roomId || t('room.unassignedShort')
                return (
                  <li key={reservation.id}>
                    <button
                      type="button"
                      className={s.rowButton}
                      aria-label={t('raportet.outstanding.open', { name: reservation.guestName })}
                      onClick={() => openDrawer(reservation.id)}
                    >
                      <span className={s.rowName}>{reservation.guestName}</span>
                      <span className={s.rowMeta}>
                        {reservation.code} · {room}
                      </span>
                      <span className={s.rowCode}>{reservation.code}</span>
                      <span className={s.rowRoom}>{room}</span>
                      <span className={s.rowBalance}>
                        <Money cents={balanceCents} currency={group.currency} tone="danger" strong />
                        <IconChevronRight size={16} />
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))
      )}
      <p className={s.note}>{t('raportet.outstanding.note')}</p>
    </MetricCard>
  )
}
