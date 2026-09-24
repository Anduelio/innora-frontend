import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { errorText } from '@/lib/api/client'
import { useAmenities, useRoomTypes, useSaveRoomType } from '@/lib/api/rooms'
import { useUiStore } from '@/store/uiStore'
import { Button } from '@/components/ui/Button/Button'
import { Field } from '@/components/ui/Field/Field'
import { Modal } from '@/components/ui/Modal/Modal'
import { NumberStepper } from '@/components/ui/NumberStepper/NumberStepper'
import { Select } from '@/components/ui/Select/Select'
import { TextInput } from '@/components/ui/TextInput/TextInput'
import s from './RoomTypeModal.module.scss'

const bedCodes = ['single', 'double', 'queen', 'king', 'twin', 'sofa_bed', 'bunk', 'crib'] as const

export function RoomTypeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const types = useRoomTypes()
  const amenities = useAmenities()
  const save = useSaveRoomType()
  const showToast = useUiStore((state) => state.showToast)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [size, setSize] = useState('28')
  const [price, setPrice] = useState('80')
  const [adults, setAdults] = useState(2)
  const [children, setChildren] = useState(1)
  const [beds, setBeds] = useState<{ code: (typeof bedCodes)[number]; quantity: number }[]>([
    { code: 'king', quantity: 1 },
  ])
  const [picked, setPicked] = useState<string[]>(['wifi', 'tv', 'air_conditioning'])

  const toggle = (code: string) => {
    setPicked((current) => (current.includes(code) ? current.filter((item) => item !== code) : [...current, code]))
  }

  const submit = () => {
    const euros = Number(price.replace(',', '.'))
    save.mutate(
      {
        name: name.trim(),
        code: code.trim(),
        description,
        maxAdults: adults,
        maxChildren: children,
        maxOccupancy: adults + children,
        sizeM2: Number(size) || null,
        basePriceCents: Number.isFinite(euros) ? Math.round(euros * 100) : 0,
        beds,
        amenityCodes: picked,
      },
      {
        onSuccess: () => {
          showToast([t('room.typeSaved')])
          onClose()
        },
        onError: (error) => showToast([errorText(error, t('toast.failed'))]),
      },
    )
  }

  return (
    <Modal
      open={open}
      title={t('room.types')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={submit} disabled={!name.trim() || !code.trim() || save.isPending}>{t('common.save')}</Button>
        </>
      }
    >
      <div className={s.form}>
        {(types.data ?? []).length > 0 ? (
          <ul className={s.list}>
            {(types.data ?? []).map((type) => (
              <li key={type.id}>{type.name} · {type.code}</li>
            ))}
          </ul>
        ) : null}
        <h3>{t('room.sectionGeneral')}</h3>
        <Field label={t('room.typeName')} htmlFor="type-name">
          <TextInput id="type-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Dhomë Dyshe Deluxe" />
        </Field>
        <Field label={t('room.code')} htmlFor="type-code">
          <TextInput id="type-code" value={code} onChange={(event) => setCode(event.target.value)} placeholder="DBL-DLX" />
        </Field>
        <Field label={t('room.description')} htmlFor="type-description">
          <TextInput id="type-description" value={description} onChange={(event) => setDescription(event.target.value)} />
        </Field>
        <Field label={t('room.size')} htmlFor="type-size">
          <TextInput id="type-size" value={size} onChange={(event) => setSize(event.target.value)} />
        </Field>
        <h3>{t('room.sectionCapacity')}</h3>
        <Field label={t('room.adults')}>
          <NumberStepper value={adults} min={1} max={8} decreaseLabel={t('common.decrease')} increaseLabel={t('common.increase')} onChange={setAdults} />
        </Field>
        <Field label={t('room.children')}>
          <NumberStepper value={children} min={0} max={6} decreaseLabel={t('common.decrease')} increaseLabel={t('common.increase')} onChange={setChildren} />
        </Field>
        <p>{t('room.maximum', { count: adults + children })}</p>
        <h3>{t('room.sectionBeds')}</h3>
        {beds.map((row, index) => (
          <div key={index} className={s.bedRow}>
            <Select
              aria-label={t('room.bed')}
              value={row.code}
              onChange={(event) =>
                setBeds((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? { ...item, code: event.target.value as (typeof bedCodes)[number] } : item,
                  ),
                )
              }
            >
              {bedCodes.map((item) => (
                <option key={item} value={item}>{t(`bed.${item}`)}</option>
              ))}
            </Select>
            <NumberStepper
              value={row.quantity}
              min={1}
              max={4}
              decreaseLabel={t('common.decrease')}
              increaseLabel={t('common.increase')}
              onChange={(quantity) =>
                setBeds((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, quantity } : item)))
              }
            />
            {beds.length > 1 ? (
              <Button
                variant="secondary"
                onClick={() => setBeds((current) => current.filter((_, itemIndex) => itemIndex !== index))}
              >
                {t('room.removeBed')}
              </Button>
            ) : null}
          </div>
        ))}
        <Button variant="secondary" onClick={() => setBeds((current) => [...current, { code: 'sofa_bed', quantity: 1 }])}>
          {t('room.addBed')}
        </Button>
        <h3>{t('room.sectionAmenities')}</h3>
        <div className={s.amenities}>
          {(amenities.data ?? []).map((item) => (
            <label key={item.code}>
              <input type="checkbox" checked={picked.includes(item.code)} onChange={() => toggle(item.code)} />
              {t(`amenity.${item.code}`)}
            </label>
          ))}
        </div>
        <h3>{t('room.sectionPrice')}</h3>
        <Field label={t('room.price')} htmlFor="type-price">
          <TextInput id="type-price" value={price} onChange={(event) => setPrice(event.target.value)} />
        </Field>
        <h3>{t('room.sectionPhotos')}</h3>
        <p>{t('room.photosLater')}</p>
      </div>
    </Modal>
  )
}
