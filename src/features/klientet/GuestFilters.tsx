import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox, Dropdown, Switch } from '@/components/ui'
import { Field } from '@/components/ui/Field/Field'
import { fetchGuestPage } from '@/lib/api/guests'
import { useRemoteOptions } from '@/lib/hooks/useRemoteOptions'
import s from './KlientetPage.module.scss'

export function GuestFilters({
  selected,
  onSelected,
  withPhone,
  onWithPhone,
  showPhone,
  onShowPhone,
}: {
  selected: string[]
  onSelected: (value: string[]) => void
  withPhone: boolean
  onWithPhone: (value: boolean) => void
  showPhone: boolean
  onShowPhone: (value: boolean) => void
}) {
  const { t } = useTranslation()
  const remote = useRemoteOptions({
    queryKey: ['guests', 'search'],
    fetchPage: fetchGuestPage,
    mapOption: (guest) => ({ value: guest.id, label: guest.name }),
  })
  const [picked, setPicked] = useState<Record<string, string>>({})

  const options = remote.options.map((option) => ({
    ...option,
    label: picked[option.value] ?? option.label,
  }))
  for (const [value, label] of Object.entries(picked)) {
    if (!options.some((option) => option.value === value)) options.push({ value, label })
  }

  return (
    <div className={s.filters}>
      <Field label={t('nav.klientet')}>
        <Dropdown
          multiple
          searchable
          label={t('nav.klientet')}
          placeholder={t('common.search')}
          searchPlaceholder={t('common.search')}
          emptyLabel={t('common.noResults')}
          loadingLabel={t('common.loading')}
          loadMoreLabel={t('common.loadMore')}
          value={selected}
          options={options}
          searchValue={remote.query}
          onSearchChange={remote.setQuery}
          loading={remote.loading}
          hasMore={remote.hasMore}
          onLoadMore={remote.loadMore}
          onChange={(value) => {
            const next = { ...picked }
            for (const id of value) {
              const match = remote.options.find((option) => option.value === id)
              if (match) next[id] = match.label
            }
            setPicked(next)
            onSelected(value)
          }}
        />
      </Field>
      <div className={s.toggles}>
        <Checkbox label={t('common.withPhone')} checked={withPhone} onChange={(event) => onWithPhone(event.target.checked)} />
        <span className={s.switchLabel}>
          <Switch label={t('common.showPhone')} checked={showPhone} onChange={onShowPhone} />
          {t('common.showPhone')}
        </span>
      </div>
    </div>
  )
}
