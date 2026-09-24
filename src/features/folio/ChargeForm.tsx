import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { errorText } from '@/lib/api/client'
import { useAddCharge } from '@/lib/api/folios'
import { useUiStore } from '@/store/uiStore'
import { Button } from '@/components/ui/Button/Button'
import { Field } from '@/components/ui/Field/Field'
import { Dropdown } from '@/components/ui/Dropdown/Dropdown'
import { TextInput } from '@/components/ui/TextInput/TextInput'
import s from './FolioDrawer.module.scss'

export function ChargeForm({
  folioId,
  reservationId,
  extras,
  onDone,
}: {
  folioId: number
  reservationId: string | undefined
  extras: { id: number; name: string }[]
  onDone: () => void
}) {
  const { t } = useTranslation()
  const showToast = useUiStore((state) => state.showToast)
  const addCharge = useAddCharge(folioId, reservationId)
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState('')
  const unitCents = Math.round(Number(unit.replace(',', '.')) * 100)

  return (
    <div className={s.form}>
      <Field label={t('folio.category')} htmlFor="folio-category">
        <Dropdown
          id="folio-category"
          searchable
          label={t('folio.category')}
          placeholder={t('folio.chooseCategory')}
          searchPlaceholder={t('common.search')}
          emptyLabel={t('common.noResults')}
          value={categoryId}
          options={extras.map((item) => ({ value: String(item.id), label: item.name }))}
          onChange={(value) => {
            setCategoryId(value)
            const selected = extras.find((item) => String(item.id) === value)
            if (selected) setDescription(selected.name)
          }}
        />
      </Field>
      <Field label={t('folio.description')} htmlFor="folio-description">
        <TextInput id="folio-description" value={description} onChange={(event) => setDescription(event.target.value)} />
      </Field>
      <Field label={t('folio.quantity')} htmlFor="folio-qty">
        <TextInput id="folio-qty" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
      </Field>
      <Field label={t('folio.unitPrice')} htmlFor="folio-unit">
        <TextInput id="folio-unit" value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="15" />
      </Field>
      <Button
        disabled={addCharge.isPending}
        onClick={() =>
          addCharge.mutate(
            { chargeCategoryId: Number(categoryId), description, quantity: Number(quantity) || 1, unitCents },
            {
              onSuccess: () => {
                onDone()
                showToast([t('folio.chargeAdded')])
              },
              onError: (error) => showToast([errorText(error, t('toast.failed'))]),
            },
          )
        }
      >
        {t('folio.add')}
      </Button>
    </div>
  )
}
