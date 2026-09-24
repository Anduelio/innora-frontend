import type { RoomType } from '@/types/domain'

export const roomTypeKey: Record<RoomType, 'room.double' | 'room.single' | 'room.suite' | 'room.family'> = {
  Dyshe: 'room.double',
  Teke: 'room.single',
  Suitë: 'room.suite',
  Familjare: 'room.family',
}
