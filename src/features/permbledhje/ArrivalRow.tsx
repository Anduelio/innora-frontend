import { useTranslation } from 'react-i18next'
import type { Reservation } from '@/types/domain'
import { errorText } from '@/lib/api/client'
import { useCheckIn } from '@/lib/api/reservations'
import { useUiStore } from '@/store/uiStore'
import { SourceBadge } from '@/components/ui/SourceBadge/SourceBadge'
import s from './ArrivalRow.module.scss'

export function ArrivalRow({ reservation }: { reservation: Reservation }) {
  const { t } = useTranslation()
  const checkIn = useCheckIn()
  const showToast = useUiStore((state) => state.showToast)
  const pending = reservation.status === 'RESERVED'

  return (
    <li className={s.row}>
      <div className={s.time}>{reservation.expectedArrival ?? '14:00'}</div>
      <div className={s.body}>
        <div className={s.name}>{reservation.guestName}</div>
        <div className={s.meta}>
          <span>
            {t('common.room')} {reservation.roomId}
          </span>
          <span aria-hidden="true">·</span>
          <span>{t('common.person', { count: reservation.persons })}</span>
          <SourceBadge source={reservation.source} />
        </div>
      </div>
      {pending ? (
        <button
          type="button"
          className={s.action}
          onClick={() =>
            checkIn.mutate(reservation.id, {
              onSuccess: (updated) => showToast([t('toast.checkedIn', { name: updated.guestName })]),
              onError: (error) => showToast([errorText(error, t('toast.failed'))]),
            })
          }
        >
          {t('actions.checkIn')}
        </button>
      ) : (
        <span className={s.done}>{t('actions.inHouse')}</span>
      )}
    </li>
  )
}
