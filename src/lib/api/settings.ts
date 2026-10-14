import { useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  AddBlockInput,
  ChannelMapping,
  HotelSettings,
  Room,
  RoomTypeInfo,
  SaveHotelInput,
  SaveMappingInput,
  SaveRoomInput,
  SaveRoomTypeInput,
  SyncStatus,
} from '@/types/domain'
import { api } from '@/lib/api/client'

const send = (method: string, body?: unknown) => ({
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
})

export function useSaveHotel() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: SaveHotelInput) => api<HotelSettings>('/api/settings/hotel', send('PATCH', input)),
    onSuccess: (saved) => qc.setQueryData(['hotel-settings'], saved),
  })
}

function useRoomsMutation<TVariables, TResult>(fn: (variables: TVariables) => Promise<TResult>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ['rooms'] }),
        qc.invalidateQueries({ queryKey: ['room-types'] }),
        qc.invalidateQueries({ queryKey: ['channel-mappings'] }),
        qc.invalidateQueries({ queryKey: ['sync-status'] }),
      ]),
  })
}

export function useSaveRoomType() {
  return useRoomsMutation(({ id, input }: { id?: number; input: SaveRoomTypeInput }) =>
    api<RoomTypeInfo>(id ? `/api/room-types/${id}` : '/api/room-types', send(id ? 'PATCH' : 'POST', input)),
  )
}

export function useSaveRoom() {
  return useRoomsMutation(({ roomId, input }: { roomId?: string; input: SaveRoomInput }) =>
    api<Room>(roomId ? `/api/rooms/${encodeURIComponent(roomId)}` : '/api/rooms', send(roomId ? 'PATCH' : 'POST', input)),
  )
}

export function useAddBlock() {
  return useRoomsMutation(({ roomId, input }: { roomId: string; input: AddBlockInput }) =>
    api<Room>(`/api/rooms/${encodeURIComponent(roomId)}/blocks`, send('POST', input)),
  )
}

export function useRemoveBlock() {
  return useRoomsMutation(({ roomId, blockId }: { roomId: string; blockId: number }) =>
    api<Room>(`/api/rooms/${encodeURIComponent(roomId)}/blocks/${blockId}`, send('DELETE')),
  )
}

function useChannelMutation<TVariables, TResult>(fn: (variables: TVariables) => Promise<TResult>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ['sync-status'] }),
        qc.invalidateQueries({ queryKey: ['channel-mappings'] }),
      ]),
  })
}

export function useConnectChannel() {
  return useChannelMutation((accountId: string) =>
    api<SyncStatus>('/api/settings/channel/connect', send('POST', { accountId })),
  )
}

export function useDisconnectChannel() {
  return useChannelMutation(() => api<SyncStatus>('/api/settings/channel/disconnect', send('POST')))
}

export function useSaveMapping() {
  return useChannelMutation(({ roomTypeId, input }: { roomTypeId: number; input: SaveMappingInput }) =>
    api<ChannelMapping>(`/api/settings/channel-mappings/${roomTypeId}`, send('PUT', input)),
  )
}

export function useRunSync() {
  return useChannelMutation(() => api<SyncStatus>('/api/sync/run', send('POST')))
}

export function useResetDemo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api<null>('/api/settings/demo/reset', send('POST')),
    onSuccess: () => qc.invalidateQueries(),
  })
}
