import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { errorText } from '@/lib/api/client'
import { useHotelSettings, useSaveHotelSettings } from '@/lib/api/rooms'
import { useUiStore } from '@/store/uiStore'
import { ChannelSettingsCard } from '@/features/cilesimet/ChannelSettingsCard'
import { PasswordSettingsCard } from '@/features/cilesimet/PasswordSettingsCard'
import { Button } from '@/components/ui/Button/Button'
import { DateField } from '@/components/ui/DateField/DateField'
import { Dropdown } from '@/components/ui/Dropdown/Dropdown'
import { Field } from '@/components/ui/Field/Field'
import s from './CilesimetPage.module.scss'

export function CilesimetPage() {
  const { t } = useTranslation()
  const settings = useHotelSettings()
  const save = useSaveHotelSettings()
  const showToast = useUiStore((state) => state.showToast)
  const [checkInTime, setCheckInTime] = useState('14:00')
  const [checkOutTime, setCheckOutTime] = useState('11:00')
  const [currency, setCurrency] = useState('EUR')

  useEffect(() => {
    if (!settings.data) return
    setCheckInTime(settings.data.checkInTime)
    setCheckOutTime(settings.data.checkOutTime)
    setCurrency(settings.data.currency === 'ALL' ? 'ALL' : 'EUR')
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
        <Field label={t('settings.currency')} htmlFor="hotel-currency">
          <Dropdown
            id="hotel-currency"
            label={t('settings.currency')}
            value={currency}
            options={[
              { value: 'EUR', label: t('settings.eur') },
              { value: 'ALL', label: t('settings.all') },
            ]}
            onChange={setCurrency}
          />
        </Field>
        <Field label={t('settings.checkInTime')} htmlFor="hotel-check-in">
          <DateField id="hotel-check-in" mode="time" value={checkInTime} onChange={setCheckInTime} />
        </Field>
        <Field label={t('settings.checkOutTime')} htmlFor="hotel-check-out">
          <DateField id="hotel-check-out" mode="time" value={checkOutTime} onChange={setCheckOutTime} />
        </Field>
        <Button
          spaced
          onClick={() =>
            save.mutate(
              { checkInTime: checkInTime.slice(0, 5), checkOutTime: checkOutTime.slice(0, 5), currency },
              {
                onSuccess: () => showToast([t('settings.saved')]),
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
    </div>
  )
}
