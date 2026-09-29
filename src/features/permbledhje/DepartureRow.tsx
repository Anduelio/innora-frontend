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
  const openFolio = useUiStore((state) => state.openFolio)
  const openDrawer = useUiStore((state) => state.openDrawer)
  const due = reservation.balanceCents ?? reservation.totalCents - reservation.paidCents
  const pending = reservation.status === 'IN_HOUSE'
  const canCheckout = pending && due <= 0

  return (
    <li className={s.row}>
      <div className={s.body}>
        <div className={s.name}>{reservation.guestName}</div>
        <div className={s.meta}>
          <span>
            {t('common.room')} {reservation.roomId || t('room.unassigned')}
          </span>
          <span aria-hidden="true">·</span>
          <span>{t('overview.untilEleven')}</span>
          <Badge tone={due > 0 ? 'warn' : 'ok'}>
            {due > 0 ? `${money(due, reservation.currency)} ${t('common.toPay')}` : t('common.paidFull')}
          </Badge>
        </div>
      </div>
      {canCheckout ? (
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
      ) : pending && due > 0 && reservation.folioId ? (
        <button type="button" className={s.action} onClick={() => openFolio(reservation.folioId!)}>
          {t('folio.addPayment')}
        </button>
      ) : pending && due > 0 ? (
        <button type="button" className={s.action} onClick={() => openDrawer(reservation.id)}>
          {t('room.openStay')}
        </button>
      ) : reservation.status === 'COMPLETED' ? (
        <span className={s.done}>{t('actions.checkedOut')}</span>
      ) : null}
    </li>
  )
}
