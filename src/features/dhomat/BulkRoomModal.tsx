import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { errorText } from '@/lib/api/client'
import { useBulkRooms, useRoomTypes } from '@/lib/api/rooms'
import { useUiStore } from '@/store/uiStore'
import { Button } from '@/components/ui/Button/Button'
import { Field } from '@/components/ui/Field/Field'
import { Modal } from '@/components/ui/Modal/Modal'
import { Select } from '@/components/ui/Select/Select'
import { TextInput } from '@/components/ui/TextInput/TextInput'

export function BulkRoomModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation()
  const types = useRoomTypes()
  const bulk = useBulkRooms()
  const showToast = useUiStore((state) => state.showToast)
  const [roomTypeId, setRoomTypeId] = useState('')
  const [numbers, setNumbers] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [floor, setFloor] = useState('')

  const save = () => {
    const list = numbers.split(/[\s,]+/).map((item) => item.trim()).filter(Boolean)
    if (!roomTypeId || (list.length === 0 && !from)) return
    bulk.mutate(
      {
        roomTypeId: Number(roomTypeId),
        numbers: list,
        from: from.trim() || undefined,
        to: to.trim() || undefined,
        floor: floor.trim() || undefined,
      },
      {
        onSuccess: () => {
          showToast([t('room.savedMany')])
          onClose()
        },
        onError: (error) => showToast([errorText(error, t('toast.failed'))]),
      },
    )
  }

  return (
    <Modal
      open={open}
      title={t('room.addMany')}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button onClick={save} disabled={bulk.isPending}>{t('common.save')}</Button>
        </>
      }
    >
      <Field label={t('room.typeLabel')} htmlFor="bulk-type">
        <Select id="bulk-type" value={roomTypeId} onChange={(event) => setRoomTypeId(event.target.value)}>
          <option value="">{t('room.chooseType')}</option>
          {(types.data ?? []).map((type) => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </Select>
      </Field>
      <Field label={t('room.numbers')} htmlFor="bulk-numbers">
        <TextInput id="bulk-numbers" value={numbers} onChange={(event) => setNumbers(event.target.value)} placeholder={'201\n202\nVilla 2'} />
      </Field>
      <Field label={t('room.range')} htmlFor="bulk-from">
        <TextInput id="bulk-from" value={from} onChange={(event) => setFrom(event.target.value)} placeholder="101" />
      </Field>
      <Field label={t('room.rangeTo')} htmlFor="bulk-to">
        <TextInput id="bulk-to" value={to} onChange={(event) => setTo(event.target.value)} placeholder="110" />
      </Field>
      <Field label={t('room.floorLabel')} htmlFor="bulk-floor">
        <TextInput id="bulk-floor" value={floor} onChange={(event) => setFloor(event.target.value)} />
      </Field>
    </Modal>
  )
}
