import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Room, RoomTypeInfo } from '@/types/domain'
import { useHotelSettings, useRoomTypes, useRooms } from '@/lib/api/rooms'
import { useSaveRoom } from '@/lib/api/settings'
import { TODAY } from '@/lib/date/today'
import { Badge, type BadgeTone } from '@/components/atoms/Badge/Badge'
import { Button } from '@/components/atoms/Button/Button'
import { IconEdit, IconBed, IconPlus, IconWrench } from '@/components/atoms/Icon/icons'
import { IconButton } from '@/components/atoms/IconButton/IconButton'
import { Money } from '@/components/atoms/Money/Money'
import { Switch } from '@/components/atoms/Switch/Switch'
import { EmptyState } from '@/components/molecules/EmptyState/EmptyState'
import { useActionError } from '@/features/reservation/useStayActions'
import { groupRoomsByType, type RoomState, type TypeGroup } from './rooms'
import { RoomSheet, RoomTypeSheet } from './RoomSheets'
import { SectionShell } from './SectionShell'
import { SectionError, SectionLoading } from './SectionStates'
import s from './Rooms.module.scss'
import { notify } from '@/lib/notify'

const stateTone: Record<RoomState, BadgeTone> = {
  active: 'success',
  maintenance: 'warning',
  inactive: 'neutral',
}
const stateKey: Record<RoomState, string> = {
  active: 'cilesimet.rooms.statusActive',
  maintenance: 'room.maintenance',
  inactive: 'cilesimet.rooms.statusInactive',
}

function RoomRow({ room, state, onEdit }: { room: Room; state: RoomState; onEdit: () => void }) {
  const { t } = useTranslation()
  const save = useSaveRoom()
  const onError = useActionError()
  const active = room.isActive !== false

  const toggle = (next: boolean) =>
    save.mutate(
      { roomId: room.id, input: { isActive: next } },
      {
        onSuccess: () =>
          (next ? notify.success : notify.warning)(
            t(next ? 'cilesimet.rooms.activated' : 'cilesimet.rooms.deactivated', {
              room: room.id,
            }),
          ),
        onError,
      },
    )

  return (
    <li className={active ? s.room : `${s.room} ${s.roomOff}`}>
      <div className={s.roomMain}>
        <span className={s.roomNumber}>
          {t('common.roomNumber', { room: room.id })}
          <Badge tone={stateTone[state]} icon={state === 'maintenance' ? <IconWrench size={14} /> : undefined}>
            {t(stateKey[state])}
          </Badge>
        </span>
        <span className={s.roomSub}>
          {[room.floor ? t('cilesimet.rooms.floor', { floor: room.floor }) : t('cilesimet.rooms.noFloor'), room.notes]
            .filter(Boolean)
            .join(' · ')}
        </span>
      </div>
      <Switch
        checked={active}
        disabled={save.isPending}
        label={t('cilesimet.rooms.toggle', { room: room.id })}
        onChange={toggle}
      />
      <IconButton label={t('cilesimet.rooms.editRoom', { room: room.id })} onClick={onEdit}>
        <IconEdit />
      </IconButton>
    </li>
  )
}

function TypeCard({
  group,
  onEditType,
  onEditRoom,
  onAddRoom,
}: {
  group: TypeGroup
  onEditType: () => void
  onEditRoom: (room: Room) => void
  onAddRoom: () => void
}) {
  const { t } = useTranslation()
  const { type, rooms, activeCount } = group
  const headingId = `room-type-${type.id}`
  return (
    <article className={s.type} aria-labelledby={headingId}>
      <header className={s.typeHeader}>
        <div className={s.typeTitle}>
          <h3 id={headingId} className={s.typeName}>
            {type.name}
          </h3>
          <Badge>{type.code}</Badge>
        </div>
        <IconButton variant="secondary" label={t('cilesimet.rooms.editType', { name: type.name })} onClick={onEditType}>
          <IconEdit />
        </IconButton>
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
        <p className={s.emptyRooms}>{t('cilesimet.rooms.noRooms')}</p>
      ) : (
        <ul className={s.rooms} aria-label={t('cilesimet.rooms.roomsOfType', { type: type.name })}>
          {rooms.map(({ room, state }) => (
            <RoomRow key={room.id} room={room} state={state} onEdit={() => onEditRoom(room)} />
          ))}
        </ul>
      )}
      <div className={s.typeFooter}>
        <Button variant="secondary" icon={<IconPlus />} onClick={onAddRoom}>
          {t('cilesimet.rooms.addRoomToType')}
        </Button>
      </div>
    </article>
  )
}

type Editing = { kind: 'type'; type: RoomTypeInfo | null } | { kind: 'room'; room: Room | null; typeId?: number } | null

export function RoomsSection() {
  const { t } = useTranslation()
  const types = useRoomTypes()
  const rooms = useRooms()
  const hotel = useHotelSettings()
  const [editing, setEditing] = useState<Editing>(null)
  const title = t('cilesimet.sections.dhomat')

  const groups = useMemo(
    () => (types.data && rooms.data ? groupRoomsByType(types.data, rooms.data, TODAY) : []),
    [types.data, rooms.data],
  )

  const close = () => setEditing(null)

  return (
    <SectionShell
      section="dhomat"
      actions={
        types.data ? (
          <>
            <Button variant="secondary" icon={<IconPlus />} onClick={() => setEditing({ kind: 'type', type: null })}>
              {t('cilesimet.rooms.addType')}
            </Button>
            <Button
              icon={<IconPlus />}
              disabled={types.data.length === 0}
              onClick={() => setEditing({ kind: 'room', room: null })}
            >
              {t('cilesimet.rooms.addRoom')}
            </Button>
          </>
        ) : null
      }
    >
      {types.isPending || rooms.isPending ? (
        <SectionLoading title={title} rows={6} />
      ) : types.isError || rooms.isError ? (
        <SectionError
          title={title}
          onRetry={() => {
            if (types.isError) void types.refetch()
            if (rooms.isError) void rooms.refetch()
          }}
        />
      ) : groups.length === 0 ? (
        <EmptyState
          title={t('cilesimet.rooms.empty')}
          description={t('cilesimet.rooms.emptyHint')}
          icon={<IconBed />}
          action={
            <Button onClick={() => setEditing({ kind: 'type', type: null })}>{t('cilesimet.rooms.addType')}</Button>
          }
        />
      ) : (
        <>
          <p className={s.note}>{t('cilesimet.rooms.capacityNote')}</p>
          <div className={s.types}>
            {groups.map((group) => (
              <TypeCard
                key={group.type.id}
                group={group}
                onEditType={() => setEditing({ kind: 'type', type: group.type })}
                onEditRoom={(room) => setEditing({ kind: 'room', room })}
                onAddRoom={() => setEditing({ kind: 'room', room: null, typeId: group.type.id })}
              />
            ))}
          </div>
        </>
      )}

      {editing?.kind === 'type' ? (
        <RoomTypeSheet
          key={editing.type?.id ?? 'new'}
          type={editing.type}
          currency={hotel.data?.currency ?? 'EUR'}
          onClose={close}
        />
      ) : null}
      {editing?.kind === 'room' && types.data ? (
        <RoomSheet
          key={editing.room?.id ?? 'new'}
          room={editing.room}
          types={types.data}
          presetTypeId={editing.typeId}
          onClose={close}
        />
      ) : null}
    </SectionShell>
  )
}
