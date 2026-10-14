import { memo, useMemo } from 'react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import type { Reservation, Room, RoomTypeInfo } from '@/types/domain'
import { addDaysIso, fmtDayMonth } from '@/lib/date/calendar'
import { occupiesNight, roomBlockedOn, typeFreeOn } from '@/lib/inventory'
import { useUiStore } from '@/store/uiStore'
import { IconAlert, IconPlus, IconWrench } from '@/components/atoms/Icon/icons'
import { SourceBadge } from '@/components/molecules/SourceBadge/SourceBadge'
import { StatusBadge } from '@/components/molecules/StatusBadge/StatusBadge'
import s from './DayBoard.module.scss'

type Tile =
  | { kind: 'free'; room: Room; leaving?: Reservation }
  | { kind: 'blocked'; room: Room }
  | { kind: 'stay'; room: Room; stay: Reservation; leaving?: Reservation }

export const DayBoard = memo(function DayBoard({
  day,
  rooms,
  roomTypes,
  reservations,
  typeId,
}: {
  day: string
  rooms: Room[]
  roomTypes: RoomTypeInfo[]
  reservations: Reservation[]
  typeId: number
}) {
  const { t } = useTranslation()
  const openCreate = useUiStore((state) => state.openCreate)
  const openDrawer = useUiStore((state) => state.openDrawer)

  const groups = useMemo(
    () =>
      roomTypes
        .filter((type) => !typeId || type.id === typeId)
        .map((type) => ({
          type,
          tiles: rooms
            .filter((room) => room.roomTypeId === type.id)
            .map((room): Tile => {
              const stay = reservations.find((item) => item.roomId === room.id && occupiesNight(item, day))
              const leaving = reservations.find(
                (item) => item.roomId === room.id && item.checkOut === day && item.status !== 'CANCELLED',
              )
              if (stay) return { kind: 'stay', room, stay, leaving }
              if (roomBlockedOn(room, day)) return { kind: 'blocked', room }
              return { kind: 'free', room, leaving }
            }),
          unassigned: reservations.filter(
            (item) => !item.roomId && item.roomTypeId === type.id && item.status === 'RESERVED' && occupiesNight(item, day),
          ),
        }))
        .filter((group) => group.tiles.length > 0),
    [day, reservations, roomTypes, rooms, typeId],
  )

  return (
    <div className={s.board}>
      {groups.map(({ type, tiles, unassigned }) => (
        <section key={type.id} className={s.group} aria-label={type.name}>
          <h3 className={s.groupTitle}>
            {type.name}
            <span>{t('room.freeOf', { free: Math.max(0, typeFreeOn(type.id, day, rooms, reservations)), total: tiles.length })}</span>
          </h3>
          <ul className={s.tiles}>
            {tiles.map((tile) => {
              if (tile.kind === 'blocked') {
                return (
                  <li key={tile.room.id}>
                    <div className={clsx(s.tile, s.blocked)}>
                      <span className={s.number}>{tile.room.id}</span>
                      <span className={s.state}>
                        <IconWrench size={16} />
                        {t('kalendari.board.blocked')}
                      </span>
                    </div>
                  </li>
                )
              }
              if (tile.kind === 'free') {
                return (
                  <li key={tile.room.id}>
                    <button
                      type="button"
                      className={clsx(s.tile, s.free)}
                      onClick={() => openCreate({ checkIn: day, checkOut: addDaysIso(day, 1), roomId: tile.room.id })}
                    >
                      <span className={s.number}>{tile.room.id}</span>
                      <span className={s.state}>{t('kalendari.board.free')}</span>
                      {tile.leaving ? <span className={s.note}>{t('kalendari.board.leaves')}: {tile.leaving.guestName}</span> : null}
                      <span className={s.cta}>
                        <IconPlus size={16} />
                        {t('kalendari.board.freeAction')}
                      </span>
                    </button>
                  </li>
                )
              }
              const { stay } = tile
              const arriving = stay.checkIn === day
              return (
                <li key={tile.room.id}>
                  <button type="button" className={clsx(s.tile, stay.status === 'IN_HOUSE' ? s.inHouse : s.confirmed)} onClick={() => openDrawer(stay.id)}>
                    <span className={s.number}>{tile.room.id}</span>
                    <span className={s.guest}>{stay.guestName}</span>
                    <span className={s.note}>
                      {tile.leaving
                        ? t('kalendari.board.turnover', { out: tile.leaving.guestName, in: stay.guestName })
                        : arriving
                          ? t('kalendari.board.arrives')
                          : t('kalendari.board.until', { date: fmtDayMonth(stay.checkOut) })}
                    </span>
                    <span className={s.badges}>
                      <StatusBadge status={stay.status} />
                      <SourceBadge source={stay.source} />
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {unassigned.length > 0 ? (
            <ul className={s.unassigned}>
              {unassigned.map((item) => (
                <li key={item.id}>
                  <button type="button" className={s.unassignedRow} onClick={() => openDrawer(item.id)}>
                    <IconAlert size={16} />
                    <span>
                      {item.guestName} · {t('room.unassigned')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  )
})
