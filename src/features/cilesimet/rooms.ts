import type { Room, RoomBlockSpan, RoomTypeInfo } from '@/types/domain'

export type RoomState = 'active' | 'maintenance' | 'inactive'
export type BlockState = 'current' | 'upcoming' | 'past'

export interface TypeGroup {
  type: RoomTypeInfo
  rooms: { room: Room; state: RoomState }[]
  activeCount: number
}

export interface BlockRow {
  block: RoomBlockSpan
  room: Room
  state: BlockState
}

/** endsOn nuk përfshihet, prandaj një bllokim që mbaron sot nuk është më aktiv. */
export function blockState(block: RoomBlockSpan, today: string): BlockState {
  if (block.endsOn <= today) return 'past'
  return block.startsOn <= today ? 'current' : 'upcoming'
}

export function roomState(room: Room, today: string): RoomState {
  if (room.isActive === false) return 'inactive'
  return room.blocks?.some((block) => block.endsOn > today) ? 'maintenance' : 'active'
}

export function groupRoomsByType(types: RoomTypeInfo[], rooms: Room[], today: string): TypeGroup[] {
  const byType = new Map<number, TypeGroup>()
  for (const type of types) byType.set(type.id, { type, rooms: [], activeCount: 0 })
  for (const room of rooms) {
    const group = byType.get(room.roomTypeId)
    if (!group) continue
    const state = roomState(room, today)
    group.rooms.push({ room, state })
    if (state !== 'inactive') group.activeCount += 1
  }
  for (const group of byType.values()) {
    group.rooms.sort((a, b) => a.room.id.localeCompare(b.room.id, 'sq', { numeric: true }))
  }
  return [...byType.values()]
}

const blockOrder: Record<BlockState, number> = { current: 0, upcoming: 1, past: 2 }

export function collectBlocks(rooms: Room[], today: string): BlockRow[] {
  const rows = rooms.flatMap((room) => (room.blocks ?? []).map((block) => ({ block, room, state: blockState(block, today) })))
  return rows.sort((a, b) => blockOrder[a.state] - blockOrder[b.state] || a.block.startsOn.localeCompare(b.block.startsOn))
}
