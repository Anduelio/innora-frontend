import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { OperationalStatus } from '@/types/domain'
import { errorText } from '@/lib/api/client'
import { useCreateRoom, useRoomTypes } from '@/lib/api/rooms'
import { useUiStore } from '@/store/uiStore'
import { Button } from '@/components/ui/Button/Button'
import { Field } from '@/components/ui/Field/Field'
import { Modal } from '@/components/ui/Modal/Modal'
import { Select } from '@/components/ui/Select/Select'
import { TextInput } from '@/components/ui/TextInput/TextInput'

const statuses: OperationalStatus[] = ['ready', 'dirty', 'cleaning', 'inspected', 'maintenance', 'out_of_order']

export function RoomFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const types = useRoomTypes()
  const create = useCreateRoom()
  const showToast = useUiStore((state) => state.showToast)
  const [number, setNumber] = useState('')
  const [roomTypeId, setRoomTypeId] = useState('')
  const [floor, setFloor] = useState('')
  const [building, setBuilding] = useState('')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<OperationalStatus>('ready')

  const save = () => {
    if (!number.trim() || !roomTypeId) return
    create.mutate(
      {
        roomTypeId: Number(roomTypeId),
        number: number.trim(),
        floor: floor.trim() || undefined,
        building: building.trim() || undefined,
        notes: notes.trim() || undefined,
        operationalStatus: status,
      },
      {
        onSuccess: () => {
          showToast([t('room.saved')])
          setNumber('')
          onClose()
        },
        onError: (error) => showToast([errorText(error, t('toast.failed'))]),
      },
    )
  }

  return (
    <Modal
      open={open}
      title={t('room.add')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={save} disabled={!number.trim() || !roomTypeId || create.isPending}>{t('common.save')}</Button>
        </>
      }
    >
      <Field label={t('room.number')} htmlFor="room-number">
        <TextInput id="room-number" value={number} onChange={(event) => setNumber(event.target.value)} placeholder="204" />
      </Field>
      <Field label={t('room.typeLabel')} htmlFor="room-type">
        <Select id="room-type" value={roomTypeId} onChange={(event) => setRoomTypeId(event.target.value)}>
          <option value="">{t('room.chooseType')}</option>
          {(types.data ?? []).map((type) => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </Select>
      </Field>
      <Field label={t('room.floorLabel')} htmlFor="room-floor">
        <TextInput id="room-floor" value={floor} onChange={(event) => setFloor(event.target.value)} />
      </Field>
      <Field label={t('room.building')} htmlFor="room-building">
        <TextInput id="room-building" value={building} onChange={(event) => setBuilding(event.target.value)} placeholder={t('room.mainBuilding')} />
      </Field>
      <Field label={t('room.state')} htmlFor="room-state">
        <Select id="room-state" value={status} onChange={(event) => setStatus(event.target.value as OperationalStatus)}>
          {statuses.map((item) => (
            <option key={item} value={item}>{t(`ops.${item}`)}</option>
          ))}
        </Select>
      </Field>
      <Field label={t('form.notes')} htmlFor="room-notes">
        <TextInput id="room-notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
      </Field>
    </Modal>
  )
}
