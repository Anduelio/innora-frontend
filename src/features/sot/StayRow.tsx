import { memo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Reservation, Room } from '@/types/domain'
import { TODAY } from '@/lib/date/today'
import { allowedActions, balanceCents, payState, stayNights } from '@/lib/reservation'
import { useUiStore } from '@/store/uiStore'
import { Avatar } from '@/components/atoms/Avatar/Avatar'
import { Badge } from '@/components/atoms/Badge/Badge'
import { Button } from '@/components/atoms/Button/Button'
import { IconAlert, IconCheck } from '@/components/atoms/Icon/icons'
import { Money } from '@/components/atoms/Money/Money'
import { PaymentBadge } from '@/components/molecules/PaymentBadge/PaymentBadge'
import { SourceBadge } from '@/components/molecules/SourceBadge/SourceBadge'
import { AssignRoom } from '@/features/rezervimi/AssignRoom'
import { useStayActions } from '@/features/rezervimi/useStayActions'
import s from './StayRow.module.scss'

export const StayRow = memo(function StayRow({
  reservation,
  kind,
  rooms,
  reservations,
  checkOutTime,
}: {
  reservation: Reservation
  kind: 'arrival' | 'departure'
  rooms: Room[]
  reservations: Reservation[]
  checkOutTime: string
}) {
  const { t } = useTranslation()
  const openDrawer = useUiStore((state) => state.openDrawer)
  const actions = useStayActions()
  const [assigning, setAssigning] = useState(false)
  const allowed = allowedActions(reservation, TODAY)
  const due = balanceCents(reservation)
  const unassigned = !reservation.roomId

  let action = null
  if (kind === 'arrival') {
    if (reservation.status === 'IN_HOUSE') {
      action = (
        <Badge tone="success" icon={<IconCheck />}>
          {t('sot.arrived')}
        </Badge>
      )
    } else if (unassigned) {
      action = (
        <Button variant="secondary" aria-expanded={assigning} onClick={() => setAssigning((value) => !value)}>
          {assigning ? t('sot.assignCancel') : t('sot.assign')}
        </Button>
      )
    } else if (allowed.includes('check_in')) {
      action = (
        <Button loading={actions.pending} onClick={() => actions.checkIn(reservation)}>
          {t('reservation.checkIn')}
        </Button>
      )
    }
  } else if (reservation.status === 'COMPLETED') {
    action = <Badge tone="neutral">{t('sot.left')}</Badge>
  } else if (allowed.includes('check_out')) {
    action = (
      <Button
        variant="secondary"
        loading={actions.pending}
        onClick={() => (due > 0 ? openDrawer(reservation.id) : actions.checkOut(reservation))}
      >
        {t('reservation.checkOut')}
      </Button>
    )
  }

  return (
    <li className={s.row}>
      <div className={s.main}>
        <Avatar name={reservation.guestName} />
        <div className={s.text}>
          <button type="button" className={s.name} onClick={() => openDrawer(reservation.id)}>
            {reservation.guestName}
          </button>
          <p className={s.meta}>
            {unassigned ? (
              <span className={s.unassigned}>
                <IconAlert size={15} />
                {t('room.unassignedShort')}
              </span>
            ) : (
              <span className={s.room}>{t('common.roomNumber', { room: reservation.roomId })}</span>
            )}
            <span>{t('common.night', { count: stayNights(reservation) })}</span>
            {kind === 'arrival' && reservation.expectedArrival ? (
              <span>{t('sot.arrivalTime', { time: reservation.expectedArrival })}</span>
            ) : null}
            {kind === 'departure' ? <span>{t('sot.departureTime', { time: checkOutTime })}</span> : null}
          </p>
          <p className={s.badges}>
            <SourceBadge source={reservation.source} />
            {kind === 'departure' && due > 0 ? (
              <Badge tone="danger">
                {t('pay.balance')} <Money cents={due} currency={reservation.currency} />
              </Badge>
            ) : (
              <PaymentBadge state={payState(reservation)} />
            )}
          </p>
        </div>
        <div className={s.action}>{action}</div>
      </div>
      {assigning ? (
        <div className={s.assign}>
          <AssignRoom
            compact
            reservation={reservation}
            rooms={rooms}
            reservations={reservations}
            onDone={() => setAssigning(false)}
          />
        </div>
      ) : null}
    </li>
  )
})
