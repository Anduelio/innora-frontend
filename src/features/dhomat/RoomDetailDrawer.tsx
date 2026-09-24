import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { OperationalStatus, Reservation, Room } from '@/types/domain'
import { fmtGjate } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { blocksRoom, coversDay } from '@/lib/stay'
import { errorText } from '@/lib/api/client'
import { useBlockRoom, useRoomStatus } from '@/lib/api/rooms'
import { useUiStore } from '@/store/uiStore'
import { Button } from '@/components/ui/Button/Button'
import { Drawer } from '@/components/ui/Drawer/Drawer'
import { Field } from '@/components/ui/Field/Field'
import { Select } from '@/components/ui/Select/Select'
import { TextInput } from '@/components/ui/TextInput/TextInput'
import s from './RoomDetailDrawer.module.scss'

const statuses: OperationalStatus[] = ['ready', 'dirty', 'cleaning', 'inspected', 'maintenance', 'out_of_order']

export function RoomDetailDrawer({
  room,
  reservations,
  onClose,
}: {
  room: Room | null
  reservations: Reservation[]
  onClose: () => void
}) {
  const { t } = useTranslation()
  const showToast = useUiStore((state) => state.showToast)
  const openDrawer = useUiStore((state) => state.openDrawer)
  const status = useRoomStatus()
  const block = useBlockRoom()
  const [startsOn, setStartsOn] = useState(TODAY)
  const [endsOn, setEndsOn] = useState(TODAY)
  const [reason, setReason] = useState('')
  const months = t('calendar.months', { returnObjects: true }) as string[]

  const current = room ? reservations.find((item) => item.roomId === room.id && coversDay(item, TODAY)) : undefined
  const next = room
    ? reservations.filter((item) => item.roomId === room.id && blocksRoom(item) && item.checkIn > TODAY).sort((a, b) => a.checkIn.localeCompare(b.checkIn))[0]
    : undefined

  return (
    <Drawer open={Boolean(room)} title={room ? t('room.detailTitle', { number: room.id }) : ''} onClose={onClose}>
      {room ? (
        <div className={s.body}>
          <p className={s.type}>{room.typeName || room.type}</p>
          {room.floor ? <p>{t('room.floor', { floor: room.floor })}</p> : null}
          <Field label={t('room.state')} htmlFor="detail-status">
            <Select
              id="detail-status"
              value={room.operationalStatus ?? 'ready'}
              onChange={(event) =>
                status.mutate(
                  { number: room.id, operationalStatus: event.target.value as OperationalStatus },
                  {
                    onSuccess: () => showToast([t('room.statusSaved')]),
                    onError: (error) => showToast([errorText(error, t('toast.failed'))]),
                  },
                )
              }
            >
              {statuses.map((item) => (
                <option key={item} value={item}>{t(`ops.${item}`)}</option>
              ))}
            </Select>
          </Field>
          <section>
            <h3>{t('room.currentStay')}</h3>
            {current ? (
              <>
                <p>{current.guestName}</p>
                <p>{fmtGjate(current.checkIn, months)} → {fmtGjate(current.checkOut, months)}</p>
                <Button variant="secondary" onClick={() => openDrawer(current.id)}>{t('room.openStay')}</Button>
              </>
            ) : (
              <p>{t('room.noStay')}</p>
            )}
          </section>
          <section>
            <h3>{t('room.nextStay')}</h3>
            {next ? (
              <p>{next.guestName} · {fmtGjate(next.checkIn, months)}</p>
            ) : (
              <p>{t('room.noStay')}</p>
            )}
          </section>
          <section>
            <h3>{t('room.block')}</h3>
            <Field label={t('form.checkIn')} htmlFor="block-start">
              <TextInput id="block-start" type="date" value={startsOn} onChange={(event) => setStartsOn(event.target.value)} />
            </Field>
            <Field label={t('form.checkOut')} htmlFor="block-end">
              <TextInput id="block-end" type="date" value={endsOn} onChange={(event) => setEndsOn(event.target.value)} />
            </Field>
            <Field label={t('room.reason')} htmlFor="block-reason">
              <TextInput id="block-reason" value={reason} onChange={(event) => setReason(event.target.value)} />
            </Field>
            <Button
              variant="secondary"
              onClick={() =>
                block.mutate(
                  { number: room.id, startsOn, endsOn, type: 'maintenance', reason },
                  {
                    onSuccess: () => showToast([t('room.blocked')]),
                    onError: (error) => showToast([errorText(error, t('toast.failed'))]),
                  },
                )
              }
            >
              {t('room.block')}
            </Button>
          </section>
          {(room.amenities ?? []).length > 0 ? (
            <p className={s.amenities}>
              {(room.amenities ?? []).map((item) => t(`amenity.${item.code}`)).join(' · ')}
            </p>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  )
}
