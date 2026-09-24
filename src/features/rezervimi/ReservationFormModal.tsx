import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trans, useTranslation } from 'react-i18next'
import { DESK_SOURCES, type DeskSource, type Reservation, type ReservationSource, type Room } from '@/types/domain'
import { addDaysIso, dayIndex, fmtGjate } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { centsToInput, currencyMark, eurosToCents } from '@/lib/format/money'
import { useCurrency } from '@/lib/format/useMoney'
import { nationalPhone, splitPhone } from '@/lib/phone'
import { errorText } from '@/lib/api/client'
import { useCreateReservation, useUpdateReservation } from '@/lib/api/reservations'
import { useRoomTypes } from '@/lib/api/rooms'
import { maxFreeNights } from '@/lib/stay'
import type { ModalState } from '@/store/uiStore'
import { useUiStore } from '@/store/uiStore'
import { IconArrive, IconCheck, IconDepart } from '@/components/icons'
import { Button } from '@/components/ui/Button/Button'
import { Field } from '@/components/ui/Field/Field'
import { Modal } from '@/components/ui/Modal/Modal'
import { NumberStepper } from '@/components/ui/NumberStepper/NumberStepper'
import { Select } from '@/components/ui/Select/Select'
import { PhoneField } from '@/components/ui/PhoneField/PhoneField'
import { TextInput } from '@/components/ui/TextInput/TextInput'
import {
  createReservationSchema,
  type ReservationFormValues,
} from '@/features/rezervimi/reservationSchema'
import s from './ReservationFormModal.module.scss'

function deskSource(source: ReservationSource): DeskSource {
  return DESK_SOURCES.includes(source as DeskSource) ? (source as DeskSource) : 'TELEFON'
}

function buildDefaults(modal: ModalState, reservation?: Reservation): ReservationFormValues {
  if (modal?.mode === 'edit' && reservation) {
    const phone = splitPhone(reservation.phonePrefix, reservation.phone)
    return {
      roomId: reservation.roomId,
      roomTypeId: reservation.roomTypeId ? String(reservation.roomTypeId) : '',
      guestName: reservation.guestName,
      phonePrefix: phone.prefix,
      phone: phone.phone,
      registerCustomer: true,
      persons: reservation.persons,
      source: deskSource(reservation.source),
      nights: Math.max(1, dayIndex(reservation.checkIn, reservation.checkOut)),
      total: centsToInput(reservation.totalCents),
      notes: reservation.notes ?? '',
    }
  }
  if (modal?.mode === 'create') {
    return {
      roomId: modal.roomId,
      roomTypeId: '',
      guestName: '',
      phonePrefix: '+355',
      phone: '',
      registerCustomer: true,
      persons: 2,
      source: 'TELEFON',
      nights: modal.nights,
      total: '',
      notes: '',
    }
  }
  return {
    roomId: '101',
    roomTypeId: '',
    guestName: '',
    phonePrefix: '+355',
    phone: '',
    registerCustomer: true,
    persons: 2,
    source: 'TELEFON',
    nights: 1,
    total: '',
    notes: '',
  }
}

