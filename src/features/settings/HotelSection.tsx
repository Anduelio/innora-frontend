import { useId, useMemo, useState } from 'react'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import type { HotelSettings } from '@/types/domain'
import { useHotelSettings, useRoomTypes, useRooms } from '@/lib/api/rooms'
import { useSaveHotel } from '@/lib/api/settings'
import { fmtDate } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { Button } from '@/components/atoms/Button/Button'
import { IconBed, IconBuilding, IconLock, IconUsers } from '@/components/atoms/Icon/icons'
import { Select } from '@/components/atoms/Select/Select'
import { TextInput } from '@/components/atoms/TextInput/TextInput'
import { Alert } from '@/components/molecules/Alert/Alert'
import { Card } from '@/components/molecules/Card/Card'
import { Field } from '@/components/molecules/Field/Field'
import { StatTile } from '@/components/molecules/StatTile/StatTile'
import { useActionError } from '@/features/reservation/useStayActions'
import { CardGrid, CardSpan, SectionShell } from './SectionShell'
import { SectionError, SectionLoading } from './SectionStates'
import s from './HotelSection.module.scss'
import { notify } from '@/lib/notify'

const CURRENCIES = ['EUR', 'ALL'] as const
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

type Draft = Pick<HotelSettings, 'name' | 'city' | 'currency' | 'checkInTime' | 'checkOutTime'>

