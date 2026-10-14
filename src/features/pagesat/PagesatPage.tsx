import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { useTranslation } from 'react-i18next'
import { PAYMENT_METHODS, type Payment, type PaymentMethod, type Reservation } from '@/types/domain'
import { usePayments } from '@/lib/api/hotel'
import { useHotelReservations } from '@/lib/api/reservations'
import { addDaysIso, fmtDate, fmtDayMonth, startOfMonthIso } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { balanceCents } from '@/lib/reservation'
import { useUiStore } from '@/store/uiStore'
import { Avatar } from '@/components/atoms/Avatar/Avatar'
import { Badge } from '@/components/atoms/Badge/Badge'
import { Button } from '@/components/atoms/Button/Button'
import { IconBank, IconCard, IconCash, IconWallet } from '@/components/atoms/Icon/icons'
import { Money } from '@/components/atoms/Money/Money'
import { Select } from '@/components/atoms/Select/Select'
import { Skeleton } from '@/components/atoms/Skeleton/Skeleton'
import { Card } from '@/components/molecules/Card/Card'
import { DatePicker } from '@/components/molecules/DatePicker/DatePicker'
import { EmptyState } from '@/components/molecules/EmptyState/EmptyState'
import { SegmentedControl } from '@/components/molecules/SegmentedControl/SegmentedControl'
import { StatTile } from '@/components/molecules/StatTile/StatTile'
import { Tabs, tabPanelProps } from '@/components/molecules/Tabs/Tabs'
import s from './PagesatPage.module.scss'

type View = 'open' | 'received'
type Preset = 'today' | 'week' | 'month'

const methodIcons = { cash: <IconCash />, card: <IconCard />, bank_transfer: <IconBank /> }

function presetRange(preset: Preset): { from: string; to: string } {
  if (preset === 'today') return { from: TODAY, to: TODAY }
  if (preset === 'week') return { from: addDaysIso(TODAY, -6), to: TODAY }
  return { from: startOfMonthIso(TODAY), to: TODAY }
}

function OpenRow({ item, onOpen }: { item: Reservation; onOpen: (id: string) => void }) {
  const { t } = useTranslation()
  return (
    <li className={s.openRow}>
      <Avatar name={item.guestName} size="sm" />
      <button type="button" className={s.openMain} onClick={() => onOpen(item.id)}>
        <span className={s.name}>{item.guestName}</span>
        <span className={s.sub}>
          {t('pagesat.stayLine', {
            room: item.roomId ? t('common.roomNumber', { room: item.roomId }) : t('room.unassignedShort'),
            dates: `${fmtDayMonth(item.checkIn)} → ${fmtDayMonth(item.checkOut)}`,
          })}
        </span>
      </button>
      <span className={s.amounts}>
        <Money cents={balanceCents(item)} currency={item.currency} tone="danger" strong />
        <span className={s.sub}>
          {t('reservation.paid')} <Money cents={item.paidCents} currency={item.currency} /> / <Money cents={item.totalCents} currency={item.currency} />
        </span>
      </span>
      <Button variant="secondary" onClick={() => onOpen(item.id)}>
        {t('pagesat.collect')}
      </Button>
    </li>
  )
}

function OpenBalances({ reservations, onOpen }: { reservations: Reservation[]; onOpen: (id: string) => void }) {
  const { t } = useTranslation()
  const groups = useMemo(() => {
    const open = reservations.filter(
      (item) => item.status !== 'CANCELLED' && item.status !== 'NO_SHOW' && balanceCents(item) > 0,
    )
    const totals = new Map<string, number>()
    for (const item of open) totals.set(item.currency, (totals.get(item.currency) ?? 0) + balanceCents(item))
    const sorted = open.toSorted((a, b) => a.checkOut.localeCompare(b.checkOut) || balanceCents(b) - balanceCents(a))
    return {
      totals: [...totals.entries()],
      sections: [
        { key: 'leavingToday', items: sorted.filter((item) => item.checkOut === TODAY && item.status === 'IN_HOUSE') },
        { key: 'inHouse', items: sorted.filter((item) => item.status === 'IN_HOUSE' && item.checkOut !== TODAY) },
        { key: 'later', items: sorted.filter((item) => item.status !== 'IN_HOUSE') },
      ].filter((section) => section.items.length > 0),
    }
  }, [reservations])

  if (groups.sections.length === 0) {
    return <EmptyState icon={<IconWallet />} title={t('pagesat.noOpen')} description={t('pagesat.noOpenHint')} />
  }

  return (
    <>
      <div className={s.tiles}>
        {groups.totals.map(([currency, cents]) => (
          <StatTile
            key={currency}
            label={t('pagesat.openTotal', { currency })}
            value={<Money cents={cents} currency={currency} />}
            icon={<IconWallet />}
            tone="warning"
          />
        ))}
      </div>
      {groups.sections.map((section) => (
        <Card key={section.key} title={t(`pagesat.${section.key}`)} actions={<span className={s.count}>{section.items.length}</span>} flush>
          <ul className={s.list}>
            {section.items.map((item) => (
              <OpenRow key={item.id} item={item} onOpen={onOpen} />
            ))}
          </ul>
        </Card>
      ))}
    </>
  )
}

