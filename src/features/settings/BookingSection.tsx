import { useId, useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import type { ChannelMapping, RoomTypeInfo, SyncStatus } from '@/types/domain'
import { useChannelMappings, useSyncStatus } from '@/lib/api/hotel'
import { useRoomTypes } from '@/lib/api/rooms'
import { useConnectChannel, useDisconnectChannel, useRunSync, useSaveMapping } from '@/lib/api/settings'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import { Badge, type BadgeTone } from '@/components/atoms/Badge/Badge'
import { Button } from '@/components/atoms/Button/Button'
import { DateText } from '@/components/atoms/DateText/DateText'
import {
  IconAlert,
  IconBooking,
  IconCheckCircle,
  IconCircle,
  IconClock,
  IconHome,
  IconPlug,
  IconRefresh,
} from '@/components/atoms/Icon/icons'
import { Select } from '@/components/atoms/Select/Select'
import { TextInput } from '@/components/atoms/TextInput/TextInput'
import { Alert } from '@/components/molecules/Alert/Alert'
import { Card } from '@/components/molecules/Card/Card'
import { DescriptionList } from '@/components/molecules/DescriptionList/DescriptionList'
import { EmptyState } from '@/components/molecules/EmptyState/EmptyState'
import { Field } from '@/components/molecules/Field/Field'
import { ConfirmDialog } from '@/components/organisms/ConfirmDialog/ConfirmDialog'
import { Sheet } from '@/components/organisms/Sheet/Sheet'
import { useActionError } from '@/features/reservation/useStayActions'
import { SectionShell } from './SectionShell'
import { SectionError, SectionLoading } from './SectionStates'
import { WIDE_QUERY } from './sections'
import page from './SectionShell.module.scss'
import s from './Booking.module.scss'
import { notify, notifyPromise } from '@/lib/notify'
import { describeError } from '@/lib/describeError'

type Owner = 'app' | 'booking'

/** Dhomat dhe planet që do t'i ofronte Booking.com përmes Beds24 (version prove). */
const EXTERNAL_ROOMS = [
  { id: '1001', label: '1001 · Double Room' },
  { id: '1002', label: '1002 · Single Room' },
  { id: '1003', label: '1003 · Family Room' },
  { id: '1004', label: '1004 · Suite' },
  { id: '1005', label: '1005 · Deluxe Double' },
]
const EXTERNAL_RATES = [
  { id: 'RP-FLEX', label: 'RP-FLEX · Standard (anulim falas)' },
  { id: 'RP-NR', label: 'RP-NR · Pa rimbursim' },
]

const RULES: { key: 'availability' | 'reservations' | 'prices' | 'assignment'; owner: Owner }[] = [
  { key: 'availability', owner: 'app' },
  { key: 'reservations', owner: 'booking' },
  { key: 'prices', owner: 'booking' },
  { key: 'assignment', owner: 'app' },
]

const ownerIcons: Record<Owner, ReactNode> = {
  app: <IconHome size={16} />,
  booking: <IconBooking size={16} />,
}

type StepKey = 'account' | 'extranet' | 'mapping' | 'import' | 'approval'

function connectionBadge(status: SyncStatus): {
  tone: BadgeTone
  icon: ReactNode
  labelKey: string
} {
  if (!status.connected)
    return {
      tone: 'warning',
      icon: <IconAlert size={16} />,
      labelKey: 'cilesimet.booking.notConnected',
    }
  if (status.level === 'problem') return { tone: 'danger', icon: <IconAlert size={16} />, labelKey: 'sync.problem' }
  if (status.level === 'pending') return { tone: 'info', icon: <IconClock size={16} />, labelKey: 'sync.pending' }
  return {
    tone: 'success',
    icon: <IconCheckCircle size={16} />,
    labelKey: 'cilesimet.booking.connected',
  }
}

function isMapped(mapping: ChannelMapping | undefined): boolean {
  return Boolean(mapping?.externalRoomId && mapping.externalRatePlanId)
}

function Timestamp({ iso }: { iso: string | null }) {
  const { t } = useTranslation()
  if (!iso) return <>{t('cilesimet.booking.never')}</>
  return (
    <>
      <DateText iso={iso} /> {iso.slice(11, 16)}
    </>
  )
}

function ConnectSheet({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const id = useId()
  const connect = useConnectChannel()
  const [account, setAccount] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const error = account.trim().length >= 4 ? '' : t('cilesimet.booking.connectForm.accountInvalid')

  const submit = () => {
    setSubmitted(true)
    if (error) return
    void notifyPromise(connect.mutateAsync(account.trim()), {
      loading: t('cilesimet.booking.connecting'),
      success: {
        title: t('cilesimet.booking.connectForm.done'),
        description: t('cilesimet.booking.connectForm.doneHint'),
      },
      error: describeError(t),
    }).then((ok) => {
      if (ok) onClose()
    })
  }

  return (
    <Sheet
      open
      title={t('cilesimet.booking.connectForm.title')}
      description={t('cilesimet.booking.connectForm.hint')}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form={`${id}-form`} size="lg" icon={<IconPlug />} loading={connect.isPending}>
            {t('cilesimet.booking.connect')}
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
          label={t('cilesimet.booking.connectForm.account')}
          htmlFor={`${id}-account`}
          hint={t('cilesimet.booking.connectForm.accountHint')}
          error={submitted ? error : undefined}
        >
          <TextInput
            id={`${id}-account`}
            data-autofocus
            value={account}
            placeholder="BDS-12345"
            invalid={submitted && Boolean(error)}
            onChange={(event) => setAccount(event.target.value)}
          />
        </Field>
        <Alert tone="info" title={t('cilesimet.booking.demoTitle')}>
          {t('cilesimet.booking.demoText')}
        </Alert>
      </form>
    </Sheet>
  )
}

function ConnectionCard({ status, allMapped }: { status: SyncStatus; allMapped: boolean }) {
  const { t } = useTranslation()
  const wide = useMediaQuery(WIDE_QUERY)
  const badge = connectionBadge(status)
  const disconnect = useDisconnectChannel()
  const run = useRunSync()
  const onError = useActionError()
  const [connecting, setConnecting] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const sync = () =>
    void notifyPromise(run.mutateAsync(), {
      loading: t('cilesimet.booking.syncing'),
      success: { title: t('cilesimet.booking.synced'), description: t('cilesimet.booking.syncedHint') },
      error: describeError(t),
    })

  const unplug = () =>
    disconnect.mutate(undefined, {
      onSuccess: () => {
        setConfirming(false)
        notify.warning(t('cilesimet.booking.disconnected'))
      },
      onError,
    })

  return (
    <Card
      title={t('cilesimet.booking.statusTitle')}
      description={t('cilesimet.booking.statusDescription')}
      icon={<IconBooking />}
      actions={
        <Badge tone={badge.tone} icon={badge.icon}>
          {t(badge.labelKey)}
        </Badge>
      }
    >
      <div className={page.content}>
        <p className={s.lead}>{status.connected ? t('sync.connectedDetail') : t('sync.notConnectedDetail')}</p>
        <DescriptionList
          columns={wide ? 3 : 1}
          items={[
            {
              label: t('cilesimet.booking.channel'),
              value: t('cilesimet.booking.channelValue', { provider: status.provider }),
            },
            { label: t('cilesimet.booking.account'), value: status.accountId ?? '—' },
            { label: t('sync.lastIn'), value: <Timestamp iso={status.lastInboundAt} /> },
            { label: t('sync.lastOut'), value: <Timestamp iso={status.lastOutboundAt} /> },
          ]}
        />
        {status.connected && status.openIssues.length > 0 ? (
          <div>
            <h3 className={s.subheading}>{t('cilesimet.booking.issuesTitle')}</h3>
            <ul className={s.issues}>
              {status.openIssues.map((issue) => (
                <li key={issue.id} className={s.issue}>
                  <Badge tone="warning" icon={<IconAlert size={16} />}>
                    {t(`cilesimet.booking.issueTypes.${issue.type}`)}
                  </Badge>
                  <span>{issue.subject}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className={s.buttons}>
          {status.connected ? (
            <>
              <Button icon={<IconRefresh />} disabled={!allMapped} loading={run.isPending} onClick={sync}>
                {t('cilesimet.booking.syncNow')}
              </Button>
              <Button variant="secondary" onClick={() => setConfirming(true)}>
                {t('cilesimet.booking.disconnect')}
              </Button>
              {allMapped ? null : <span className={s.hint}>{t('cilesimet.booking.syncNeedsMapping')}</span>}
            </>
          ) : (
            <Button icon={<IconPlug />} onClick={() => setConnecting(true)}>
              {t('cilesimet.booking.connect')}
            </Button>
          )}
        </div>
      </div>
      {connecting ? <ConnectSheet onClose={() => setConnecting(false)} /> : null}
      <ConfirmDialog
        open={confirming}
        title={t('cilesimet.booking.disconnectTitle')}
        confirmLabel={t('cilesimet.booking.disconnect')}
        tone="danger"
        pending={disconnect.isPending}
        onConfirm={unplug}
        onClose={() => setConfirming(false)}
      >
        <p>{t('cilesimet.booking.disconnectText')}</p>
      </ConfirmDialog>
    </Card>
  )
}

function MappingRow({
  type,
  mapping,
  connected,
}: {
  type: RoomTypeInfo
  mapping: ChannelMapping | undefined
  connected: boolean
}) {
  const { t } = useTranslation()
  const save = useSaveMapping()
  const onError = useActionError()
  const mapped = isMapped(mapping)
  const room = mapping?.externalRoomId ?? ''
  const rate = mapping?.externalRatePlanId ?? ''

  const update = (next: { externalRoomId: string | null; externalRatePlanId: string | null }) =>
    save.mutate(
      { roomTypeId: type.id, input: next },
      {
        onSuccess: (saved) => {
          if (isMapped(saved)) notify.success(t('cilesimet.booking.mappingSaved', { name: type.name }))
        },
        onError,
      },
    )

  return (
    <tr>
      <th scope="row" className={s.typeCell}>
        {type.name}
        <span className={s.typeCode}>{type.code}</span>
      </th>
      <td data-label={t('cilesimet.booking.externalRoom')}>
        <Select
          aria-label={`${t('cilesimet.booking.externalRoom')}: ${type.name}`}
          value={room}
          disabled={!connected || save.isPending}
          onChange={(event) => update({ externalRoomId: event.target.value || null, externalRatePlanId: rate || null })}
        >
          <option value="">{t('cilesimet.booking.choose')}</option>
          {EXTERNAL_ROOMS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>
      </td>
      <td data-label={t('cilesimet.booking.externalRate')}>
        <Select
          aria-label={`${t('cilesimet.booking.externalRate')}: ${type.name}`}
          value={rate}
          disabled={!connected || save.isPending}
          onChange={(event) => update({ externalRoomId: room || null, externalRatePlanId: event.target.value || null })}
        >
          <option value="">{t('cilesimet.booking.choose')}</option>
          {EXTERNAL_RATES.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>
      </td>
      <td data-label={t('cilesimet.booking.mappingState')}>
        {mapped ? (
          <Badge tone="success" icon={<IconCheckCircle size={16} />}>
            {t('cilesimet.booking.mapped')}
          </Badge>
        ) : (
          <Badge tone="warning" icon={<IconCircle size={16} />}>
            {t('cilesimet.booking.unmapped')}
          </Badge>
        )}
      </td>
    </tr>
  )
}

function MappingCard({
  types,
  mappingByType,
  connected,
}: {
  types: RoomTypeInfo[]
  mappingByType: Map<number, ChannelMapping>
  connected: boolean
}) {
  const { t } = useTranslation()
  return (
    <Card
      title={t('cilesimet.booking.mappingTitle')}
      description={connected ? t('cilesimet.booking.mappingDescription') : t('cilesimet.booking.mappingLocked')}
      flush
    >
      {types.length === 0 ? (
        <EmptyState title={t('cilesimet.booking.mappingEmpty')} compact />
      ) : (
        <table className={s.table}>
          <caption className={s.caption}>{t('cilesimet.booking.mappingCaption')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('cilesimet.booking.ourType')}</th>
              <th scope="col">{t('cilesimet.booking.externalRoom')}</th>
              <th scope="col">{t('cilesimet.booking.externalRate')}</th>
              <th scope="col">{t('cilesimet.booking.mappingState')}</th>
            </tr>
          </thead>
          <tbody>
            {types.map((type) => (
              <MappingRow key={type.id} type={type} mapping={mappingByType.get(type.id)} connected={connected} />
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}

function RulesCard() {
  const { t } = useTranslation()
  return (
    <Card title={t('cilesimet.booking.rulesTitle')} description={t('cilesimet.booking.rulesDescription')}>
      <ul className={s.rules}>
        {RULES.map((rule) => (
          <li key={rule.key} className={s.rule}>
            <div className={s.ruleHead}>
              <h3 className={s.ruleTitle}>{t(`cilesimet.booking.rules.${rule.key}.title`)}</h3>
              <Badge tone={rule.owner === 'app' ? 'info' : 'neutral'} icon={ownerIcons[rule.owner]}>
                {rule.owner === 'app' ? t('cilesimet.booking.ownerApp') : t('cilesimet.booking.ownerBooking')}
              </Badge>
            </div>
            <p className={s.lead}>{t(`cilesimet.booking.rules.${rule.key}.text`)}</p>
          </li>
        ))}
      </ul>
    </Card>
  )
}

function ChecklistCard({ steps }: { steps: { key: StepKey; done: boolean }[] }) {
  const { t } = useTranslation()
  const done = steps.filter((step) => step.done).length
  return (
    <Card
      title={t('cilesimet.booking.checklistTitle')}
      description={t('cilesimet.booking.checklistDescription')}
      actions={
        <Badge tone={done === steps.length ? 'success' : 'neutral'}>
          {t('cilesimet.booking.progress', { done, total: steps.length })}
        </Badge>
      }
    >
      <ol className={s.steps}>
        {steps.map((step, index) => (
          <li key={step.key} className={clsx(s.step, step.done && s.stepDone)}>
            <span className={s.stepNumber} aria-hidden="true">
              {index + 1}
            </span>
            <span className={s.stepText}>{t(`cilesimet.booking.steps.${step.key}`)}</span>
            {step.done ? (
              <Badge tone="success" icon={<IconCheckCircle size={16} />}>
                {t('cilesimet.booking.stepDone')}
              </Badge>
            ) : (
              <Badge tone="neutral" icon={<IconCircle size={16} />}>
                {t('cilesimet.booking.stepTodo')}
              </Badge>
            )}
          </li>
        ))}
      </ol>
    </Card>
  )
}

export function BookingSection() {
  const { t } = useTranslation()
  const status = useSyncStatus()
  const mappings = useChannelMappings()
  const types = useRoomTypes()
  const title = t('cilesimet.sections.booking')

  const mappingByType = useMemo(
    () => new Map((mappings.data ?? []).map((mapping) => [mapping.roomTypeId, mapping])),
    [mappings.data],
  )

  const connected = status.data?.connected ?? false
  const allMapped = useMemo(
    () => Boolean(types.data?.length) && (types.data ?? []).every((type) => isMapped(mappingByType.get(type.id))),
    [types.data, mappingByType],
  )
  const imported = status.data?.lastInboundAt != null
  const steps = useMemo<{ key: StepKey; done: boolean }[]>(
    () => [
      { key: 'account', done: connected },
      { key: 'extranet', done: connected },
      { key: 'mapping', done: connected && allMapped },
      { key: 'import', done: imported },
      { key: 'approval', done: false },
    ],
    [connected, allMapped, imported],
  )

  return (
    <SectionShell section="booking">
      {status.isPending || mappings.isPending || types.isPending ? (
        <SectionLoading title={title} rows={6} />
      ) : status.isError || mappings.isError || types.isError ? (
        <SectionError
          title={title}
          onRetry={() => {
            if (status.isError) void status.refetch()
            if (mappings.isError) void mappings.refetch()
            if (types.isError) void types.refetch()
          }}
        />
      ) : (
        <>
          <Alert tone="info" title={t('cilesimet.booking.demoTitle')}>
            {t('cilesimet.booking.demoText')}
          </Alert>
          <ConnectionCard status={status.data} allMapped={allMapped} />
          <MappingCard types={types.data} mappingByType={mappingByType} connected={connected} />
          <RulesCard />
          <ChecklistCard steps={steps} />
        </>
      )}
    </SectionShell>
  )
}
