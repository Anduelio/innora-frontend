import { useId, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PAYMENT_METHODS, type PaymentKind, type PaymentMethod, type Reservation } from '@/types/domain'
import { useCurrentUser } from '@/lib/api/auth'
import { useRecordPayment } from '@/lib/api/reservations'
import { TODAY } from '@/lib/date/today'
import { centsToInput, currencyMark, eurosToCents, formatMoney } from '@/lib/format/money'
import { balanceCents } from '@/lib/reservation'
import { Button } from '@/components/atoms/Button/Button'
import { IconBank, IconCard, IconCash } from '@/components/atoms/Icon/icons'
import { TextInput } from '@/components/atoms/TextInput/TextInput'
import { DatePicker } from '@/components/molecules/DatePicker/DatePicker'
import { Field } from '@/components/molecules/Field/Field'
import { SegmentedControl } from '@/components/molecules/SegmentedControl/SegmentedControl'
import { useActionError } from '@/features/reservation/useStayActions'
import s from './PaymentForm.module.scss'
import { notify } from '@/lib/notify'

const methodIcons = { cash: <IconCash />, card: <IconCard />, bank_transfer: <IconBank /> }

export function PaymentForm({ reservation, onDone }: { reservation: Reservation; onDone?: () => void }) {
  const { t } = useTranslation()
  const id = useId()
  const record = useRecordPayment()
  const canRefund = useCurrentUser().can('payments.refund')
  const onError = useActionError()
  const due = balanceCents(reservation)
  const [kind, setKind] = useState<PaymentKind>('payment')
  const [amount, setAmount] = useState(() => (due > 0 ? centsToInput(due) : ''))
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [paidAt, setPaidAt] = useState(TODAY)
  const [touched, setTouched] = useState(false)
  const cents = eurosToCents(amount)
  const currency = reservation.currency

  const error =
    cents <= 0
      ? t('reservation.payment.amountRequired')
      : kind === 'payment' && cents > Math.max(due, 0)
        ? t('reservation.payment.tooMuch', { amount: formatMoney(Math.max(due, 0), currency) })
        : kind === 'refund' && cents > reservation.paidCents
          ? t('reservation.payment.refundTooLarge', { amount: formatMoney(reservation.paidCents, currency) })
          : ''

  return (
    <form
      className={s.form}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        setTouched(true)
        if (error) return
        record.mutate(
          { id: reservation.id, input: { kind, method, amountCents: cents, paidAt } },
          {
            onSuccess: () => {
              if (kind === 'refund') notify.info(t('toast.refundRecorded'), formatMoney(cents, currency))
              else notify.success(t('toast.paymentRecorded'), formatMoney(cents, currency))
              setTouched(false)
              setAmount('')
              onDone?.()
            },
            onError,
          },
        )
      }}
    >
      {reservation.paidCents > 0 && canRefund ? (
        <SegmentedControl<PaymentKind>
          label={t('reservation.payment.kind')}
          value={kind}
          onChange={setKind}
          block
          options={[
            { value: 'payment', label: t('pay.kinds.payment') },
            { value: 'refund', label: t('pay.kinds.refund') },
          ]}
        />
      ) : null}
      <div className={s.row}>
        <Field
          label={t('reservation.payment.amount')}
          htmlFor={`${id}-amount`}
          error={touched ? error : undefined}
          aside={
            kind === 'payment' && due > 0 && cents !== due ? (
              <button type="button" className={s.fill} onClick={() => setAmount(centsToInput(due))}>
                {t('reservation.payment.fill')}
              </button>
            ) : null
          }
        >
          <TextInput
            id={`${id}-amount`}
            inputMode="decimal"
            autoComplete="off"
            value={amount}
            invalid={touched && Boolean(error)}
            end={currencyMark(currency)}
            onChange={(event) => setAmount(event.target.value)}
          />
        </Field>
        <Field label={t('reservation.payment.date')} htmlFor={`${id}-date`}>
          <DatePicker
            id={`${id}-date`}
            label={t('reservation.payment.date')}
            value={paidAt}
            max={TODAY}
            onChange={setPaidAt}
            align="end"
          />
        </Field>
      </div>
      <Field label={t('reservation.payment.method')}>
        <SegmentedControl<PaymentMethod>
          label={t('reservation.payment.method')}
          value={method}
          onChange={setMethod}
          block
          options={PAYMENT_METHODS.map((item) => ({
            value: item,
            label: t(`pay.methods.${item}`),
            icon: methodIcons[item],
          }))}
        />
      </Field>
      <Button type="submit" variant="secondary" block loading={record.isPending}>
        {kind === 'refund' ? t('reservation.payment.submitRefund') : t('reservation.payment.submit')}
      </Button>
    </form>
  )
}