export function ReservationFormModal({
  rooms,
  reservations,
}: {
  rooms: Room[]
  reservations: Reservation[]
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const modal = useUiStore((state) => state.modal)
  const closeModal = useUiStore((state) => state.closeModal)
  const showToast = useUiStore((state) => state.showToast)
  const roomTypes = useRoomTypes()
  const currency = useCurrency()
  const mark = currencyMark(currency)
  const create = useCreateReservation()
  const update = useUpdateReservation()
  const editing = modal?.mode === 'edit' ? reservations.find((item) => item.id === modal.reservationId) : undefined
  const months = t('calendar.months', { returnObjects: true }) as string[]

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(createReservationSchema(t('form.nameRequired'), t('form.phoneRequired'))),
    mode: 'onChange',
    defaultValues: buildDefaults(modal, editing),
  })

  const reservationsRef = useRef(reservations)
  reservationsRef.current = reservations
  const resetRef = useRef(form.reset)
  resetRef.current = form.reset
  const token = modal?.token

  useEffect(() => {
    const currentModal = useUiStore.getState().modal
    if (!currentModal) return
    const current =
      currentModal.mode === 'edit'
        ? reservationsRef.current.find((item) => item.id === currentModal.reservationId)
        : undefined
    resetRef.current(buildDefaults(currentModal, current))
  }, [token])

  const roomId = form.watch('roomId')
  const nights = form.watch('nights')
  const guestName = form.watch('guestName')
  const checkIn = modal?.mode === 'edit' ? (editing?.checkIn ?? TODAY) : modal?.mode === 'create' ? modal.checkIn : TODAY
  const ignoreId = modal?.mode === 'edit' ? modal.reservationId : undefined
  const maxNights = Math.max(1, maxFreeNights(reservations, roomId, checkIn, ignoreId))
  const source: ReservationSource = modal?.mode === 'edit' && editing ? editing.source : form.watch('source')
  const sourceLocked = source === 'BOOKING'
  const pending = create.isPending || update.isPending

  useEffect(() => {
    if (nights > maxNights) form.setValue('nights', maxNights)
  }, [form, maxNights, nights])

  const onSubmit = (values: ReservationFormValues) => {
    if (!modal || !values.guestName.trim()) return
    const stayNights = Math.min(values.nights, maxNights)
    if (modal.mode === 'create') {
      create.mutate(
        {
          ...(values.roomId ? { roomId: values.roomId } : { roomTypeId: Number(values.roomTypeId) }),
          guestName: values.guestName.trim(),
          phonePrefix: values.phonePrefix,
          phone: nationalPhone(values.phone),
          registerCustomer: values.registerCustomer,
          persons: values.persons,
          source: values.source,
          checkIn: modal.checkIn,
          nights: stayNights,
          totalCents: eurosToCents(values.total),
          notes: values.notes.trim(),
        },
        {
          onSuccess: () => {
            showToast([t('toast.created'), t('toast.availabilityUpdated')])
            closeModal()
            void navigate('/kalendari')
          },
          onError: (error) => showToast([errorText(error, t('toast.failed'))]),
        },
      )
      return
    }
    const current = reservations.find((item) => item.id === modal.reservationId)
    if (!current) return
    update.mutate(
      {
        id: current.id,
        patch: {
          ...(values.roomId ? { roomId: values.roomId } : {}),
          guestName: values.guestName.trim(),
          phonePrefix: values.phonePrefix,
          phone: nationalPhone(values.phone),
          registerCustomer: values.registerCustomer,
          persons: values.persons,
          checkIn: current.checkIn,
          checkOut: addDaysIso(current.checkIn, stayNights),
          totalCents: eurosToCents(values.total),
          notes: values.notes.trim(),
        },
      },
      {
        onSuccess: () => {
          showToast([t('toast.updated'), t('toast.availabilityUpdated')])
          closeModal()
        },
        onError: (error) => showToast([errorText(error, t('toast.failed'))]),
      },
    )
  }

  return (
    <Modal
      open={Boolean(modal)}
      title={modal?.mode === 'edit' ? t('actions.edit') : t('common.newReservation')}
      onClose={closeModal}
      footer={
        <>
          <Button variant="secondary" onClick={closeModal}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="reservation-form" className={s.submit} disabled={guestName.trim().length === 0 || pending}>
            {modal?.mode === 'edit' ? t('common.save') : t('common.create')}
          </Button>
        </>
      }
    >
      <form id="reservation-form" className={s.form} onSubmit={form.handleSubmit(onSubmit)}>
        {sourceLocked ? null : (
          <Field label={t('form.origin')} htmlFor="stay-source">
            <Select id="stay-source" {...form.register('source')}>
              {DESK_SOURCES.map((item) => (
                <option key={item} value={item}>
                  {t(`source.${item}`)}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <Field label={t('form.room')} htmlFor="room-id">
          <Select id="room-id" {...form.register('roomId')}>
            <option value="">{t('room.unassigned')}</option>
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>
                {t('app.roomOption', {
                  id: room.id,
                  type: room.type,
                  persons: t('common.person', { count: room.capacity }),
                })}
              </option>
            ))}
          </Select>
        </Field>
        {roomId ? null : (
          <Field label={t('room.typeLabel')} htmlFor="stay-type" error={form.formState.errors.roomTypeId?.message}>
            <Select id="stay-type" {...form.register('roomTypeId')}>
              <option value="">{t('room.chooseType')}</option>
              {(roomTypes.data ?? []).map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <div className={s.pair}>
          <Field label={t('form.checkIn')}>
            <div className={s.locked}>
              <span className={s.arrive}>
                <IconArrive />
              </span>
              {fmtGjate(checkIn, months)}
            </div>
          </Field>
          <Field label={t('form.checkOut')}>
            <div className={s.locked}>
              <span className={s.depart}>
                <IconDepart />
              </span>
              {fmtGjate(addDaysIso(checkIn, nights), months)}
            </div>
          </Field>
        </div>
        <div className={s.pair}>
          <Field label={t('form.nights')}>
            <NumberStepper
              value={nights}
              min={1}
              max={maxNights}
              decreaseLabel={t('common.decrease')}
              increaseLabel={t('common.increase')}
              onChange={(value) => form.setValue('nights', value)}
            />
          </Field>
          <Field label={t('form.persons')}>
            <NumberStepper
              value={form.watch('persons')}
              min={1}
              max={6}
              decreaseLabel={t('common.decrease')}
              increaseLabel={t('common.increase')}
              onChange={(value) => form.setValue('persons', value)}
            />
          </Field>
        </div>
        <Field label={t('form.name')} htmlFor="guest-name" error={form.formState.errors.guestName?.message}>
          <TextInput
            id="guest-name"
            data-autofocus
            placeholder={t('form.namePlaceholder')}
            autoComplete="name"
            {...form.register('guestName')}
          />
        </Field>
        <Field label={t('form.phone')} htmlFor="guest-phone" error={form.formState.errors.phone?.message}>
          <PhoneField
            id="guest-phone"
            prefix={form.watch('phonePrefix')}
            phone={form.watch('phone')}
            onPrefixChange={(value) => form.setValue('phonePrefix', value, { shouldValidate: true })}
            onPhoneChange={(value) => form.setValue('phone', value, { shouldValidate: true })}
          />
        </Field>
        <label className={s.check}>
          <input
            type="checkbox"
            checked={form.watch('registerCustomer')}
            onChange={(event) => form.setValue('registerCustomer', event.target.checked, { shouldValidate: true })}
          />
          {t('form.registerCustomer')}
        </label>
        <Field label={t('form.total')} htmlFor="guest-total">
          <div className={s.price}>
            <input id="guest-total" className={s.priceInput} inputMode="decimal" placeholder="0" {...form.register('total')} />
            <span>{mark}</span>
          </div>
        </Field>
        <Field label={t('form.notes')} htmlFor="guest-notes">
          <TextInput id="guest-notes" placeholder={t('form.notesPlaceholder')} {...form.register('notes')} />
        </Field>
        <p className={s.note}>
          <IconCheck />
          <Trans i18nKey="form.sourceNote" values={{ source: t(`source.${source}`) }} components={{ strong: <strong /> }} />
        </p>
      </form>
    </Modal>
  )
}