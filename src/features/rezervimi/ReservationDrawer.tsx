import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Reservation, Room } from '@/types/domain'
import { dayIndex, fmtGjate } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { useMoney } from '@/lib/format/useMoney'
import { formatPhone } from '@/lib/phone'
import { errorText } from '@/lib/api/client'
import { useAssignReservation, useCancelReservation, useCheckIn, useCheckOut } from '@/lib/api/reservations'
import { useUiStore } from '@/store/uiStore'
import { IconArrive, IconDepart } from '@/components/icons'
import { Button } from '@/components/ui/Button/Button'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import { Field } from '@/components/ui/Field/Field'
import { Dropdown } from '@/components/ui/Dropdown/Dropdown'
import { SourceBadge } from '@/components/ui/SourceBadge/SourceBadge'
import { StatusBadge } from '@/components/ui/StatusBadge/StatusBadge'
import s from './ReservationDrawer.module.scss'

export function ReservationDrawer({
  rooms,
  reservations,
}: {
  rooms: Room[]
  reservations: Reservation[]
}) {
  const { t } = useTranslation()
  const money = useMoney()
  const drawerId = useUiStore((state) => state.drawerId)
  const closeDrawer = useUiStore((state) => state.closeDrawer)
  const openEdit = useUiStore((state) => state.openEdit)
  const openFolio = useUiStore((state) => state.openFolio)
  const showToast = useUiStore((state) => state.showToast)
  const checkIn = useCheckIn()
  const checkOut = useCheckOut()
  const cancel = useCancelReservation()
  const assign = useAssignReservation()
  const [confirmOut, setConfirmOut] = useState(false)
  const [assignRoom, setAssignRoom] = useState('')
  const reservation = reservations.find((item) => item.id === drawerId)

  useEffect(() => {
    setConfirmOut(false)
    setAssignRoom('')
  }, [drawerId])
  const room = rooms.find((item) => item.id === reservation?.roomId)
  const months = t('calendar.months', { returnObjects: true }) as string[]

  if (!reservation) {
    return <Drawer open={false} title="" onClose={closeDrawer} />
  }

  const due = reservation.balanceCents ?? reservation.totalCents - reservation.paidCents
  const charges = reservation.chargesCents ?? reservation.totalCents
  const paid = reservation.paidCents
  const canCheckIn = reservation.status === 'RESERVED' && reservation.checkIn <= TODAY
  const canCheckOut = reservation.status === 'IN_HOUSE'
  const canCancel = reservation.status === 'RESERVED' || reservation.status === 'IN_HOUSE'
  const clock = new Date().toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })

  return (
    <Drawer
      open
      title={reservation.guestName}
      onClose={closeDrawer}
      footer={
        <>
          {canCheckIn ? (
            <Button
              block
              onClick={() =>
                checkIn.mutate(reservation.id, {
                  onSuccess: (updated) => {
                    showToast([t('toast.checkedIn', { name: updated.guestName })])
                    closeDrawer()
                  },
                  onError: (error) => showToast([errorText(error, t('toast.failed'))]),
                })
              }
            >
              {t('actions.checkIn')}
            </Button>
          ) : null}
          {canCheckOut && !confirmOut ? (
            <Button block onClick={() => setConfirmOut(true)}>
              {t('actions.checkOut')}
            </Button>
          ) : null}
          {confirmOut ? (
            <div className={s.checkoutBox}>
              <p className={s.checkoutTitle}>{t('checkout.title')}</p>
              <dl className={s.facts}>
                <div>
                  <dt>{t('folio.total')}</dt>
                  <dd>{money(charges, reservation.currency)}</dd>
                </div>
                <div>
                  <dt>{t('folio.paid')}</dt>
                  <dd>{money(paid, reservation.currency)}</dd>
                </div>
                <div>
                  <dt>{t('folio.due')}</dt>
                  <dd className={due > 0 ? s.due : s.paid}>{money(due, reservation.currency)}</dd>
                </div>
              </dl>
              {due > 0 ? <p className={s.dueWarn}>{t('checkout.dueWarn', { amount: money(due, reservation.currency) })}</p> : null}
              {due > 0 && reservation.folioId ? (
                <Button
                  variant="secondary"
                  block
                  onClick={() => openFolio(reservation.folioId!)}
                >
                  {t('folio.addPayment')}
                </Button>
              ) : null}
              <Button
                block
                onClick={() =>
                  checkOut.mutate(reservation.id, {
                    onSuccess: (updated) => {
                      showToast([t('toast.checkedOut', { name: updated.guestName })])
                      closeDrawer()
                    },
                    onError: (error) => showToast([errorText(error, t('toast.failed'))]),
                  })
                }
              >
                {t('checkout.confirm')}
              </Button>
            </div>
          ) : null}
          <div className={s.actions}>
            <Button variant="secondary" block onClick={() => openEdit(reservation.id)}>
              {t('actions.edit')}
            </Button>
            {canCancel ? (
              <Button
                variant="danger"
                block
                onClick={() =>
                  cancel.mutate(reservation.id, {
                    onSuccess: () => {
                      showToast([t('toast.cancelled'), t('toast.roomFreed')])
                      closeDrawer()
                    },
                    onError: (error) => showToast([errorText(error, t('toast.failed'))]),
                  })
                }
              >
                {t('actions.cancelReservation')}
              </Button>
            ) : null}
          </div>
        </>
      }
    >
      <div className={s.badges}>
        <StatusBadge status={reservation.status} />
        <SourceBadge source={reservation.source} />
      </div>
      <p className={s.room}>{t('detail.roomLine', { room: reservation.roomId || t('room.unassigned'), type: room?.typeName || reservation.roomTypeName || room?.type || '' })}</p>
      {!reservation.roomId && reservation.status === 'RESERVED' ? (
        <Field label={t('room.assign')} htmlFor="assign-room">
          <Dropdown
            id="assign-room"
            searchable
            label={t('room.assign')}
            placeholder={t('room.chooseRoom')}
            searchPlaceholder={t('common.search')}
            emptyLabel={t('common.noResults')}
            value={assignRoom}
            options={rooms
              .filter((item) => !reservation.roomTypeId || item.roomTypeId === reservation.roomTypeId)
              .map((item) => ({ value: item.id, label: item.id }))}
            onChange={setAssignRoom}
          />
          <Button
            block
            disabled={!assignRoom || assign.isPending}
            onClick={() =>
              assign.mutate(
                { id: reservation.id, roomId: assignRoom },
                {
                  onSuccess: () => showToast([t('room.assigned')]),
                  onError: (error) => showToast([errorText(error, t('toast.failed'))]),
                },
              )
            }
          >
            {t('room.assign')}
          </Button>
        </Field>
      ) : null}
      {confirmOut ? (
        <p className={s.notes}>
          {t('checkout.line', { name: reservation.guestName, room: reservation.roomId || t('room.unassigned') })}
          <br />
          {t('checkout.when', { date: fmtGjate(reservation.checkOut, months), time: clock })}
        </p>
      ) : null}
      <div className={s.stay}>
        <div className={s.stayRow}>
          <span className={s.arrive}>
            <IconArrive />
          </span>
          <span>
            <span className={s.kicker}>{t('list.checkIn')}</span>
            <span className={s.when}>{fmtGjate(reservation.checkIn, months)}</span>
          </span>
          <span className={s.aside}>{t('common.night', { count: dayIndex(reservation.checkIn, reservation.checkOut) })}</span>
        </div>
        <div className={s.stayRow}>
          <span className={s.depart}>
            <IconDepart />
          </span>
          <span>
            <span className={s.kicker}>{t('list.checkOut')}</span>
            <span className={s.when}>{fmtGjate(reservation.checkOut, months)}</span>
          </span>
          <span className={s.aside}>{t('common.person', { count: reservation.persons })}</span>
        </div>
      </div>
      <dl className={s.facts}>
        <div>
          <dt>{t('detail.phone')}</dt>
          <dd>{formatPhone(reservation.phonePrefix, reservation.phone) || t('common.empty')}</dd>
        </div>
        <div>
          <dt>{t('folio.total')}</dt>
          <dd>{money(charges, reservation.currency)}</dd>
        </div>
        <div>
          <dt>{t('folio.paid')}</dt>
          <dd className={s.paid}>{money(paid, reservation.currency)}</dd>
        </div>
        <div>
          <dt>{t('folio.due')}</dt>
          <dd className={due > 0 ? s.due : s.paid}>{due > 0 ? money(due, reservation.currency) : t('detail.nothingDue')}</dd>
        </div>
      </dl>
      <div className={s.actions}>
        {reservation.folioId ? (
          <>
            <Button variant="secondary" block onClick={() => openFolio(reservation.folioId!)}>
              {t('folio.view')}
            </Button>
            <Button
              block
              onClick={() => openFolio(reservation.folioId!)}
            >
              {t('folio.addPayment')}
            </Button>
          </>
        ) : null}
      </div>
      {reservation.notes ? <p className={s.notes}>{reservation.notes}</p> : null}
      {reservation.source === 'BOOKING' ? (
        <p className={s.booking}>
          <span className={s.mark}>B</span>
          {t('detail.fromBooking')}
        </p>
      ) : null}
    </Drawer>
  )
}
