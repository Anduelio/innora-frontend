import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Customer } from '@/types/domain'
import { useDeleteCustomer } from '@/lib/api/customers'
import { addDaysIso, fmtDate } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { stayNights } from '@/lib/reservation'
import { useUiStore } from '@/store/uiStore'
import { Avatar } from '@/components/atoms/Avatar/Avatar'
import { Badge } from '@/components/atoms/Badge/Badge'
import { Button } from '@/components/atoms/Button/Button'
import { IconChevronRight, IconEdit, IconMail, IconPhone, IconPlus, IconStar } from '@/components/atoms/Icon/icons'
import { Money } from '@/components/atoms/Money/Money'
import { SourceBadge } from '@/components/molecules/SourceBadge/SourceBadge'
import { StatusBadge } from '@/components/molecules/StatusBadge/StatusBadge'
import { ConfirmDialog } from '@/components/organisms/ConfirmDialog/ConfirmDialog'
import { Sheet } from '@/components/organisms/Sheet/Sheet'
import { useActionError } from '@/features/reservation/useStayActions'
import s from './CustomerSheet.module.scss'
import { notify } from '@/lib/notify'

function Amounts({ amounts, tone }: { amounts: Customer['value']; tone?: 'danger' }) {
  if (amounts.length === 0) return <>—</>
  return (
    <span className={s.amounts}>
      {amounts.map((amount) => (
        <Money key={amount.currency} cents={amount.cents} currency={amount.currency} tone={tone} />
      ))}
    </span>
  )
}

export function CustomerSheet({
  customer,
  onClose,
  onEdit,
}: {
  customer: Customer | null
  onClose: () => void
  onEdit: (customer: Customer) => void
}) {
  const { t } = useTranslation()
  const openCreate = useUiStore((state) => state.openCreate)
  const openDrawer = useUiStore((state) => state.openDrawer)
  const remove = useDeleteCustomer()
  const onError = useActionError()
  const [confirming, setConfirming] = useState(false)

  if (!customer) return null

  const newReservation = () => {
    onClose()
    openCreate({
      checkIn: TODAY,
      checkOut: addDaysIso(TODAY, 1),
      guest: { name: customer.name, phone: customer.phone, email: customer.email },
    })
  }

  const openReservation = (id: string) => {
    onClose()
    openDrawer(id)
  }

  const neverBooked = customer.reservations.length === 0
  const removeContact = () => {
    if (!customer.contactId) return
    remove.mutate(customer.contactId, {
      onSuccess: () => {
        notify.warning(t('klientet.form.removed', { name: customer.name }))
        setConfirming(false)
        onClose()
      },
      onError,
    })
  }

  const stats = [
    { label: t('klientet.sheet.stays'), value: customer.stays },
    { label: t('klientet.sheet.nights'), value: customer.nights },
    { label: t('klientet.sheet.upcoming'), value: customer.upcoming },
    { label: t('klientet.sheet.first'), value: neverBooked ? '—' : fmtDate(customer.firstStay) },
  ]

  return (
    <>
      <Sheet
        open
        title={customer.name}
        description={
          neverBooked ? t('klientet.noBookingYet') : t('klientet.sheet.subtitle', { count: customer.bookings })
        }
        onClose={onClose}
        footer={
          <Button size="lg" block icon={<IconPlus />} onClick={newReservation}>
            {t('klientet.sheet.newReservation')}
          </Button>
        }
      >
        <div className={s.body}>
          <div className={s.hero}>
            <Avatar name={customer.name} size="lg" />
            <div className={s.badges}>
              {customer.inHouse ? <Badge tone="success">{t('klientet.badges.inHouse')}</Badge> : null}
              {customer.bookings >= 2 ? (
                <Badge tone="info" icon={<IconStar size={14} />}>
                  {t('klientet.badges.returning')}
                </Badge>
              ) : null}
              {customer.sources.map((source) => (
                <SourceBadge key={source} source={source} />
              ))}
            </div>
          </div>

          <div className={s.contact}>
            {customer.phone ? (
              <a className={s.contactLink} href={`tel:${customer.phone.replace(/\s/g, '')}`}>
                <IconPhone size={18} />
                {customer.phone}
              </a>
            ) : null}
            {customer.email ? (
              <a className={s.contactLink} href={`mailto:${customer.email}`}>
                <IconMail size={18} />
                {customer.email}
              </a>
            ) : null}
            {!customer.phone && !customer.email ? <p className={s.muted}>{t('klientet.sheet.noContact')}</p> : null}
          </div>

          {customer.notes ? <p className={s.notes}>{customer.notes}</p> : null}

          {customer.contactId ? (
            <div className={s.manage}>
              <Button variant="secondary" icon={<IconEdit size={18} />} onClick={() => onEdit(customer)}>
                {t('klientet.form.edit')}
              </Button>
              {neverBooked ? (
                <Button variant="ghost" onClick={() => setConfirming(true)}>
                  {t('klientet.form.remove')}
                </Button>
              ) : null}
            </div>
          ) : null}

          <dl className={s.stats}>
            {stats.map((item) => (
              <div key={item.label} className={s.stat}>
                <dt>{item.label}</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>

          <dl className={s.money}>
            <div>
              <dt>{t('klientet.sheet.value')}</dt>
              <dd>
                <Amounts amounts={customer.value} />
              </dd>
            </div>
            <div>
              <dt>{t('klientet.sheet.balance')}</dt>
              <dd>
                <Amounts amounts={customer.balance} tone="danger" />
              </dd>
            </div>
          </dl>
          <p className={s.note}>{t('klientet.sheet.valueNote')}</p>

          <section aria-labelledby="customer-history">
            <h3 id="customer-history" className={s.heading}>
              {t('klientet.sheet.history')}
            </h3>
            {neverBooked ? <p className={s.muted}>{t('klientet.sheet.noHistory')}</p> : null}
            <ul className={s.history}>
              {customer.reservations.map((reservation) => (
                <li key={reservation.id}>
                  <button type="button" className={s.row} onClick={() => openReservation(reservation.id)}>
                    <span className={s.rowMain}>
                      <span className={s.rowDates}>
                        {fmtDate(reservation.checkIn)} → {fmtDate(reservation.checkOut)}
                      </span>
                      <span className={s.rowMeta}>
                        {t('common.night', { count: stayNights(reservation) })} ·{' '}
                        {reservation.roomId
                          ? t('common.roomNumber', { room: reservation.roomId })
                          : t('room.unassignedShort')}{' '}
                        · {reservation.code}
                      </span>
                    </span>
                    <span className={s.rowSide}>
                      <StatusBadge status={reservation.status} />
                      <Money cents={reservation.totalCents} currency={reservation.currency} />
                    </span>
                    <IconChevronRight size={18} className={s.chevron} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </Sheet>
      <ConfirmDialog
        open={confirming}
        title={t('klientet.form.removeTitle', { name: customer.name })}
        confirmLabel={t('klientet.form.remove')}
        tone="danger"
        pending={remove.isPending}
        onConfirm={removeContact}
        onClose={() => setConfirming(false)}
      >
        <p>{t('klientet.form.removeText')}</p>
      </ConfirmDialog>
    </>
  )
}
