import { useId, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { BlockKind, Room } from '@/types/domain'
import { useHotelReservations } from '@/lib/api/reservations'
import { useAddBlock } from '@/lib/api/settings'
import { addDaysIso, dayIndex, fmtDate } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { nightsOf, occupiesNight } from '@/lib/inventory'
import { Button } from '@/components/atoms/Button/Button'
import { Select } from '@/components/atoms/Select/Select'
import { Textarea } from '@/components/atoms/Textarea/Textarea'
import { Alert } from '@/components/molecules/Alert/Alert'
import { DatePicker } from '@/components/molecules/DatePicker/DatePicker'
import { Field } from '@/components/molecules/Field/Field'
import { Sheet } from '@/components/organisms/Sheet/Sheet'
import { useActionError } from '@/features/reservation/useStayActions'
import s from './Blocks.module.scss'
import { notify } from '@/lib/notify'

const KINDS: BlockKind[] = ['maintenance', 'out_of_order', 'owner_use', 'internal_hold', 'other']

export function BlockSheet({
  rooms,
  presetRoomId,
  onClose,
}: {
  rooms: Room[]
  presetRoomId?: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const add = useAddBlock()
  const reservations = useHotelReservations()
  const onError = useActionError()
  const active = useMemo(() => rooms.filter((room) => room.isActive !== false), [rooms])
  const [roomId, setRoomId] = useState(presetRoomId ?? active[0]?.id ?? '')
  const [kind, setKind] = useState<BlockKind>('maintenance')
  const [startsOn, setStartsOn] = useState(TODAY)
  const [endsOn, setEndsOn] = useState(addDaysIso(TODAY, 2))
  const [reason, setReason] = useState('')

  const nights = Math.max(0, dayIndex(startsOn, endsOn))
  const clash = useMemo(() => {
    const days = nightsOf(startsOn, endsOn)
    return (reservations.data ?? []).filter(
      (item) => item.roomId === roomId && days.some((day) => occupiesNight(item, day)),
    )
  }, [reservations.data, roomId, startsOn, endsOn])
  const canSave = Boolean(roomId) && nights >= 1 && clash.length === 0

  const submit = () => {
    if (!canSave) return
    add.mutate(
      { roomId, input: { startsOn, endsOn, type: kind, reason: reason.trim() } },
      {
        onSuccess: () => {
          notify.warning(t('cilesimet.blocks.added', { room: roomId }), t('cilesimet.blocks.addedHint'))
          onClose()
        },
        onError,
      },
    )
  }

  return (
    <Sheet
      open
      title={t('cilesimet.blocks.sheetTitle')}
      description={t('cilesimet.blocks.sheetHint')}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form={`${id}-form`} size="lg" disabled={!canSave} loading={add.isPending}>
            {t('cilesimet.blocks.save')}
          </Button>
        </>
      }
    >
      <form
        id={`${id}-form`}
        className={s.form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          submit()
        }}
      >
        <Field label={t('cilesimet.blocks.room')} htmlFor={`${id}-room`}>
          <Select id={`${id}-room`} value={roomId} onChange={(event) => setRoomId(event.target.value)}>
            {active.map((room) => (
              <option key={room.id} value={room.id}>
                {t('common.roomNumber', { room: room.id })} · {room.type}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t('cilesimet.blocks.kind')} htmlFor={`${id}-kind`}>
          <Select id={`${id}-kind`} value={kind} onChange={(event) => setKind(event.target.value as BlockKind)}>
            {KINDS.map((item) => (
              <option key={item} value={item}>
                {t(`block.${item}`)}
              </option>
            ))}
          </Select>
        </Field>
        <div className={s.dates}>
          <Field label={t('cilesimet.blocks.from')} htmlFor={`${id}-from`}>
            <DatePicker
              id={`${id}-from`}
              label={t('cilesimet.blocks.from')}
              value={startsOn}
              onChange={(value) => {
                setStartsOn(value)
                if (endsOn <= value) setEndsOn(addDaysIso(value, 1))
              }}
            />
          </Field>
          <Field
            label={t('cilesimet.blocks.until')}
            htmlFor={`${id}-until`}
            hint={t('cilesimet.blocks.untilHint')}
            error={nights >= 1 ? undefined : t('reservation.form.datesInvalid')}
          >
            <DatePicker
              id={`${id}-until`}
              label={t('cilesimet.blocks.until')}
              value={endsOn}
              min={addDaysIso(startsOn, 1)}
              align="end"
              onChange={setEndsOn}
            />
          </Field>
        </div>
        {nights >= 1 ? (
          <p className={s.summary}>
            {t('cilesimet.blocks.summary', {
              nights: t('common.night', { count: nights }),
              from: fmtDate(startsOn),
              to: fmtDate(endsOn),
            })}
          </p>
        ) : null}
        <Field label={t('cilesimet.blocks.reason')} htmlFor={`${id}-reason`} optional>
          <Textarea
            id={`${id}-reason`}
            rows={3}
            value={reason}
            placeholder={t('cilesimet.blocks.reasonPlaceholder')}
            onChange={(event) => setReason(event.target.value)}
          />
        </Field>
        {clash.length > 0 ? (
          <Alert tone="danger" title={t('cilesimet.blocks.clashTitle', { room: roomId })}>
            <ul className={s.clashList}>
              {clash.map((item) => (
                <li key={item.id}>
                  {item.guestName} · {fmtDate(item.checkIn)} → {fmtDate(item.checkOut)}
                </li>
              ))}
            </ul>
            {t('cilesimet.blocks.clashHint')}
          </Alert>
        ) : null}
      </form>
    </Sheet>
  )
}
