import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { Room } from '@/types/domain'
import { useRooms } from '@/lib/api/rooms'
import { useRemoveBlock } from '@/lib/api/settings'
import { dayIndex } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { Badge, type BadgeTone } from '@/components/atoms/Badge/Badge'
import { Button } from '@/components/atoms/Button/Button'
import { DateText } from '@/components/atoms/DateText/DateText'
import { IconCheckCircle, IconClock, IconInfo, IconPlus, IconTrash, IconWrench } from '@/components/atoms/Icon/icons'
import { IconButton } from '@/components/atoms/IconButton/IconButton'
import { Card } from '@/components/molecules/Card/Card'
import { EmptyState } from '@/components/molecules/EmptyState/EmptyState'
import { FilterChip } from '@/components/molecules/FilterChip/FilterChip'
import { ConfirmDialog } from '@/components/organisms/ConfirmDialog/ConfirmDialog'
import { useActionError } from '@/features/reservation/useStayActions'
import { BlockSheet } from './BlockSheet'
import { collectBlocks, type BlockRow, type BlockState } from './rooms'
import { SectionShell } from './SectionShell'
import { SectionError, SectionLoading } from './SectionStates'
import page from './SectionShell.module.scss'
import s from './Blocks.module.scss'
import { notify } from '@/lib/notify'

type Filter = 'open' | BlockState | 'all'
const FILTERS: Filter[] = ['open', 'current', 'upcoming', 'past', 'all']

const stateTones: Record<BlockState, BadgeTone> = {
  current: 'warning',
  upcoming: 'info',
  past: 'neutral',
}
const stateIcons: Record<BlockState, ReactNode> = {
  current: <IconWrench size={16} />,
  upcoming: <IconClock size={16} />,
  past: <IconCheckCircle size={16} />,
}

const matches = (row: BlockRow, filter: Filter) =>
  filter === 'all' ? true : filter === 'open' ? row.state !== 'past' : row.state === filter

function BlockItem({ row, onRemove }: { row: BlockRow; onRemove: () => void }) {
  const { t } = useTranslation()
  const { block, room, state } = row
  return (
    <li className={s.block}>
      <div className={s.blockMain}>
        <p className={s.blockRoom}>
          {t('common.roomNumber', { room: room.id })}
          <span className={s.blockType}>{room.type}</span>
        </p>
        <p className={s.blockDates}>
          <DateText iso={block.startsOn} /> → <DateText iso={block.endsOn} />
          <span className={s.blockNights}>{t('common.night', { count: dayIndex(block.startsOn, block.endsOn) })}</span>
        </p>
        <p className={s.blockReason}>{block.reason || t('cilesimet.blocks.noReason')}</p>
      </div>
      <div className={s.blockBadges}>
        <Badge tone="neutral">{t(`block.${block.type}`)}</Badge>
        <Badge tone={stateTones[state]} icon={stateIcons[state]}>
          {t(`cilesimet.blocks.state.${state}`)}
        </Badge>
      </div>
      <IconButton label={t('cilesimet.blocks.remove', { room: room.id })} onClick={onRemove}>
        <IconTrash />
      </IconButton>
    </li>
  )
}

export function BlocksSection() {
  const { t } = useTranslation()
  const rooms = useRooms()
  const remove = useRemoveBlock()
  const onError = useActionError()
  const [filter, setFilter] = useState<Filter>('open')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<{ room: Room; blockId: number } | null>(null)
  const title = t('cilesimet.sections.mirembajtje')

  const all = useMemo(() => (rooms.data ? collectBlocks(rooms.data, TODAY) : []), [rooms.data])
  const rows = useMemo(() => all.filter((row) => matches(row, filter)), [all, filter])
  const counts = useMemo(
    () =>
      Object.fromEntries(FILTERS.map((key) => [key, all.filter((row) => matches(row, key)).length])) as Record<
        Filter,
        number
      >,
    [all],
  )

  const confirmRemove = () => {
    if (!removing) return
    remove.mutate(
      { roomId: removing.room.id, blockId: removing.blockId },
      {
        onSuccess: () => {
          notify.info(t('cilesimet.blocks.removed', { room: removing.room.id }), t('cilesimet.blocks.removedHint'))
          setRemoving(null)
        },
        onError,
      },
    )
  }

  return (
    <SectionShell
      section="mirembajtje"
      actions={
        rooms.data ? (
          <Button icon={<IconPlus />} onClick={() => setAdding(true)}>
            {t('cilesimet.blocks.add')}
          </Button>
        ) : null
      }
    >
      {rooms.isPending ? (
        <SectionLoading title={title} />
      ) : rooms.isError ? (
        <SectionError title={title} onRetry={() => void rooms.refetch()} />
      ) : (
        <>
          <ul className={page.rules}>
            {(['ruleReduces', 'ruleNoReservation', 'ruleEndExclusive'] as const).map((key) => (
              <li key={key}>
                <IconInfo size={20} />
                {t(`cilesimet.blocks.${key}`)}
              </li>
            ))}
          </ul>
          <div className={s.filters} role="group" aria-label={t('cilesimet.blocks.filterLabel')}>
            {FILTERS.map((key) => (
              <FilterChip
                key={key}
                label={t(`cilesimet.blocks.filters.${key}`)}
                count={counts[key]}
                selected={filter === key}
                onClick={() => setFilter(key)}
              />
            ))}
          </div>
          <Card title={t('cilesimet.blocks.listTitle')} flush>
            {rows.length === 0 ? (
              <EmptyState
                title={t('cilesimet.blocks.empty')}
                description={t('cilesimet.blocks.emptyHint')}
                icon={<IconCheckCircle />}
                compact
                action={
                  <Button variant="secondary" icon={<IconPlus />} onClick={() => setAdding(true)}>
                    {t('cilesimet.blocks.add')}
                  </Button>
                }
              />
            ) : (
              <ul className={s.blocks}>
                {rows.map((row) => (
                  <BlockItem
                    key={`${row.room.id}-${row.block.id}`}
                    row={row}
                    onRemove={() => setRemoving({ room: row.room, blockId: row.block.id })}
                  />
                ))}
              </ul>
            )}
          </Card>
        </>
      )}

      {adding && rooms.data ? <BlockSheet rooms={rooms.data} onClose={() => setAdding(false)} /> : null}
      <ConfirmDialog
        open={removing !== null}
        title={t('cilesimet.blocks.removeTitle', { room: removing?.room.id ?? '' })}
        confirmLabel={t('cilesimet.blocks.removeConfirm')}
        tone="danger"
        pending={remove.isPending}
        onConfirm={confirmRemove}
        onClose={() => setRemoving(null)}
      >
        <p>{t('cilesimet.blocks.removeText')}</p>
      </ConfirmDialog>
    </SectionShell>
  )
}
