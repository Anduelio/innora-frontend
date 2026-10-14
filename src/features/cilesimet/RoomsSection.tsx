import { useMemo, type ComponentType } from 'react'
import { useTranslation } from 'react-i18next'
import clsx from 'clsx'
import { Badge } from '@/components/atoms/Badge/Badge'
import { IconBed, IconCheckCircle, IconCircle, IconInfo, IconWrench, type IconProps } from '@/components/atoms/Icon/icons'
import { Money } from '@/components/atoms/Money/Money'
import { Card } from '@/components/molecules/Card/Card'
import { EmptyState } from '@/components/molecules/EmptyState/EmptyState'
import { useRoomTypes, useRooms } from '@/lib/api/rooms'
import { TODAY } from '@/lib/date/today'
import type { Room } from '@/types/domain'
import { groupRoomsByType, type RoomState, type TypeGroup } from './rooms'
import { ReadOnlyNote, SectionError, SectionLoading } from './SectionStates'
import page from './CilesimetPage.module.scss'
import s from './Rooms.module.scss'

const stateIcons: Record<RoomState, ComponentType<IconProps>> = {
  active: IconCheckCircle,
  maintenance: IconWrench,
  inactive: IconCircle,
}

const stateLabelKeys: Record<RoomState, string> = {
  active: 'cilesimet.rooms.statusActive',
  maintenance: 'room.maintenance',
  inactive: 'cilesimet.rooms.statusInactive',
}

function RoomChip({ room, state }: { room: Room; state: RoomState }) {
  const { t } = useTranslation()
  const StateIcon = stateIcons[state]
  return (
    <li className={clsx(s.chip, s[state])}>
      <span className={s.chipNumber}>{room.id}</span>
      <span className={s.chipFloor}>
        {room.floor ? t('cilesimet.rooms.floor', { floor: room.floor }) : t('cilesimet.rooms.noFloor')}
      </span>
      <span className={s.chipState}>
        <StateIcon size={16} />
        {t(stateLabelKeys[state])}
      </span>
    </li>
  )
}

function RoomTypeBlock({ group }: { group: TypeGroup }) {
  const { t } = useTranslation()
  const { type, rooms, activeCount } = group
  const headingId = `room-type-${type.id}`
  return (
    <article className={s.type} aria-labelledby={headingId}>
      <header className={s.typeHeader}>
        <h3 id={headingId} className={s.typeName}>
          {type.name}
        </h3>
        <Badge tone="neutral">{type.code}</Badge>
      </header>
      <dl className={s.facts}>
        <div className={s.fact}>
          <dt>{t('cilesimet.rooms.activeRooms')}</dt>
          <dd>{activeCount}</dd>
        </div>
        <div className={s.fact}>
          <dt>{t('cilesimet.rooms.maxOccupancy')}</dt>
          <dd>{t('cilesimet.rooms.persons', { count: type.maxOccupancy })}</dd>
        </div>
        <div className={s.fact}>
          <dt>{t('cilesimet.rooms.basePrice')}</dt>
          <dd>
            <Money cents={type.basePriceCents} currency={type.currency} strong />
          </dd>
        </div>
      </dl>
      {rooms.length === 0 ? (
        <p className={page.hint}>{t('cilesimet.rooms.noRooms')}</p>
      ) : (
        <ul className={s.chips} aria-label={t('cilesimet.rooms.roomsOfType', { type: type.name })}>
          {rooms.map(({ room, state }) => (
            <RoomChip key={room.id} room={room} state={state} />
          ))}
        </ul>
      )}
    </article>
  )
}

export function RoomsSection() {
  const { t } = useTranslation()
  const types = useRoomTypes()
  const rooms = useRooms()
  const title = t('cilesimet.sections.dhomat')

  const groups = useMemo(
    () => (types.data && rooms.data ? groupRoomsByType(types.data, rooms.data, TODAY) : []),
    [types.data, rooms.data],
  )
  const activeTotal = useMemo(() => groups.reduce((sum, group) => sum + group.activeCount, 0), [groups])

  if (types.isPending || rooms.isPending) return <SectionLoading title={title} rows={6} />
  if (types.isError || rooms.isError) {
    const retry = () => {
      if (types.isError) void types.refetch()
      if (rooms.isError) void rooms.refetch()
    }
    return <SectionError title={title} onRetry={retry} />
  }

  return (
    <div className={page.stack}>
      <Card
        title={title}
        description={t('cilesimet.rooms.description')}
        icon={<IconBed />}
        actions={
          groups.length > 0 ? (
            <Badge tone="info">{t('cilesimet.rooms.summary', { rooms: activeTotal, types: groups.length })}</Badge>
          ) : null
        }
        flush
      >
        {groups.length === 0 ? (
          <EmptyState title={t('cilesimet.rooms.empty')} description={t('cilesimet.rooms.emptyHint')} icon={<IconBed />} />
        ) : (
          <>
            <p className={s.note}>
              <IconInfo size={18} />
              {t('cilesimet.rooms.capacityNote')}
            </p>
            <div className={s.types}>
              {groups.map((group) => (
                <RoomTypeBlock key={group.type.id} group={group} />
              ))}
            </div>
          </>
        )}
      </Card>
      <ReadOnlyNote />
    </div>
  )
}
