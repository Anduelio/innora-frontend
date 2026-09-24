import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { errorText } from '@/lib/api/client'
import { useAddPayment } from '@/lib/api/folios'
import { useUiStore } from '@/store/uiStore'
import { Button } from '@/components/ui/Button/Button'
import { Field } from '@/components/ui/Field/Field'
import { RadioGroup } from '@/components/ui/RadioGroup/RadioGroup'
import { TextInput } from '@/components/ui/TextInput/TextInput'
import s from './FolioDrawer.module.scss'

const methods = ['cash', 'card', 'bank_transfer', 'online', 'other'] as const

export function PaymentForm({
  folioId,
  reservationId,
  onDone,
}: {
  folioId: number
  reservationId: string | undefined
  onDone: () => void
}) {
  const { t } = useTranslation()
  const showToast = useUiStore((state) => state.showToast)
  const addPayment = useAddPayment(folioId, reservationId)
  const [method, setMethod] = useState('cash')
  const [amount, setAmount] = useState('')
  const amountCents = Math.round(Number(amount.replace(',', '.')) * 100)

  return (
    <div className={s.form}>
      <Field label={t('folio.method')}>
        <RadioGroup
          name="folio-method"
          label={t('folio.method')}
          value={method}
          options={methods.map((item) => ({ value: item, label: t(`folio.methods.${item}`) }))}
          onChange={setMethod}
        />
      </Field>
      <Field label={t('folio.amount')} htmlFor="folio-amount">
        <TextInput id="folio-amount" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="100" />
      </Field>
      <Button
        spaced
        disabled={addPayment.isPending}
        onClick={() =>
          addPayment.mutate(
            { method, amountCents },
            {
              onSuccess: () => {
                onDone()
                showToast([t('folio.paymentAdded')])
              },
              onError: (error) => showToast([errorText(error, t('toast.failed'))]),
            },
          )
        }
      >
        {t('folio.recordPayment')}
      </Button>
    </div>
  )
}
