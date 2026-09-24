import { useTranslation } from 'react-i18next'
import { useGuests } from '@/lib/api/guests'
import { EmptyState } from '@/components/ui/EmptyState/EmptyState'
import { Spinner } from '@/components/ui/Spinner/Spinner'
import { GuestRow } from '@/features/klientet/GuestRow'
import s from './KlientetPage.module.scss'

export function KlientetPage() {
  const { t } = useTranslation()
  const guests = useGuests()
  const monthsShort = t('calendar.monthsShort', { returnObjects: true }) as string[]

  if (guests.isLoading && !guests.data) return <Spinner />
  if (guests.isError) return <EmptyState title={t('common.loadError')} />

  return (
    <ul className={s.list}>
      {(guests.data ?? []).map((guest) => (
        <GuestRow key={guest.id} guest={guest} monthsShort={monthsShort} />
      ))}
    </ul>
  )
}
