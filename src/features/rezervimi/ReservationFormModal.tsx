import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trans, useTranslation } from 'react-i18next'
import { DESK_SOURCES, type Reservation, type ReservationSource, type Room } from '@/types/domain'
import { addDaysIso, fmtGjate } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { eurosToCents } from '@/lib/format/money'
import { errorText } from '@/lib/api/client'
import { useCreateReservation, useUpdateReservation } from '@/lib/api/reservations'
import { useRoomTypes } from '@/lib/api/rooms'
import { maxFreeNights } from '@/lib/stay'
import { useUiStore } from '@/store/uiStore'
import { IconArrive, IconCheck, IconDepart } from '@/components/icons'
import { Button } from '@/components/ui/Button/Button'
import { Field } from '@/components/ui/Field/Field'
import { Modal } from '@/components/ui/Modal/Modal'
import { NumberStepper } from '@/components/ui/NumberStepper/NumberStepper'
import { Dropdown } from '@/components/ui/Dropdown/Dropdown'
import { Textarea } from '@/components/ui/Textarea/Textarea'
import { TextInput } from '@/components/ui/TextInput/TextInput'
import {
  createReservationSchema,
  type ReservationFormValues,
} from '@/features/rezervimi/reservationSchema'
import { buildDefaults } from '@/features/rezervimi/form/defaults'
import s from './ReservationFormModal.module.scss'

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
  const create = useCreateReservation()
  const update = useUpdateReservation()
  const editing = modal?.mode === 'edit' ? reservations.find((item) => item.id === modal.reservationId) : undefined
  const months = t('calendar.months', { returnObjects: true }) as string[]

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(createReservationSchema(t('form.nameRequired'))),
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
          phone: values.phone.trim(),
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
          phone: values.phone.trim(),
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
            <Dropdown
              id="stay-source"
              label={t('form.origin')}
              value={form.watch('source')}
              options={DESK_SOURCES.map((item) => ({ value: item, label: t(`source.${item}`) }))}
              onChange={(value) => form.setValue('source', value as ReservationFormValues['source'], { shouldValidate: true })}
            />
          </Field>
        )}
        <Field label={t('form.room')} htmlFor="room-id">
          <Dropdown
            id="room-id"
            searchable
            label={t('form.room')}
            placeholder={t('room.unassigned')}
            searchPlaceholder={t('common.search')}
            emptyLabel={t('common.noResults')}
            value={form.watch('roomId')}
            options={[
              { value: '', label: t('room.unassigned') },
              ...rooms.map((room) => ({
                value: room.id,
                label: t('app.roomOption', {
                  id: room.id,
                  type: room.type,
                  persons: t('common.person', { count: room.capacity }),
                }),
              })),
            ]}
            onChange={(value) => form.setValue('roomId', value, { shouldValidate: true })}
          />
        </Field>
        {roomId ? null : (
          <Field label={t('room.typeLabel')} htmlFor="stay-type" error={form.formState.errors.roomTypeId?.message}>
            <Dropdown
              id="stay-type"
              searchable
              label={t('room.typeLabel')}
              placeholder={t('room.chooseType')}
              searchPlaceholder={t('common.search')}
              emptyLabel={t('common.noResults')}
              invalid={Boolean(form.formState.errors.roomTypeId)}
              value={form.watch('roomTypeId')}
              options={[
                { value: '', label: t('room.chooseType') },
                ...(roomTypes.data ?? []).map((type) => ({ value: String(type.id), label: type.name })),
              ]}
              onChange={(value) => form.setValue('roomTypeId', value, { shouldValidate: true })}
            />
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
        <div className={s.pair}>
          <Field label={t('form.phone')} htmlFor="guest-phone">
            <TextInput
              id="guest-phone"
              placeholder={t('form.phonePlaceholder')}
              autoComplete="tel"
              {...form.register('phone')}
            />
          </Field>
          <Field label={t('form.total')} htmlFor="guest-total">
            <div className={s.price}>
              <input id="guest-total" className={s.priceInput} inputMode="decimal" placeholder="0" {...form.register('total')} />
              <span>€</span>
            </div>
          </Field>
        </div>
        <Field label={t('form.notes')} htmlFor="guest-notes">
          <Textarea id="guest-notes" placeholder={t('form.notesPlaceholder')} {...form.register('notes')} />
        </Field>
        <p className={s.note}>
          <IconCheck />
          <Trans i18nKey="form.sourceNote" values={{ source: t(`source.${source}`) }} components={{ strong: <strong /> }} />
        </p>
      </form>
    </Modal>
  )
}