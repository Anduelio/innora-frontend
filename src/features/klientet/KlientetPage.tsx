import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDeleteGuest, useGuestBook, useSaveGuest } from '@/lib/api/guests'
import { errorText } from '@/lib/api/client'
import { GUEST_PAGE_SIZES } from '@/lib/guestBook'
import { useDebouncedValue } from '@/lib/hooks/useDebouncedValue'
import { nationalPhone, splitPhone } from '@/lib/phone'
import { useUiStore } from '@/store/uiStore'
import { EmptyState } from '@/components/ui/EmptyState/EmptyState'
import { Spinner } from '@/components/ui/Spinner/Spinner'
import { Button } from '@/components/ui/Button/Button'
import { FilterChip } from '@/components/ui/FilterChip/FilterChip'
import { Pagination } from '@/components/ui/Pagination/Pagination'
import { Field } from '@/components/ui/Field/Field'
import { PhoneField } from '@/components/ui/PhoneField/PhoneField'
import { SearchInput } from '@/components/ui/SearchInput/SearchInput'
import { Switch } from '@/components/ui/Switch/Switch'
import { TextInput } from '@/components/ui/TextInput/TextInput'
import { GuestRow } from '@/features/klientet/GuestRow'
import s from './KlientetPage.module.scss'

export function KlientetPage() {
  const { t } = useTranslation()
  const showToast = useUiStore((state) => state.showToast)
  const monthsShort = t('calendar.monthsShort', { returnObjects: true }) as string[]
  const [query, setQuery] = useState('')
  const [withPhone, setWithPhone] = useState(false)
  const [showPhone, setShowPhone] = useState(true)
  const [pageSize, setPageSize] = useState<number>(GUEST_PAGE_SIZES[0])
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phonePrefix, setPhonePrefix] = useState('+355')
  const [phone, setPhone] = useState('')
  const debouncedQuery = useDebouncedValue(query, 250)
  const filterKey = `${debouncedQuery}|${withPhone}|${pageSize}`
  const [seenFilter, setSeenFilter] = useState(filterKey)
  if (seenFilter !== filterKey) {
    setSeenFilter(filterKey)
    if (page !== 1) setPage(1)
  }

  const book = useGuestBook({ q: debouncedQuery, withPhone, page, pageSize })
  const save = useSaveGuest()
  const remove = useDeleteGuest()
  const columns = showPhone ? 5 : 4

  useEffect(() => {
    if (!editingId) return
    document.getElementById('guest-name')?.focus()
  }, [editingId])

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setPhonePrefix('+355')
    setPhone('')
  }

  const submit = () => {
    if (!name.trim()) {
      showToast([t('form.nameRequired')])
      return
    }
    save.mutate(
      {
        id: editingId ?? undefined,
        name: name.trim(),
        phonePrefix,
        phone: nationalPhone(phone),
      },
      {
        onSuccess: () => {
          showToast([editingId ? t('guest.updated') : t('guest.created')])
          resetForm()
        },
        onError: (error) => showToast([errorText(error, t('toast.failed'))]),
      },
    )
  }

  if (book.isLoading && book.items.length === 0) return <Spinner />
  if (book.isError) {
    return (
      <div className={s.error}>
        <EmptyState title={t('common.loadError')} />
        <Button onClick={() => book.refetch()}>{t('actions.retry')}</Button>
      </div>
    )
  }

  return (
    <div className={s.page}>
      <section className={s.form}>
        <div className={s.formHead}>
          <h2>{editingId ? t('guest.edit') : t('guest.add')}</h2>
          <p>{t('guest.lead')}</p>
        </div>
        <form
          className={s.formGrid}
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <Field label={t('form.name')} htmlFor="guest-name">
            <TextInput id="guest-name" value={name} autoComplete="name" onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label={t('form.phone')} htmlFor="guest-phone">
            <PhoneField
              id="guest-phone"
              prefix={phonePrefix}
              phone={phone}
              onPrefixChange={setPhonePrefix}
              onPhoneChange={setPhone}
            />
          </Field>
          <div className={s.actions}>
            <Button type="submit" disabled={save.isPending}>
              {t('guest.save')}
            </Button>
            {editingId ? (
              <Button variant="secondary" onClick={resetForm}>
                {t('common.cancel')}
              </Button>
            ) : null}
          </div>
        </form>
      </section>

      <div className={s.filters}>
        <SearchInput
          label={t('guest.search')}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <FilterChip label={t('common.withPhone')} selected={withPhone} onClick={() => setWithPhone((value) => !value)} />
        <label className={s.showPhone}>
          <Switch label={t('common.showPhone')} checked={showPhone} onChange={setShowPhone} />
          <span>{t('common.showPhone')}</span>
        </label>
        {book.total != null ? <span className={s.count}>{t('guest.count', { count: book.total })}</span> : null}
      </div>

      <div className={s.tableWrap} aria-busy={book.isFetching}>
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col">{t('guest.columns.name')}</th>
              {showPhone ? <th scope="col">{t('guest.columns.phone')}</th> : null}
              <th scope="col">{t('guest.columns.stays')}</th>
              <th scope="col">{t('guest.columns.last')}</th>
              <th scope="col">
                <span className={s.sr}>{t('guest.columns.actions')}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {book.items.length === 0 ? (
              <tr>
                <td colSpan={columns}>
                  <EmptyState title={t('guest.emptyTitle')} hint={t('guest.emptyHint')} />
                </td>
              </tr>
            ) : (
              book.items.map((guest) => (
                <GuestRow
                  key={guest.id}
                  guest={guest}
                  monthsShort={monthsShort}
                  showPhone={showPhone}
                  editing={guest.id === editingId}
                  actions={
                    <>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          const parts = splitPhone(guest.phonePrefix, guest.phone)
                          setEditingId(guest.id)
                          setConfirmId(null)
                          setName(guest.name)
                          setPhonePrefix(parts.prefix)
                          setPhone(parts.phone)
                        }}
                      >
                        {t('common.edit')}
                      </Button>
                      {guest.stays === 0 ? (
                        <Button
                          variant="danger"
                          onClick={() => {
                            if (confirmId !== guest.id) {
                              setConfirmId(guest.id)
                              return
                            }
                            remove.mutate(guest.id, {
                              onSuccess: () => {
                                showToast([t('guest.deleted')])
                                setConfirmId(null)
                                if (editingId === guest.id) resetForm()
                              },
                              onError: (error) => showToast([errorText(error, t('toast.failed'))]),
                            })
                          }}
                        >
                          {confirmId === guest.id ? t('guest.confirmDelete') : t('common.delete')}
                        </Button>
                      ) : null}
                    </>
                  }
                />
              ))
            )}
          </tbody>
        </table>
        <Pagination
          page={book.page}
          lastPage={book.lastPage}
          pageSize={pageSize}
          pageSizes={GUEST_PAGE_SIZES}
          navLabel={t('guest.pages')}
          pageLabel={t('guest.page', { page: book.page, pages: book.lastPage })}
          previousLabel={t('guest.previous')}
          nextLabel={t('guest.next')}
          pageSizeLabel={t('guest.pageSize')}
          onPage={setPage}
          onPageSize={setPageSize}
        />
      </div>
    </div>
  )
}
