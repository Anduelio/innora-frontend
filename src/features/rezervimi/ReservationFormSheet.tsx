import { useId, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import {
  DESK_SOURCES,
  PAYMENT_METHODS,
  type DeskSource,
  type PaymentMethod,
  type Reservation,
  type Room,
  type RoomTypeInfo,
} from '@/types/domain'
import { addDaysIso, dayIndex, fmtDate } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { centsToInput, currencyMark, eurosToCents, formatMoney } from '@/lib/format/money'
import { freeRoomsForStay, typeFreeForStay } from '@/lib/inventory'
import { splitPhone } from '@/lib/phone'
import { useCreateReservation, useUpdateReservation } from '@/lib/api/reservations'
import { useUiStore, type CreateDraft, type EditDraft } from '@/store/uiStore'
import { Button } from '@/components/atoms/Button/Button'
import { IconCheckCircle, IconDoor, IconPhone } from '@/components/atoms/Icon/icons'
import { Select } from '@/components/atoms/Select/Select'
import { TextInput } from '@/components/atoms/TextInput/TextInput'
import { Textarea } from '@/components/atoms/Textarea/Textarea'
import { Alert } from '@/components/molecules/Alert/Alert'
import { DatePicker } from '@/components/molecules/DatePicker/DatePicker'
import { Field } from '@/components/molecules/Field/Field'
import { NumberStepper } from '@/components/molecules/NumberStepper/NumberStepper'
import { PhoneField } from '@/components/molecules/PhoneField/PhoneField'
import { SegmentedControl } from '@/components/molecules/SegmentedControl/SegmentedControl'
import { SourceBadge } from '@/components/molecules/SourceBadge/SourceBadge'
import { Sheet } from '@/components/organisms/Sheet/Sheet'
import { useActionError } from '@/features/rezervimi/useStayActions'
import s from './ReservationFormSheet.module.scss'

const sourceIcons: Record<DeskSource, ReactNode> = { TELEFON: <IconPhone />, RECEPSION: <IconDoor /> }

interface Values {
  source: DeskSource
  checkIn: string
  checkOut: string
  roomTypeId: number
  roomId: string
  persons: number
  guestName: string
  phonePrefix: string
  phone: string
  email: string
  price: string
  payNow: string
  payMethod: PaymentMethod
  notes: string
}

function initialValues(
  modal: CreateDraft | EditDraft,
  editing: Reservation | undefined,
  rooms: Room[],
  roomTypes: RoomTypeInfo[],
  reservations: Reservation[],
): Values {
  if (modal.mode === 'edit' && editing) {
    const phone = splitPhone(editing.phonePrefix, editing.phone)
    const nights = Math.max(1, dayIndex(editing.checkIn, editing.checkOut))
    return {
      source: editing.source === 'RECEPSION' ? 'RECEPSION' : 'TELEFON',
      checkIn: editing.checkIn,
      checkOut: editing.checkOut,
      roomTypeId: editing.roomTypeId,
      roomId: editing.roomId,
      persons: editing.persons,
      guestName: editing.guestName,
      phonePrefix: phone.prefix,
      phone: phone.phone,
      email: editing.email ?? '',
      price: centsToInput(Math.round(editing.totalCents / nights)),
      payNow: '',
      payMethod: 'cash',
      notes: editing.notes ?? '',
    }
  }
  const draft = modal.mode === 'create' ? modal : { checkIn: TODAY, checkOut: addDaysIso(TODAY, 1) }
  const room = 'roomId' in draft && draft.roomId ? rooms.find((item) => item.id === draft.roomId) : undefined
  const preferred = room?.roomTypeId ?? ('roomTypeId' in draft ? draft.roomTypeId : undefined)
  const firstFree = roomTypes.find(
    (type) => typeFreeForStay(type.id, draft.checkIn, draft.checkOut, rooms, reservations) > 0,
  )
  const type = roomTypes.find((item) => item.id === preferred) ?? firstFree ?? roomTypes[0]
  return {
    source: 'TELEFON',
    checkIn: draft.checkIn,
    checkOut: draft.checkOut,
    roomTypeId: type?.id ?? 0,
    roomId: room?.id ?? '',
    persons: Math.min(2, type?.maxOccupancy ?? 2),
    guestName: '',
    phonePrefix: '+355',
    phone: '',
    email: '',
    price: type ? centsToInput(type.basePriceCents) : '',
    payNow: '0',
    payMethod: 'cash',
    notes: '',
  }
}

export function ReservationFormSheet({
  rooms,
  roomTypes,
  reservations,
}: {
  rooms: Room[]
  roomTypes: RoomTypeInfo[]
  reservations: Reservation[]
}) {
  const modal = useUiStore((state) => state.modal)
  const closeModal = useUiStore((state) => state.closeModal)
  if (!modal || roomTypes.length === 0) return null
  const editing = modal.mode === 'edit' ? reservations.find((item) => item.id === modal.reservationId) : undefined
  return (
    <FormBody
      key={modal.token}
      modal={modal}
      editing={editing}
      rooms={rooms}
      roomTypes={roomTypes}
      reservations={reservations}
      onClose={closeModal}
    />
  )
}

function FormBody({
  modal,
  editing,
  rooms,
  roomTypes,
  reservations,
  onClose,
}: {
  modal: CreateDraft | EditDraft
  editing: Reservation | undefined
  rooms: Room[]
  roomTypes: RoomTypeInfo[]
  reservations: Reservation[]
  onClose: () => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const showToast = useUiStore((state) => state.showToast)
  const openDrawer = useUiStore((state) => state.openDrawer)
  const onError = useActionError()
  const create = useCreateReservation()
  const update = useUpdateReservation()
  const [values, setValues] = useState(() => initialValues(modal, editing, rooms, roomTypes, reservations))
  const [submitted, setSubmitted] = useState(false)
  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((current) => ({ ...current, [key]: value }))

  const isEdit = modal.mode === 'edit'
  const ignoreId = editing?.id
  const type = roomTypes.find((item) => item.id === values.roomTypeId)
  const currency = type?.currency ?? 'EUR'
  const nights = Math.max(0, dayIndex(values.checkIn, values.checkOut))
  const datesValid = nights >= 1
  const free = datesValid ? typeFreeForStay(values.roomTypeId, values.checkIn, values.checkOut, rooms, reservations, ignoreId) : 0
  const freeRooms = useMemo(
    () =>
      datesValid
        ? freeRoomsForStay(values.checkIn, values.checkOut, rooms, reservations, { roomTypeId: values.roomTypeId, ignoreId })
        : [],
    [datesValid, ignoreId, reservations, rooms, values.checkIn, values.checkOut, values.roomTypeId],
  )
  const roomId = freeRooms.some((room) => room.id === values.roomId) ? values.roomId : ''
  const priceCents = eurosToCents(values.price)
  const totalCents = priceCents * nights
  const payNowCents = Math.min(eurosToCents(values.payNow), totalCents)
  const nameError = values.guestName.trim() ? '' : t('reservation.form.nameRequired')
  const canSave = datesValid && free >= 1 && !nameError && !create.isPending && !update.isPending

  const changeTypeTo = (next: number) => {
    const nextType = roomTypes.find((item) => item.id === next)
    setValues((current) => ({
      ...current,
      roomTypeId: next,
      roomId: '',
      persons: Math.min(current.persons, nextType?.maxOccupancy ?? current.persons),
      price: !isEdit && nextType ? centsToInput(nextType.basePriceCents) : current.price,
    }))
  }

  const submit = () => {
    setSubmitted(true)
    if (!canSave) return
    const contact = {
      guestName: values.guestName.trim(),
      phonePrefix: values.phonePrefix,
      phone: values.phone.trim(),
      email: values.email.trim() || undefined,
      notes: values.notes.trim(),
    }
    const dates = `${fmtDate(values.checkIn)} → ${fmtDate(values.checkOut)}`
    if (isEdit && editing) {
      update.mutate(
        {
          id: editing.id,
          patch: {
            ...contact,
            phonePrefix: undefined,
            phone: values.phone.trim() ? `${values.phonePrefix} ${values.phone.trim()}` : '',
            checkIn: values.checkIn,
            checkOut: values.checkOut,
            roomTypeId: values.roomTypeId,
            roomId,
            persons: values.persons,
            totalCents,
          },
        },
        {
          onSuccess: (saved) => {
            showToast([t('toast.updated'), t('toast.syncPending')])
            openDrawer(saved.id)
          },
          onError,
        },
      )
      return
    }
    create.mutate(
      {
        ...contact,
        source: values.source,
        checkIn: values.checkIn,
        checkOut: values.checkOut,
        roomTypeId: values.roomTypeId,
        roomId: roomId || undefined,
        persons: values.persons,
        pricePerNightCents: priceCents,
        currency,
        initialPayment: payNowCents > 0 ? { amountCents: payNowCents, method: values.payMethod, paidAt: TODAY } : undefined,
      },
      {
        onSuccess: (saved) => {
          showToast([t('toast.created'), t('toast.createdDetail', { name: saved.guestName, dates }), t('toast.syncPending')])
          onClose()
        },
        onError,
      },
    )
  }

  const nightsLabel = datesValid ? t('common.night', { count: nights }) : '—'
  const oldTotal = editing?.totalCents ?? 0

  return (
    <Sheet
      open
      size="lg"
      title={isEdit ? t('reservation.form.titleEdit') : t('reservation.form.titleNew')}
      description={isEdit && editing ? `${editing.guestName} · ${editing.code}` : t('reservation.form.subtitleNew')}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form={`${id}-form`} size="lg" disabled={!canSave && submitted} loading={create.isPending || update.isPending}>
            {isEdit ? t('reservation.form.saveChanges') : t('reservation.form.save')}
          </Button>
        </>
      }
    >
      <form
        id={`${id}-form`}
        className={s.form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <fieldset className={s.group}>
          <legend className={s.legend}>{t('reservation.stay')}</legend>
          {isEdit && editing ? (
            <Field label={t('reservation.form.source')}>
              <span>
                <SourceBadge source={editing.source} />
              </span>
            </Field>
          ) : (
            <Field label={t('reservation.form.source')}>
              <SegmentedControl<DeskSource>
                label={t('reservation.form.source')}
                value={values.source}
                onChange={(value) => set('source', value)}
                block
                options={DESK_SOURCES.map((item) => ({ value: item, label: t(`source.${item}`), icon: sourceIcons[item] }))}
              />
            </Field>
          )}
          <div className={s.dates}>
            <Field label={t('reservation.form.arrival')} htmlFor={`${id}-in`}>
              <DatePicker
                id={`${id}-in`}
                label={t('reservation.form.arrival')}
                value={values.checkIn}
                min={isEdit ? undefined : TODAY}
                onChange={(value) => {
                  setValues((current) => ({
                    ...current,
                    checkIn: value,
                    checkOut: current.checkOut > value ? current.checkOut : addDaysIso(value, Math.max(1, nights)),
                  }))
                }}
              />
            </Field>
            <span className={s.nightsChip} aria-live="polite">
              → {nightsLabel}
            </span>
            <Field
              label={t('reservation.form.departure')}
              htmlFor={`${id}-out`}
              error={datesValid ? undefined : t('reservation.form.datesInvalid')}
            >
              <DatePicker
                id={`${id}-out`}
                label={t('reservation.form.departure')}
                value={values.checkOut}
                min={addDaysIso(values.checkIn, 1)}
                invalid={!datesValid}
                align="end"
                onChange={(value) => set('checkOut', value)}
              />
            </Field>
          </div>
          <div className={s.pair}>
            <Field label={t('reservation.form.type')} htmlFor={`${id}-type`}>
              <Select id={`${id}-type`} value={values.roomTypeId} onChange={(event) => changeTypeTo(Number(event.target.value))}>
                {roomTypes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t('reservation.form.room')} htmlFor={`${id}-room`} optional hint={t('reservation.form.roomHint')}>
              <Select id={`${id}-room`} value={roomId} disabled={free < 1} onChange={(event) => set('roomId', event.target.value)}>
                <option value="">{t('reservation.form.roomLater')}</option>
                {freeRooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {t('common.roomNumber', { room: room.id })}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {datesValid ? (
            free >= 1 ? (
              <p className={s.available}>
                <IconCheckCircle size={18} />
                {free === 1 ? t('reservation.form.lastRoom') : t('reservation.form.available', { count: free })}
              </p>
            ) : (
              <Alert tone="danger" title={t('reservation.form.noAvailability')}>
                {t('reservation.form.noAvailabilityHint')}
              </Alert>
            )
          ) : null}
          <Field label={t('reservation.form.guests')} htmlFor={`${id}-guests`} hint={t('reservation.form.maxGuests', { count: type?.maxOccupancy ?? 1 })}>
            <NumberStepper
              id={`${id}-guests`}
              value={values.persons}
              min={1}
              max={type?.maxOccupancy ?? 1}
              decreaseLabel={t('common.decrease')}
              increaseLabel={t('common.increase')}
              onChange={(value) => set('persons', value)}
            />
          </Field>
        </fieldset>

        <fieldset className={s.group}>
          <legend className={s.legend}>{t('reservation.contact')}</legend>
          <Field label={t('reservation.form.name')} htmlFor={`${id}-name`} error={submitted ? nameError : undefined}>
            <TextInput
              id={`${id}-name`}
              data-autofocus
              autoComplete="name"
              placeholder={t('reservation.form.namePlaceholder')}
              value={values.guestName}
              invalid={submitted && Boolean(nameError)}
              onChange={(event) => set('guestName', event.target.value)}
            />
          </Field>
          <div className={s.pair}>
            <Field label={t('reservation.form.phone')} htmlFor={`${id}-phone`}>
              <PhoneField
                id={`${id}-phone`}
                prefix={values.phonePrefix}
                phone={values.phone}
                onPrefixChange={(value) => set('phonePrefix', value)}
                onPhoneChange={(value) => set('phone', value)}
              />
            </Field>
            <Field label={t('reservation.form.email')} htmlFor={`${id}-email`} optional>
              <TextInput
                id={`${id}-email`}
                type="email"
                inputMode="email"
                autoComplete="email"
                value={values.email}
                onChange={(event) => set('email', event.target.value)}
              />
            </Field>
          </div>
        </fieldset>

        <fieldset className={s.group}>
          <legend className={s.legend}>{t('reservation.account')}</legend>
          <div className={s.pair}>
            <Field label={t('reservation.form.price')} htmlFor={`${id}-price`}>
              <TextInput
                id={`${id}-price`}
                inputMode="decimal"
                value={values.price}
                end={`${currencyMark(currency)} ${t('reservation.form.perNight')}`}
                onChange={(event) => set('price', event.target.value)}
              />
            </Field>
            <div className={s.total}>
              <span className={s.totalLabel}>{t('reservation.form.total')}</span>
              <span className={s.totalValue}>{formatMoney(totalCents, currency)}</span>
              {datesValid ? (
                <span className={s.totalLine}>
                  {t('reservation.form.totalLine', { nights: nightsLabel, price: formatMoney(priceCents, currency) })}
                </span>
              ) : null}
            </div>
          </div>
          {isEdit ? null : (
            <div className={s.pair}>
              <Field label={t('reservation.form.payNow')} htmlFor={`${id}-pay`} hint={t('reservation.form.payNowHint')}>
                <TextInput
                  id={`${id}-pay`}
                  inputMode="decimal"
                  value={values.payNow}
                  end={currencyMark(currency)}
                  onChange={(event) => set('payNow', event.target.value)}
                />
              </Field>
              <Field label={t('reservation.form.method')} htmlFor={`${id}-method`}>
                <Select
                  id={`${id}-method`}
                  value={values.payMethod}
                  disabled={payNowCents <= 0}
                  onChange={(event) => set('payMethod', event.target.value as PaymentMethod)}
                >
                  {PAYMENT_METHODS.map((item) => (
                    <option key={item} value={item}>
                      {t(`pay.methods.${item}`)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          )}
          <Field label={t('reservation.form.notes')} htmlFor={`${id}-notes`} optional>
            <Textarea
              id={`${id}-notes`}
              rows={3}
              placeholder={t('reservation.form.notesPlaceholder')}
              value={values.notes}
              onChange={(event) => set('notes', event.target.value)}
            />
          </Field>
        </fieldset>

        {isEdit && editing && (editing.checkIn !== values.checkIn || editing.checkOut !== values.checkOut || oldTotal !== totalCents) ? (
          <section className={s.change} aria-live="polite">
            <h3 className={s.changeTitle}>{t('reservation.form.change')}</h3>
            <dl>
              <div>
                <dt>{t('reservation.form.dates')}</dt>
                <dd>
                  <s>{`${fmtDate(editing.checkIn)} → ${fmtDate(editing.checkOut)}`}</s>
                  <strong>{`${fmtDate(values.checkIn)} → ${fmtDate(values.checkOut)}`}</strong>
                </dd>
              </div>
              <div>
                <dt>{t('reservation.form.price2')}</dt>
                <dd>
                  <s>{formatMoney(oldTotal, editing.currency)}</s>
                  <strong>{formatMoney(totalCents, editing.currency)}</strong>
                </dd>
              </div>
              <div>
                <dt>{t('reservation.form.difference')}</dt>
                <dd>
                  <strong>
                    {totalCents - oldTotal >= 0 ? '+' : '−'}
                    {formatMoney(Math.abs(totalCents - oldTotal), editing.currency)}
                  </strong>
                </dd>
              </div>
            </dl>
          </section>
        ) : null}

        <p className={s.syncNote}>{t('reservation.form.syncNote')}</p>
      </form>
    </Sheet>
  )
}
