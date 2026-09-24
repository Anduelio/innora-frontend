import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMe } from '@/lib/api/auth'
import { errorText } from '@/lib/api/client'
import { useChargeCategories, useFolio, useVoidCharge } from '@/lib/api/folios'
import { useMoney } from '@/lib/format/useMoney'
import { useUiStore } from '@/store/uiStore'
import { Button } from '@/components/ui/Button/Button'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import { ChargeForm } from '@/features/folio/ChargeForm'
import { PaymentForm } from '@/features/folio/PaymentForm'
import s from './FolioDrawer.module.scss'

export function FolioDrawer() {
  const { t } = useTranslation()
  const money = useMoney()
  const me = useMe()
  const canVoid = (me.data?.permissions ?? []).includes('folios.void_charge')
  const folioId = useUiStore((state) => state.folioId)
  const closeFolio = useUiStore((state) => state.closeFolio)
  const showToast = useUiStore((state) => state.showToast)
  const folio = useFolio(folioId)
  const categories = useChargeCategories()
  const voidCharge = useVoidCharge(folioId ?? 0, folio.data?.reservationId)
  const [panel, setPanel] = useState<'none' | 'charge' | 'payment'>('none')

  const open = folio.data
  const activeItems = useMemo(() => open?.items.filter((item) => !item.voidedAt) ?? [], [open])
  const activePayments = useMemo(() => open?.payments.filter((item) => !item.voidedAt) ?? [], [open])
  const extras = useMemo(() => (categories.data ?? []).filter((item) => !item.isRoom), [categories.data])

  if (!folioId) return null

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
                  <span>{money(item.amountCents, open.currency)}</span>
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
              <dd>{money(open.chargesCents, open.currency)}</dd>
            </div>
            <div>
              <dt>{t('folio.paid')}</dt>
              <dd>{money(open.paymentsCents, open.currency)}</dd>
            </div>
            <div>
              <dt>{t('folio.due')}</dt>
              <dd className={open.balanceCents > 0 ? s.due : undefined}>{money(open.balanceCents, open.currency)}</dd>
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
                <span>{money(payment.amountCents, open.currency)}</span>
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
            <ChargeForm folioId={folioId} reservationId={open.reservationId} extras={extras} onDone={() => setPanel('none')} />
          ) : null}
          {panel === 'payment' ? (
            <PaymentForm folioId={folioId} reservationId={open.reservationId} onDone={() => setPanel('none')} />
          ) : null}
        </div>
      ) : null}
    </Drawer>
  )
}
