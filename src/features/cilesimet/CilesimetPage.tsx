import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { errorText } from '@/lib/api/client'
import { useHotelSettings, useSaveHotelSettings } from '@/lib/api/rooms'
import { useUiStore } from '@/store/uiStore'
import { ChannelSettingsCard } from '@/features/cilesimet/ChannelSettingsCard'
import { PasswordSettingsCard } from '@/features/cilesimet/PasswordSettingsCard'
import { SyncStatusCard } from '@/features/cilesimet/SyncStatusCard'
import { Button } from '@/components/ui/Button/Button'
import { Field } from '@/components/ui/Field/Field'
import { TextInput } from '@/components/ui/TextInput/TextInput'
import s from './CilesimetPage.module.scss'

export function CilesimetPage() {
  const { t } = useTranslation()
  const settings = useHotelSettings()
  const save = useSaveHotelSettings()
  const showToast = useUiStore((state) => state.showToast)
  const [checkInTime, setCheckInTime] = useState('14:00')
  const [checkOutTime, setCheckOutTime] = useState('11:00')

  useEffect(() => {
    if (!settings.data) return
    setCheckInTime(settings.data.checkInTime)
    setCheckOutTime(settings.data.checkOutTime)
  }, [settings.data])

  const rows = [
    [t('settings.name'), settings.data?.name ?? t('settings.nameValue')],
    [t('settings.city'), settings.data?.city ?? t('settings.cityValue')],
  ] as const

  return (
    <div className={s.page}>
      <section className={s.card}>
        <h2>{t('settings.hotel')}</h2>
        {rows.map(([label, value]) => (
          <div key={label} className={s.row}>
            <span>{label}</span>
            <span>{value}</span>
          </div>
        ))}
        <Field label={t('settings.checkInTime')} htmlFor="hotel-check-in">
          <TextInput id="hotel-check-in" type="time" value={checkInTime} onChange={(event) => setCheckInTime(event.target.value)} />
        </Field>
        <Field label={t('settings.checkOutTime')} htmlFor="hotel-check-out">
          <TextInput id="hotel-check-out" type="time" value={checkOutTime} onChange={(event) => setCheckOutTime(event.target.value)} />
        </Field>
        <Button
          onClick={() =>
            save.mutate(
              { checkInTime: checkInTime.slice(0, 5), checkOutTime: checkOutTime.slice(0, 5) },
              {
                onSuccess: () => showToast([t('settings.hoursSaved')]),
                onError: (error) => showToast([errorText(error, t('toast.failed'))]),
              },
            )
          }
        >
          {t('common.save')}
        </Button>
      </section>
      <PasswordSettingsCard />
      <ChannelSettingsCard />
      <SyncStatusCard />
    </div>
  )
}
