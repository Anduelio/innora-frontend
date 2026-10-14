import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Reservation, Room, RoomTypeInfo } from '@/types/domain'
import { fmtDate, weekdayIndex } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { formatMoney } from '@/lib/format/money'
import { allowedActions, balanceCents, payState, stayNights } from '@/lib/reservation'
import { useUiStore } from '@/store/uiStore'
import { Button } from '@/components/atoms/Button/Button'
import { Money } from '@/components/atoms/Money/Money'
import { IconArrive, IconDepart, IconMail, IconPhone } from '@/components/atoms/Icon/icons'
import { Textarea } from '@/components/atoms/Textarea/Textarea'
import { Alert } from '@/components/molecules/Alert/Alert'
import { Field } from '@/components/molecules/Field/Field'
import { PaymentBadge } from '@/components/molecules/PaymentBadge/PaymentBadge'
import { SourceBadge } from '@/components/molecules/SourceBadge/SourceBadge'
import { StatusBadge } from '@/components/molecules/StatusBadge/StatusBadge'
import { Sheet } from '@/components/organisms/Sheet/Sheet'
import { AssignRoom } from '@/features/reservation/AssignRoom'
import { PaymentForm } from '@/features/reservation/PaymentForm'
import { useStayActions } from '@/features/reservation/useStayActions'
import s from './ReservationDetailSheet.module.scss'

type Step = 'idle' | 'checkout' | 'cancel'

function historyTime(iso: string): string {
  const date = new Date(iso)
  const day = date.toLocaleDateString('sv-SE', { timeZone: 'Europe/Tirane' })
  const time = date.toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Tirane' })
  return `${fmtDate(day)} · ${time}`
}

export function ReservationDetailSheet({
  rooms,
  roomTypes,
  reservations,
}: {
  rooms: Room[]
  roomTypes: RoomTypeInfo[]
  reservations: Reservation[]
}) {
  const { t } = useTranslation()
  const drawerId = useUiStore((state) => state.drawerId)
  const closeDrawer = useUiStore((state) => state.closeDrawer)
  const reservation = reservations.find((item) => item.id === drawerId)
  if (!drawerId) return null
  if (!reservation) {
    return (
      <Sheet open title={t('common.loadError')} onClose={closeDrawer}>
        <Alert tone="warning" title={t('reservation.notFound')} />
      </Sheet>
    )
  }
  return (
    <DetailBody
      key={reservation.id}
      reservation={reservation}
      rooms={rooms}
      roomTypes={roomTypes}
      reservations={reservations}
      onClose={closeDrawer}
    />
  )
}

