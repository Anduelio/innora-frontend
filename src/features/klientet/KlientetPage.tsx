import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGuests } from '@/lib/api/guests'
import { EmptyState } from '@/components/ui/EmptyState/EmptyState'
import { Spinner } from '@/components/ui/Spinner/Spinner'
import { GuestFilters } from '@/features/klientet/GuestFilters'
import { GuestRow } from '@/features/klientet/GuestRow'
import s from './KlientetPage.module.scss'

export function KlientetPage() {
  const { t } = useTranslation()
  const guests = useGuests()
  const monthsShort = t('calendar.monthsShort', { returnObjects: true }) as string[]
  const [selected, setSelected] = useState<string[]>([])
  const [withPhone, setWithPhone] = useState(false)
  const [showPhone, setShowPhone] = useState(true)

  const rows = useMemo(() => {
    return (guests.data ?? []).filter((guest) => {
      if (selected.length > 0 && !selected.includes(guest.id)) return false
      if (withPhone && !guest.phone) return false
      return true
    })
  }, [guests.data, selected, withPhone])

  if (guests.isLoading && !guests.data) return <Spinner />
  if (guests.isError) return <EmptyState title={t('common.loadError')} />

  return (
    <div className={s.page}>
      <GuestFilters
        selected={selected}
        onSelected={setSelected}
        withPhone={withPhone}
        onWithPhone={setWithPhone}
        showPhone={showPhone}
        onShowPhone={setShowPhone}
      />
      <ul className={s.list}>
        {rows.map((guest) => (
          <GuestRow key={guest.id} guest={guest} monthsShort={monthsShort} showPhone={showPhone} />
        ))}
      </ul>
    </div>
  )
}
