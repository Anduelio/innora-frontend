import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMe } from '@/lib/api/auth'
import { errorText } from '@/lib/api/client'
import { useAddCharge, useAddPayment, useChargeCategories, useFolio, useVoidCharge } from '@/lib/api/folios'
import { formatEuro } from '@/lib/format/money'
import { useUiStore } from '@/store/uiStore'
import { Button } from '@/components/ui/Button/Button'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import { Field } from '@/components/ui/Field/Field'
import { Select } from '@/components/ui/Select/Select'
import { TextInput } from '@/components/ui/TextInput/TextInput'
import s from './FolioDrawer.module.scss'

const methods = ['cash', 'card', 'bank_transfer', 'online', 'other'] as const

export function FolioDrawer() {
  const { t } = useTranslation()
  const me = useMe()
  const canVoid = (me.data?.permissions ?? []).includes('folios.void_charge')
  const folioId = useUiStore((state) => state.folioId)
  const closeFolio = useUiStore((state) => state.closeFolio)
  const showToast = useUiStore((state) => state.showToast)
  const folio = useFolio(folioId)
  const categories = useChargeCategories()
  const addCharge = useAddCharge(folioId ?? 0, folio.data?.reservationId)
  const addPayment = useAddPayment(folioId ?? 0, folio.data?.reservationId)
  const voidCharge = useVoidCharge(folioId ?? 0, folio.data?.reservationId)

  const [panel, setPanel] = useState<'none' | 'charge' | 'payment'>('none')
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState('')
  const [method, setMethod] = useState('cash')
  const [amount, setAmount] = useState('')

  const open = folio.data
  const activeItems = useMemo(() => open?.items.filter((item) => !item.voidedAt) ?? [], [open])
  const activePayments = useMemo(() => open?.payments.filter((item) => !item.voidedAt) ?? [], [open])
  const extras = useMemo(() => (categories.data ?? []).filter((item) => !item.isRoom), [categories.data])

  if (!folioId) return null

  const unitCents = Math.round(Number(unit.replace(',', '.')) * 100)
  const amountCents = Math.round(Number(amount.replace(',', '.')) * 100)

  return (
    <Drawer open={folioId !== null} onClose={closeFolio} title={open ? `${t('folio.title')} #${open.number}` : t('folio.title')}>
      {open ? (
        <div className={s.body}>
          <p className={s.guest}>
            {open.guestName}
            {open.roomId ? ` · ${t('common.room')} ${open.roomId}` : ''}
          </p>
          <p className={s.dates}>
            {open.checkIn} → {open.checkOut}
          </p>

          <h3>{t('folio.charges')}</h3>
          <ul className={s.list}>
            {activeItems.map((item) => (
              <li key={item.id}>
                <div>
                  <span className={s.date}>{item.serviceDate}</span>
                  <strong>{item.description}</strong>
                </div>
                <div className={s.right}>
                  <span>{formatEuro(item.amountCents)}</span>
                  {open.status === 'open' && !item.isRoomCharge && canVoid ? (
                    <button
                      type="button"
                      className={s.link}
                      onClick={() => {
                        const reason = window.prompt(t('folio.voidReason'))
                        if (!reason) return
                        voidCharge.mutate(
                          { id: item.id, reason },
                          {
                            onSuccess: () => showToast([t('folio.chargeVoided')]),
                            onError: (error) => showToast([errorText(error, t('toast.failed'))]),
                          },
                        )
                      }}
                    >
                      {t('folio.void')}
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>

          <dl className={s.totals}>
            <div>
              <dt>{t('folio.total')}</dt>
              <dd>{formatEuro(open.chargesCents)}</dd>
            </div>
            <div>
              <dt>{t('folio.paid')}</dt>
              <dd>{formatEuro(open.paymentsCents)}</dd>
            </div>
            <div>
              <dt>{t('folio.due')}</dt>
              <dd className={open.balanceCents > 0 ? s.due : undefined}>{formatEuro(open.balanceCents)}</dd>
            </div>
          </dl>

          <h3>{t('folio.payments')}</h3>
          <ul className={s.list}>
            {activePayments.map((payment) => (
              <li key={payment.id}>
                <div>
                  <span className={s.date}>{payment.paidAt.slice(0, 10)}</span>
                  <strong>{t(`folio.methods.${payment.method}`, { defaultValue: payment.method })}</strong>
                </div>
                <span>{formatEuro(payment.amountCents)}</span>
              </li>
            ))}
          </ul>

          {open.status === 'open' ? (
            <div className={s.actions}>
              <Button variant="secondary" onClick={() => setPanel(panel === 'charge' ? 'none' : 'charge')}>
                {t('folio.addCharge')}
              </Button>
              <Button onClick={() => setPanel(panel === 'payment' ? 'none' : 'payment')}>{t('folio.addPayment')}</Button>
            </div>
          ) : null}

          {panel === 'charge' ? (
            <div className={s.form}>
              <Field label={t('folio.category')} htmlFor="folio-category">
                <Select
                  id="folio-category"
                  value={categoryId}
                  onChange={(event) => {
                    setCategoryId(event.target.value)
                    const selected = extras.find((item) => String(item.id) === event.target.value)
                    if (selected) setDescription(selected.name)
                  }}
                >
                  <option value="">{t('folio.chooseCategory')}</option>
                  {extras.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </Select>
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
                    {
                      chargeCategoryId: Number(categoryId),
                      description,
                      quantity: Number(quantity) || 1,
                      unitCents,
                    },
                    {
                      onSuccess: () => {
                        setPanel('none')
                        setUnit('')
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
          ) : null}

          {panel === 'payment' ? (
            <div className={s.form}>
              <Field label={t('folio.method')} htmlFor="folio-method">
                <Select id="folio-method" value={method} onChange={(event) => setMethod(event.target.value)}>
                  {methods.map((item) => (
                    <option key={item} value={item}>
                      {t(`folio.methods.${item}`)}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={t('folio.amount')} htmlFor="folio-amount">
                <TextInput id="folio-amount" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="100" />
              </Field>
              <Button
                disabled={addPayment.isPending}
                onClick={() =>
                  addPayment.mutate(
                    { method, amountCents },
                    {
                      onSuccess: () => {
                        setPanel('none')
                        setAmount('')
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
          ) : null}
        </div>
      ) : null}
    </Drawer>
  )
}