function DetailBody({
  reservation,
  rooms,
  roomTypes,
  reservations,
  onClose,
}: {
  reservation: Reservation
  rooms: Room[]
  roomTypes: RoomTypeInfo[]
  reservations: Reservation[]
  onClose: () => void
}) {
  const { t } = useTranslation()
  const openEdit = useUiStore((state) => state.openEdit)
  const actions = useStayActions()
  const [step, setStep] = useState<Step>('idle')
  const [reason, setReason] = useState('')
  const [reasonTouched, setReasonTouched] = useState(false)
  const weekdays = t('calendar.weekdaysLong', { returnObjects: true }) as string[]
  const allowed = new Set(allowedActions(reservation, TODAY))
  const type = roomTypes.find((item) => item.id === reservation.roomTypeId)
  const due = balanceCents(reservation)
  const nights = stayNights(reservation)
  const fromBooking = reservation.source === 'BOOKING'

  const footer =
    step === 'checkout' ? (
      <>
        <Button variant="ghost" onClick={() => setStep('idle')}>
          {t('common.back')}
        </Button>
        <Button loading={actions.pending} onClick={() => actions.checkOut(reservation, onClose)}>
          {t('reservation.confirmCheckout')}
        </Button>
      </>
    ) : step === 'cancel' ? (
      <>
        <Button variant="ghost" onClick={() => setStep('idle')}>
          {t('reservation.keep')}
        </Button>
        <Button
          variant="danger"
          loading={actions.pending}
          onClick={() => {
            setReasonTouched(true)
            if (reason.trim()) actions.cancel(reservation, reason.trim(), onClose)
          }}
        >
          {t('reservation.confirmCancel')}
        </Button>
      </>
    ) : (
      <>
        {allowed.has('edit') ? (
          <Button variant="secondary" onClick={() => openEdit(reservation.id)}>
            {t('reservation.edit')}
          </Button>
        ) : null}
        {allowed.has('check_in') ? (
          <Button icon={<IconArrive />} loading={actions.pending} onClick={() => actions.checkIn(reservation, onClose)}>
            {t('reservation.checkIn')}
          </Button>
        ) : null}
        {allowed.has('check_out') ? (
          <Button
            icon={<IconDepart />}
            loading={actions.pending}
            onClick={() => (due > 0 ? setStep('checkout') : actions.checkOut(reservation, onClose))}
          >
            {t('reservation.checkOut')}
          </Button>
        ) : null}
      </>
    )

  return (
    <Sheet
      open
      size="lg"
      title={reservation.guestName}
      description={`${reservation.code}${reservation.externalRef ? ` · ${t('reservation.bookingRef')} ${reservation.externalRef}` : ''}`}
      headerExtra={
        <>
          <StatusBadge status={reservation.status} />
          <SourceBadge source={reservation.source} />
          {reservation.status === 'CANCELLED' ? null : <PaymentBadge state={payState(reservation)} />}
        </>
      }
      onClose={onClose}
      footer={footer}
    >
      {step === 'checkout' ? (
        <Alert
          tone="warning"
          title={t('reservation.checkoutBalance', { amount: formatMoney(due, reservation.currency) })}
        />
      ) : null}

      {step === 'cancel' ? (
        <section className={s.section}>
          <Field
            label={t('reservation.cancelReason')}
            htmlFor="cancel-reason"
            hint={t('reservation.cancelHint')}
            error={reasonTouched && !reason.trim() ? t('reservation.cancelReasonRequired') : undefined}
          >
            <Textarea
              id="cancel-reason"
              data-autofocus
              value={reason}
              placeholder={t('reservation.cancelReasonPlaceholder')}
              onChange={(event) => setReason(event.target.value)}
            />
          </Field>
        </section>
      ) : null}

      {fromBooking ? (
        <Alert tone="info" title={t('reservation.bookingOwned')}>
          {t('reservation.bookingOwnedDetail')}
        </Alert>
      ) : null}

      {reservation.status === 'CANCELLED' && reservation.cancelReason ? (
        <Alert tone="danger" title={t('status.CANCELLED')}>
          {t('reservation.cancelledBecause', { reason: reservation.cancelReason })}
        </Alert>
      ) : null}

      <section className={s.section} aria-labelledby="stay-heading">
        <h3 id="stay-heading" className={s.heading}>
          {t('reservation.stay')}
        </h3>
        <div className={s.dates}>
          <div className={s.date}>
            <span className={s.dateIcon}>
              <IconArrive size={18} />
            </span>
            <span>
              <span className={s.kicker}>
                {t('reservation.arrival')} · {weekdays[weekdayIndex(reservation.checkIn)]}
              </span>
              <span className={s.when}>{fmtDate(reservation.checkIn)}</span>
            </span>
          </div>
          <div className={s.nights}>{t('common.night', { count: nights })}</div>
          <div className={s.date}>
            <span className={s.dateIcon}>
              <IconDepart size={18} />
            </span>
            <span>
              <span className={s.kicker}>
                {t('reservation.departure')} · {weekdays[weekdayIndex(reservation.checkOut)]}
              </span>
              <span className={s.when}>{fmtDate(reservation.checkOut)}</span>
            </span>
          </div>
        </div>
        <dl className={s.facts}>
          <div>
            <dt>{t('reservation.room')}</dt>
            <dd className={reservation.roomId ? undefined : s.warn}>
              {reservation.roomId ? t('common.roomNumber', { room: reservation.roomId }) : t('room.unassigned')}
              <span className={s.muted}> · {type?.name ?? ''}</span>
            </dd>
          </div>
          <div>
            <dt>{t('reservation.guests')}</dt>
            <dd>{t('common.guest', { count: reservation.persons })}</dd>
          </div>
        </dl>
        {allowed.has('assign_room') ? (
          <AssignRoom reservation={reservation} rooms={rooms} reservations={reservations} />
        ) : null}
        {reservation.status === 'RESERVED' && !reservation.roomId && reservation.checkIn <= TODAY ? (
          <p className={s.warnText}>{t('reservation.noRoomWarn')}</p>
        ) : null}
        {reservation.status === 'RESERVED' && reservation.checkIn > TODAY ? (
          <p className={s.mutedText}>{t('reservation.checkInFrom', { date: fmtDate(reservation.checkIn) })}</p>
        ) : null}
      </section>

      {reservation.status === 'CANCELLED' ? null : (
        <section className={s.section} aria-labelledby="account-heading">
          <h3 id="account-heading" className={s.heading}>
            {t('reservation.account')}
          </h3>
          <dl className={s.account}>
            <div>
              <dt>{t('reservation.total')}</dt>
              <dd>
                <Money cents={reservation.totalCents} currency={reservation.currency} />
              </dd>
            </div>
            <div>
              <dt>{t('reservation.paid')}</dt>
              <dd>
                <Money cents={reservation.paidCents} currency={reservation.currency} tone="success" />
              </dd>
            </div>
            <div className={s.balance}>
              <dt>{t('reservation.balance')}</dt>
              <dd>
                {due > 0 ? (
                  <Money cents={due} currency={reservation.currency} tone="danger" strong />
                ) : (
                  <span className={s.ok}>{t('reservation.nothingDue')}</span>
                )}
              </dd>
            </div>
          </dl>
          {allowed.has('record_payment') && step === 'idle' ? <PaymentForm reservation={reservation} /> : null}
        </section>
      )}

      <section className={s.section} aria-labelledby="contact-heading">
        <h3 id="contact-heading" className={s.heading}>
          {t('reservation.contact')}
        </h3>
        <div className={s.contact}>
          {reservation.phone ? (
            <a className={s.contactLink} href={`tel:${reservation.phone.replace(/\s/g, '')}`}>
              <IconPhone size={18} />
              {reservation.phone}
            </a>
          ) : null}
          {reservation.email ? (
            <a className={s.contactLink} href={`mailto:${reservation.email}`}>
              <IconMail size={18} />
              {reservation.email}
            </a>
          ) : null}
        </div>
        {reservation.notes ? <p className={s.notes}>{reservation.notes}</p> : null}
      </section>

      {step === 'idle' && (allowed.has('no_show') || allowed.has('cancel')) ? (
        <section className={s.dangerZone}>
          {allowed.has('no_show') ? (
            <div className={s.dangerRow}>
              <p>{t('reservation.noShowHint')}</p>
              <Button
                variant="secondary"
                loading={actions.pending}
                onClick={() => actions.noShow(reservation, onClose)}
              >
                {t('reservation.noShow')}
              </Button>
            </div>
          ) : null}
          {allowed.has('cancel') ? (
            <div className={s.dangerRow}>
              <p>{t('reservation.cancelHint')}</p>
              <Button variant="danger" onClick={() => setStep('cancel')}>
                {t('reservation.cancel')}
              </Button>
            </div>
          ) : null}
        </section>
      ) : null}

      {reservation.history?.length ? (
        <section className={s.section} aria-labelledby="history-heading">
          <h3 id="history-heading" className={s.heading}>
            {t('reservation.history')}
          </h3>
          <ol className={s.history}>
            {reservation.history.toReversed().map((entry, index) => (
              <li key={`${entry.at}-${index}`}>
                <span className={s.historyAction}>
                  {t(`reservation.actions.${entry.action}`, { defaultValue: entry.action })}
                </span>
                <span className={s.historyMeta}>
                  {historyTime(entry.at)} · {entry.actor === 'system:beds24' ? 'Booking.com (Beds24)' : entry.actor}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </Sheet>
  )
}
