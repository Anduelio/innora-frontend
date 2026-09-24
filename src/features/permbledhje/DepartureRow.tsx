import { useTranslation } from 'react-i18next'
import type { Reservation } from '@/types/domain'
import { useMoney } from '@/lib/format/useMoney'
import { errorText } from '@/lib/api/client'
import { useCheckOut } from '@/lib/api/reservations'
import { useUiStore } from '@/store/uiStore'
import { Badge } from '@/components/ui/Badge/Badge'
import s from './DepartureRow.module.scss'

export function DepartureRow({ reservation }: { reservation: Reservation }) {
  const { t } = useTranslation()
  const money = useMoney()
  const checkOut = useCheckOut()
  const showToast = useUiStore((state) => state.showToast)
  const due = reservation.balanceCents ?? reservation.totalCents - reservation.paidCents
  const pending = reservation.status === 'IN_HOUSE'

  return (
    <li className={s.row}>
      <div className={s.body}>
        <div className={s.name}>{reservation.guestName}</div>
        <div className={s.meta}>
          <span>
            {t('common.room')} {reservation.roomId}
          </span>
          <span aria-hidden="true">·</span>
          <span>{t('overview.untilEleven')}</span>
          <Badge tone={due > 0 ? 'warn' : 'ok'}>
            {due > 0 ? `${money(due, reservation.currency)} ${t('common.toPay')}` : t('common.paidFull')}
          </Badge>
        </div>
      </div>
      {pending ? (
        <button
          type="button"
          className={s.action}
          onClick={() =>
            checkOut.mutate(reservation.id, {
              onSuccess: (updated) => showToast([t('toast.checkedOut', { name: updated.guestName })]),
              onError: (error) => showToast([errorText(error, t('toast.failed'))]),
            })
          }
        >
          {t('actions.checkOut')}
        </button>
      ) : reservation.status === 'COMPLETED' ? (
        <span className={s.done}>{t('actions.checkedOut')}</span>
      ) : null}
    </li>
  )
}
