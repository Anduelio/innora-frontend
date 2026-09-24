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
import { DateRangeField } from '@/components/ui/DateField/DateRangeField'
import { Dropdown } from '@/components/ui/Dropdown/Dropdown'
import { Textarea } from '@/components/ui/Textarea/Textarea'
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
            <Dropdown
              id="detail-status"
              label={t('room.state')}
              value={room.operationalStatus ?? 'ready'}
              options={statuses.map((item) => ({ value: item, label: t(`ops.${item}`) }))}
              onChange={(value) =>
                status.mutate(
                  { number: room.id, operationalStatus: value as OperationalStatus },
                  {
                    onSuccess: () => showToast([t('room.statusSaved')]),
                    onError: (error) => showToast([errorText(error, t('toast.failed'))]),
                  },
                )
              }
            />
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
            <DateRangeField
              fromId="block-start"
              toId="block-end"
              fromLabel={t('common.rangeFrom')}
              toLabel={t('common.rangeTo')}
              from={startsOn}
              to={endsOn}
              onFromChange={setStartsOn}
              onToChange={setEndsOn}
            />
            <Field label={t('room.reason')} htmlFor="block-reason">
              <Textarea id="block-reason" value={reason} onChange={(event) => setReason(event.target.value)} />
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