function HotelForm({ hotel }: { hotel: HotelSettings }) {
  const { t } = useTranslation()
  const id = useId()
  const rooms = useRooms()
  const types = useRoomTypes()
  const save = useSaveHotel()
  const onError = useActionError()
  const saved: Draft = useMemo(
    () => ({
      name: hotel.name,
      city: hotel.city,
      currency: hotel.currency,
      checkInTime: hotel.checkInTime,
      checkOutTime: hotel.checkOutTime,
    }),
    [hotel],
  )
  const [draft, setDraft] = useState<Draft>(saved)
  const [submitted, setSubmitted] = useState(false)
  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((current) => ({ ...current, [key]: value }))

  const dirty = (Object.keys(saved) as (keyof Draft)[]).some((key) => saved[key] !== draft[key])
  const errors = {
    name: draft.name.trim() ? '' : t('cilesimet.hotel.nameRequired'),
    city: draft.city.trim() ? '' : t('cilesimet.hotel.cityRequired'),
    checkIn: TIME.test(draft.checkInTime) ? '' : t('cilesimet.hotel.timeInvalid'),
    checkOut: TIME.test(draft.checkOutTime) ? '' : t('cilesimet.hotel.timeInvalid'),
  }
  const valid = !errors.name && !errors.city && !errors.checkIn && !errors.checkOut
  const activeRooms = (rooms.data ?? []).filter((room) => room.isActive !== false)
  const capacity = activeRooms.reduce((sum, room) => sum + room.capacity, 0)

  const submit = () => {
    setSubmitted(true)
    if (!valid || !dirty) return
    save.mutate(
      { ...draft, name: draft.name.trim(), city: draft.city.trim() },
      {
        onSuccess: () => {
          setSubmitted(false)
          notify.success(t('cilesimet.hotel.saved'))
        },
        onError,
      },
    )
  }

  return (
    <form
      className={s.form}
      noValidate
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <div className={s.tiles}>
        <StatTile label={t('cilesimet.hotel.tiles.rooms')} value={activeRooms.length} icon={<IconBed />} tone="info" />
        <StatTile label={t('cilesimet.hotel.tiles.types')} value={types.data?.length ?? 0} icon={<IconBuilding />} />
        <StatTile
          label={t('cilesimet.hotel.tiles.capacity')}
          value={capacity}
          hint={t('cilesimet.hotel.tiles.capacityHint')}
          icon={<IconUsers />}
        />
      </div>

      <CardGrid>
        <Card title={t('cilesimet.hotel.basics')} description={t('cilesimet.hotel.basicsHint')} icon={<IconBuilding />}>
          <div className={s.grid}>
            <Field label={t('cilesimet.hotel.name')} htmlFor={`${id}-name`} error={submitted ? errors.name : undefined}>
              <TextInput
                id={`${id}-name`}
                value={draft.name}
                invalid={submitted && Boolean(errors.name)}
                onChange={(event) => set('name', event.target.value)}
              />
            </Field>
            <Field label={t('cilesimet.hotel.city')} htmlFor={`${id}-city`} error={submitted ? errors.city : undefined}>
              <TextInput
                id={`${id}-city`}
                value={draft.city}
                invalid={submitted && Boolean(errors.city)}
                onChange={(event) => set('city', event.target.value)}
              />
            </Field>
            <Field
              label={t('cilesimet.hotel.currency')}
              htmlFor={`${id}-currency`}
              hint={t('cilesimet.hotel.currencyHint')}
            >
              <Select
                id={`${id}-currency`}
                value={draft.currency}
                onChange={(event) => set('currency', event.target.value)}
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {t(`cilesimet.hotel.currencies.${currency}`)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {draft.currency !== hotel.currency ? (
            <div className={s.warning}>
              <Alert tone="warning" title={t('cilesimet.hotel.currencyChangeTitle')}>
                {t('cilesimet.hotel.currencyChangeText')}
              </Alert>
            </div>
          ) : null}
        </Card>

        <Card title={t('cilesimet.hotel.times')} description={t('cilesimet.hotel.timesHint')} icon={<IconBed />}>
          <div className={s.grid}>
            <Field
              label={t('cilesimet.hotel.checkIn')}
              htmlFor={`${id}-in`}
              error={submitted ? errors.checkIn : undefined}
            >
              <TextInput
                id={`${id}-in`}
                type="time"
                step={900}
                value={draft.checkInTime}
                invalid={submitted && Boolean(errors.checkIn)}
                onChange={(event) => set('checkInTime', event.target.value)}
              />
            </Field>
            <Field
              label={t('cilesimet.hotel.checkOut')}
              htmlFor={`${id}-out`}
              error={submitted ? errors.checkOut : undefined}
            >
              <TextInput
                id={`${id}-out`}
                type="time"
                step={900}
                value={draft.checkOutTime}
                invalid={submitted && Boolean(errors.checkOut)}
                onChange={(event) => set('checkOutTime', event.target.value)}
              />
            </Field>
          </div>
          <p className={s.preview}>
            {t('cilesimet.hotel.preview', {
              checkIn: draft.checkInTime || '—',
              checkOut: draft.checkOutTime || '—',
            })}
          </p>
        </Card>

        <CardSpan>
          <Card
            title={t('cilesimet.hotel.fixedTitle')}
            description={t('cilesimet.hotel.fixedHint')}
            icon={<IconLock />}
          >
            <dl className={s.fixed}>
              <div>
                <dt>{t('cilesimet.hotel.timezone')}</dt>
                <dd>{t('cilesimet.hotel.timezoneValue', { zone: hotel.timezone })}</dd>
              </div>
              <div>
                <dt>{t('cilesimet.hotel.dateFormat')}</dt>
                <dd>{t('cilesimet.hotel.dateFormatValue', { example: fmtDate(TODAY) })}</dd>
              </div>
              <div>
                <dt>{t('cilesimet.hotel.weekStart')}</dt>
                <dd>{t('cilesimet.hotel.weekStartValue')}</dd>
              </div>
              <div>
                <dt>{t('cilesimet.hotel.nights')}</dt>
                <dd>{t('cilesimet.hotel.nightsValue')}</dd>
              </div>
            </dl>
          </Card>
        </CardSpan>
      </CardGrid>

      <div className={s.bar} data-dirty={dirty || undefined} aria-live="polite">
        <span className={clsx(s.barText, dirty && s.barTextDirty)}>
          {dirty ? t('cilesimet.unsaved') : t('cilesimet.allSaved')}
        </span>
        <Button
          variant="ghost"
          disabled={!dirty || save.isPending}
          onClick={() => {
            setDraft(saved)
            setSubmitted(false)
          }}
        >
          {t('cilesimet.discard')}
        </Button>
        <Button type="submit" size="lg" disabled={!dirty} loading={save.isPending}>
          {t('cilesimet.saveChanges')}
        </Button>
      </div>
    </form>
  )
}

export function HotelSection() {
  const hotel = useHotelSettings()
  const { t } = useTranslation()
  const title = t('cilesimet.sections.hoteli')
  return (
    <SectionShell section="hoteli">
      {hotel.isPending ? (
        <SectionLoading title={title} rows={6} />
      ) : hotel.isError ? (
        <SectionError title={title} onRetry={() => void hotel.refetch()} />
      ) : (
        <HotelForm key={JSON.stringify(hotel.data)} hotel={hotel.data} />
      )}
    </SectionShell>
  )
}
