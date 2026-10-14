import { useMemo, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, type BadgeTone } from '@/components/atoms/Badge/Badge'
import { DateText } from '@/components/atoms/DateText/DateText'
import { IconCheckCircle, IconClock, IconInfo, IconPlus, IconWrench } from '@/components/atoms/Icon/icons'
import { Card } from '@/components/molecules/Card/Card'
import { EmptyState } from '@/components/molecules/EmptyState/EmptyState'
import { useRooms } from '@/lib/api/rooms'
import { dayIndex } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { collectBlocks, type BlockRow, type BlockState } from './rooms'
import { DisabledAction, SectionError, SectionLoading } from './SectionStates'
import page from './CilesimetPage.module.scss'
import s from './Rooms.module.scss'

const stateTones: Record<BlockState, BadgeTone> = { current: 'warning', upcoming: 'info', past: 'neutral' }

const stateIcons: Record<BlockState, ReactNode> = {
  current: <IconWrench size={16} />,
  upcoming: <IconClock size={16} />,
  past: <IconCheckCircle size={16} />,
}

function BlockItem({ row }: { row: BlockRow }) {
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
    </li>
  )
}

export function BlocksSection() {
  const { t } = useTranslation()
  const rooms = useRooms()
  const title = t('cilesimet.sections.mirembajtje')
  const rows = useMemo(() => (rooms.data ? collectBlocks(rooms.data, TODAY) : []), [rooms.data])

  if (rooms.isPending) return <SectionLoading title={title} />
  if (rooms.isError) return <SectionError title={title} onRetry={() => void rooms.refetch()} />

  return (
    <div className={page.stack}>
      <Card title={title} description={t('cilesimet.blocks.description')} icon={<IconWrench />}>
        <div className={page.stack}>
          <div>
            <h3 className={page.subheading}>{t('cilesimet.blocks.rulesTitle')}</h3>
            <ul className={page.ruleList}>
              <li>
                <IconInfo size={20} />
                {t('cilesimet.blocks.ruleReduces')}
              </li>
              <li>
                <IconInfo size={20} />
                {t('cilesimet.blocks.ruleNoReservation')}
              </li>
              <li>
                <IconInfo size={20} />
                {t('cilesimet.blocks.ruleEndExclusive')}
              </li>
            </ul>
          </div>
          <DisabledAction id="cilesimet-block-add-hint" label={t('cilesimet.blocks.add')} icon={<IconPlus />} />
        </div>
      </Card>
      <Card title={t('cilesimet.blocks.listTitle')} flush>
        {rows.length === 0 ? (
          <EmptyState
            title={t('cilesimet.blocks.empty')}
            description={t('cilesimet.blocks.emptyHint')}
            icon={<IconCheckCircle />}
            compact
          />
        ) : (
          <ul className={s.blocks}>
            {rows.map((row) => (
              <BlockItem key={row.block.id} row={row} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