function Received({ onOpen }: { onOpen: (id: string) => void }) {
  const { t } = useTranslation()
  const [preset, setPreset] = useState<Preset>('month')
  const [range, setRange] = useState(() => presetRange('month'))
  const [method, setMethod] = useState<PaymentMethod | ''>('')
  const payments = usePayments(range.from, range.to, method)

  const summary = useMemo(() => {
    const byCurrency = new Map<string, { net: number; methods: Map<PaymentMethod, number> }>()
    for (const payment of payments.data ?? []) {
      const signed = payment.kind === 'refund' ? -payment.amountCents : payment.amountCents
      const entry = byCurrency.get(payment.currency) ?? { net: 0, methods: new Map() }
      entry.net += signed
      entry.methods.set(payment.method, (entry.methods.get(payment.method) ?? 0) + signed)
      byCurrency.set(payment.currency, entry)
    }
    return [...byCurrency.entries()]
  }, [payments.data])

  const list: Payment[] = payments.data ?? []

  return (
    <>
      <div className={s.filters}>
        <SegmentedControl<Preset>
          label={t('pagesat.period')}
          value={preset}
          onChange={(value) => {
            setPreset(value)
            setRange(presetRange(value))
          }}
          options={(['today', 'week', 'month'] as const).map((value) => ({ value, label: t(`pagesat.presets.${value}`) }))}
        />
        <div className={s.range}>
          <DatePicker label={t('common.from')} value={range.from} max={range.to} onChange={(from) => setRange((current) => ({ ...current, from }))} />
          <DatePicker label={t('common.to')} value={range.to} min={range.from} max={TODAY} align="end" onChange={(to) => setRange((current) => ({ ...current, to }))} />
        </div>
        <Select aria-label={t('pagesat.method')} value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod | '')}>
          <option value="">{t('pagesat.anyMethod')}</option>
          {PAYMENT_METHODS.map((item) => (
            <option key={item} value={item}>
              {t(`pay.methods.${item}`)}
            </option>
          ))}
        </Select>
      </div>

      {payments.isLoading && !payments.data ? (
        <div className={s.skeletons}>
          <Skeleton height={96} />
          <Skeleton height={240} />
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon={<IconWallet />} title={t('pagesat.noPayments')} description={t('pagesat.noPaymentsHint')} />
      ) : (
        <>
          <div className={s.tiles}>
            {summary.map(([currency, entry]) => (
              <div key={currency} className={s.summary}>
                <StatTile label={t('pagesat.net', { currency })} value={<Money cents={entry.net} currency={currency} />} icon={<IconWallet />} tone="success" />
                <ul className={s.methods}>
                  {[...entry.methods.entries()].map(([key, cents]) => (
                    <li key={key}>
                      <span className={s.methodLabel}>
                        {methodIcons[key]}
                        {t(`pay.methods.${key}`)}
                      </span>
                      <Money cents={cents} currency={currency} strong />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <Card title={t('pagesat.received')} actions={<span className={s.count}>{list.length}</span>} flush>
            <table className={s.table}>
              <thead>
                <tr>
                  <th scope="col">{t('pagesat.columns.date')}</th>
                  <th scope="col">{t('pagesat.columns.guest')}</th>
                  <th scope="col">{t('pagesat.columns.method')}</th>
                  <th scope="col">{t('pagesat.columns.kind')}</th>
                  <th scope="col" className={s.right}>
                    {t('pagesat.columns.amount')}
                  </th>
                  <th scope="col" className={s.by}>
                    {t('pagesat.columns.by')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((payment) => (
                  <tr key={payment.id}>
                    <td className={s.nowrap}>{fmtDate(payment.paidAt)}</td>
                    <td>
                      <button type="button" className={s.link} onClick={() => onOpen(payment.reservationId)}>
                        {payment.guestName}
                      </button>
                    </td>
                    <td>
                      <span className={s.methodLabel}>
                        {methodIcons[payment.method]}
                        {t(`pay.methods.${payment.method}`)}
                      </span>
                    </td>
                    <td>
                      <Badge tone={payment.kind === 'refund' ? 'warning' : 'neutral'}>{t(`pay.kinds.${payment.kind}`)}</Badge>
                    </td>
                    <td className={s.right}>
                      <Money
                        cents={payment.kind === 'refund' ? -payment.amountCents : payment.amountCents}
                        currency={payment.currency}
                        tone={payment.kind === 'refund' ? 'danger' : undefined}
                        strong
                      />
                    </td>
                    <td className={s.by}>{payment.recordedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </>
  )
}

export function PagesatPage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const reservations = useHotelReservations()
  const openDrawer = useUiStore((state) => state.openDrawer)
  const view: View = params.get('pamja') === 'marra' ? 'received' : 'open'

  return (
    <div className={s.page}>
      <Tabs<View>
        idPrefix="pagesat"
        label={t('pagesat.tabs')}
        value={view}
        onChange={(value) => setParams(value === 'received' ? { pamja: 'marra' } : {}, { replace: true })}
        items={[
          { value: 'open', label: t('pagesat.open') },
          { value: 'received', label: t('pagesat.received') },
        ]}
      />
      <section {...tabPanelProps('pagesat', view)} className={s.panel}>
        <p className={s.lead}>{view === 'open' ? t('pagesat.openLead') : t('pagesat.receivedLead')}</p>
        {view === 'open' ? (
          reservations.isLoading && !reservations.data ? (
            <div className={s.skeletons}>
              <Skeleton height={96} />
              <Skeleton height={200} />
            </div>
          ) : reservations.isError ? (
            <EmptyState
              title={t('common.loadError')}
              description={t('common.loadErrorHint')}
              action={<Button onClick={() => void reservations.refetch()}>{t('common.retry')}</Button>}
            />
          ) : (
            <OpenBalances reservations={reservations.data ?? []} onOpen={openDrawer} />
          )
        ) : (
          <Received onOpen={openDrawer} />
        )}
      </section>
    </div>
  )
}
