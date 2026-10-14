import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { Badge, type BadgeTone } from '@/components/atoms/Badge/Badge'
import { DateText } from '@/components/atoms/DateText/DateText'
import {
  IconAlert,
  IconBooking,
  IconCheckCircle,
  IconCircle,
  IconClock,
  IconExternal,
  IconHome,
} from '@/components/atoms/Icon/icons'
import { Card } from '@/components/molecules/Card/Card'
import { DescriptionList } from '@/components/molecules/DescriptionList/DescriptionList'
import { EmptyState } from '@/components/molecules/EmptyState/EmptyState'
import { useChannelMappings, useSyncStatus } from '@/lib/api/hotel'
import { useRoomTypes } from '@/lib/api/rooms'
import { useMediaQuery } from '@/lib/hooks/useMediaQuery'
import type { ChannelMapping, RoomTypeInfo, SyncStatus } from '@/types/domain'
import { WIDE_QUERY } from './sections'
import { DisabledAction, SectionError, SectionLoading } from './SectionStates'
import page from './CilesimetPage.module.scss'
import s from './Booking.module.scss'

type Owner = 'app' | 'booking'

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

function connectionBadge(status: SyncStatus): { tone: BadgeTone; icon: ReactNode; labelKey: string } {
  if (!status.connected) return { tone: 'warning', icon: <IconAlert size={16} />, labelKey: 'cilesimet.booking.notConnected' }
  if (status.level === 'problem') return { tone: 'danger', icon: <IconAlert size={16} />, labelKey: 'sync.problem' }
  if (status.level === 'pending') return { tone: 'info', icon: <IconClock size={16} />, labelKey: 'sync.pending' }
  return { tone: 'success', icon: <IconCheckCircle size={16} />, labelKey: 'cilesimet.booking.connected' }
}

function isMapped(mapping: ChannelMapping | undefined): boolean {
  return Boolean(mapping?.isActive && mapping.externalRoomId && mapping.externalRatePlanId)
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

function ConnectionCard({ status }: { status: SyncStatus }) {
  const { t } = useTranslation()
  const wide = useMediaQuery(WIDE_QUERY)
  const badge = connectionBadge(status)
  return (
    <Card
      title={t('cilesimet.sections.booking')}
      description={t('cilesimet.booking.statusDescription')}
      icon={<IconBooking />}
      actions={
        <Badge tone={badge.tone} icon={badge.icon}>
          {t(badge.labelKey)}
        </Badge>
      }
    >
      <div className={page.stack}>
        <p className={page.text}>{status.connected ? t('sync.connectedDetail') : t('sync.notConnectedDetail')}</p>
        <DescriptionList
          columns={wide ? 3 : 1}
          items={[
            { label: t('cilesimet.booking.channel'), value: t('cilesimet.booking.channelValue', { provider: status.provider }) },
            { label: t('sync.lastIn'), value: <Timestamp iso={status.lastInboundAt} /> },
            { label: t('sync.lastOut'), value: <Timestamp iso={status.lastOutboundAt} /> },
          ]}
        />
        {status.openIssues.length > 0 ? (
          <div>
            <h3 className={page.subheading}>{t('cilesimet.booking.issuesTitle')}</h3>
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
        <DisabledAction
          id="cilesimet-booking-connect-hint"
          label={t('cilesimet.booking.connect')}
          icon={<IconExternal />}
        />
      </div>
    </Card>
  )
}

function MappingCell({ value }: { value: string | null }) {
  const { t } = useTranslation()
  return value ? <span className={s.code}>{value}</span> : <span className={s.unmapped}>{t('cilesimet.booking.unmapped')}</span>
}

function MappingCard({ types, mappingByType }: { types: RoomTypeInfo[]; mappingByType: Map<number, ChannelMapping> }) {
  const { t } = useTranslation()
  return (
    <Card title={t('cilesimet.booking.mappingTitle')} description={t('cilesimet.booking.mappingDescription')} flush>
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
            {types.map((type) => {
              const mapping = mappingByType.get(type.id)
              const mapped = isMapped(mapping)
              return (
                <tr key={type.id}>
                  <th scope="row" className={s.typeCell}>
                    {type.name}
                    <span className={s.typeCode}>{type.code}</span>
                  </th>
                  <td data-label={t('cilesimet.booking.externalRoom')}>
                    <MappingCell value={mapping?.externalRoomId ?? null} />
                  </td>
                  <td data-label={t('cilesimet.booking.externalRate')}>
                    <MappingCell value={mapping?.externalRatePlanId ?? null} />
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
            })}
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
            <p className={page.text}>{t(`cilesimet.booking.rules.${rule.key}.text`)}</p>
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
  const steps = useMemo<{ key: StepKey; done: boolean }[]>(
    () => [
      { key: 'account', done: connected },
      { key: 'extranet', done: connected },
      { key: 'mapping', done: allMapped },
      { key: 'import', done: false },
      { key: 'approval', done: false },
    ],
    [connected, allMapped],
  )

  if (status.isPending || mappings.isPending || types.isPending) return <SectionLoading title={title} rows={6} />
  if (status.isError || mappings.isError || types.isError) {
    const retry = () => {
      if (status.isError) void status.refetch()
      if (mappings.isError) void mappings.refetch()
      if (types.isError) void types.refetch()
    }
    return <SectionError title={title} onRetry={retry} />
  }

  return (
    <div className={page.stack}>
      <ConnectionCard status={status.data} />
      <MappingCard types={types.data} mappingByType={mappingByType} />
      <RulesCard />
      <ChecklistCard steps={steps} />
    </div>
  )
}
