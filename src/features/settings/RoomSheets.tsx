import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Room, RoomTypeInfo } from '@/types/domain'
import { useSaveRoom, useSaveRoomType } from '@/lib/api/settings'
import { centsToInput, currencyMark, eurosToCents } from '@/lib/format/money'
import { Button } from '@/components/atoms/Button/Button'
import { Select } from '@/components/atoms/Select/Select'
import { TextInput } from '@/components/atoms/TextInput/TextInput'
import { Textarea } from '@/components/atoms/Textarea/Textarea'
import { Field } from '@/components/molecules/Field/Field'
import { NumberStepper } from '@/components/molecules/NumberStepper/NumberStepper'
import { Sheet } from '@/components/organisms/Sheet/Sheet'
import { useActionError } from '@/features/reservation/useStayActions'
import s from './Rooms.module.scss'
import { notify } from '@/lib/notify'

export function RoomTypeSheet({
  type,
  currency,
  onClose,
}: {
  type: RoomTypeInfo | null
  currency: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const save = useSaveRoomType()
  const onError = useActionError()
  const [name, setName] = useState(type?.name ?? '')
  const [code, setCode] = useState(type?.code ?? '')
  const [max, setMax] = useState(type?.maxOccupancy ?? 2)
  const [price, setPrice] = useState(type ? centsToInput(type.basePriceCents) : '60')
  const [submitted, setSubmitted] = useState(false)

  const priceCents = eurosToCents(price)
  const errors = {
    name: name.trim() ? '' : t('cilesimet.rooms.form.nameRequired'),
    code: /^[A-Za-z]{2,4}$/.test(code.trim()) ? '' : t('cilesimet.rooms.form.codeInvalid'),
    price: priceCents > 0 ? '' : t('cilesimet.rooms.form.priceInvalid'),
  }
  const valid = !errors.name && !errors.code && !errors.price

  const submit = () => {
    setSubmitted(true)
    if (!valid) return
    save.mutate(
      {
        id: type?.id,
        input: {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          maxOccupancy: max,
          basePriceCents: priceCents,
        },
      },
      {
        onSuccess: (saved) => {
          notify.success(
            t(type ? 'cilesimet.rooms.form.typeSaved' : 'cilesimet.rooms.form.typeCreated', {
              name: saved.name,
            }),
          )
          onClose()
        },
        onError,
      },
    )
  }

  return (
    <Sheet
      open
      title={type ? t('cilesimet.rooms.form.typeEdit', { name: type.name }) : t('cilesimet.rooms.form.typeNew')}
      description={t('cilesimet.rooms.form.typeHint')}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form={`${id}-form`} size="lg" loading={save.isPending}>
            {type ? t('cilesimet.saveChanges') : t('cilesimet.rooms.form.create')}
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
        <Field
          label={t('cilesimet.rooms.form.name')}
          htmlFor={`${id}-name`}
          error={submitted ? errors.name : undefined}
        >
          <TextInput
            id={`${id}-name`}
            data-autofocus
            value={name}
            placeholder={t('cilesimet.rooms.form.namePlaceholder')}
            invalid={submitted && Boolean(errors.name)}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field
          label={t('cilesimet.rooms.form.code')}
          htmlFor={`${id}-code`}
          hint={t('cilesimet.rooms.form.codeHint')}
          error={submitted ? errors.code : undefined}
        >
          <TextInput
            id={`${id}-code`}
            value={code}
            maxLength={4}
            placeholder="DBL"
            invalid={submitted && Boolean(errors.code)}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
          />
        </Field>
        <Field label={t('cilesimet.rooms.maxOccupancy')} htmlFor={`${id}-max`} hint={t('cilesimet.rooms.form.maxHint')}>
          <NumberStepper
            id={`${id}-max`}
            value={max}
            min={1}
            max={10}
            decreaseLabel={t('common.decrease')}
            increaseLabel={t('common.increase')}
            onChange={setMax}
          />
        </Field>
        <Field
          label={t('cilesimet.rooms.basePrice')}
          htmlFor={`${id}-price`}
          hint={t('cilesimet.rooms.form.priceHint')}
          error={submitted ? errors.price : undefined}
        >
          <TextInput
            id={`${id}-price`}
            inputMode="decimal"
            value={price}
            end={`${currencyMark(type?.currency ?? currency)}`}
            invalid={submitted && Boolean(errors.price)}
            onChange={(event) => setPrice(event.target.value)}
          />
        </Field>
      </form>
    </Sheet>
  )
}

export function RoomSheet({
  room,
  types,
  presetTypeId,
  onClose,
}: {
  room: Room | null
  types: RoomTypeInfo[]
  presetTypeId?: number
  onClose: () => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const save = useSaveRoom()
  const onError = useActionError()
  const [number, setNumber] = useState(room?.id ?? '')
  const [typeId, setTypeId] = useState(room?.roomTypeId ?? presetTypeId ?? types[0]?.id ?? 0)
  const [floor, setFloor] = useState(room?.floor ?? '')
  const [notes, setNotes] = useState(room?.notes ?? '')
  const [submitted, setSubmitted] = useState(false)

  const numberError = /^[A-Za-z0-9-]{1,6}$/.test(number.trim()) ? '' : t('cilesimet.rooms.form.numberInvalid')

  const submit = () => {
    setSubmitted(true)
    if (numberError) return
    save.mutate(
      {
        roomId: room?.id,
        input: { id: number.trim(), roomTypeId: typeId, floor: floor.trim(), notes: notes.trim() },
      },
      {
        onSuccess: (saved) => {
          notify.success(
            t(room ? 'cilesimet.rooms.form.roomSaved' : 'cilesimet.rooms.form.roomCreated', {
              room: saved.id,
            }),
          )
          onClose()
        },
        onError,
      },
    )
  }

  return (
    <Sheet
      open
      title={room ? t('cilesimet.rooms.form.roomEdit', { room: room.id }) : t('cilesimet.rooms.form.roomNew')}
      description={t('cilesimet.rooms.form.roomHint')}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form={`${id}-form`} size="lg" loading={save.isPending}>
            {room ? t('cilesimet.saveChanges') : t('cilesimet.rooms.form.createRoom')}
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
        <Field
          label={t('cilesimet.rooms.form.number')}
          htmlFor={`${id}-number`}
          hint={room ? t('cilesimet.rooms.form.numberLocked') : t('cilesimet.rooms.form.numberHint')}
          error={submitted ? numberError : undefined}
        >
          <TextInput
            id={`${id}-number`}
            data-autofocus={room ? undefined : true}
            value={number}
            disabled={Boolean(room)}
            maxLength={6}
            placeholder="205"
            invalid={submitted && Boolean(numberError)}
            onChange={(event) => setNumber(event.target.value)}
          />
        </Field>
        <Field label={t('cilesimet.rooms.form.type')} htmlFor={`${id}-type`}>
          <Select id={`${id}-type`} value={typeId} onChange={(event) => setTypeId(Number(event.target.value))}>
            {types.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name} ({type.code})
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('cilesimet.rooms.form.floor')} htmlFor={`${id}-floor`} optional>
          <TextInput
            id={`${id}-floor`}
            value={floor}
            maxLength={3}
            onChange={(event) => setFloor(event.target.value)}
          />
        </Field>
        <Field label={t('cilesimet.rooms.form.notes')} htmlFor={`${id}-notes`} optional>
          <Textarea
            id={`${id}-notes`}
            rows={3}
            value={notes}
            placeholder={t('cilesimet.rooms.form.notesPlaceholder')}
            onChange={(event) => setNotes(event.target.value)}
          />
        </Field>
      </form>
    </Sheet>
  )
}
