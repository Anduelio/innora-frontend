import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/atoms/Button/Button'
import { IconButton } from '@/components/atoms/IconButton/IconButton'
import { IconPlus } from '@/components/atoms/Icon/icons'
import { GuestSearch } from '@/components/organisms/GuestSearch/GuestSearch'
import { SyncPill } from '@/components/organisms/SyncPill/SyncPill'
import { useCurrentUser } from '@/lib/api/auth'
import { addDaysIso, fmtDate, weekdayIndex } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { navKeyFor } from '@/layout/navigation'
import { useUiStore } from '@/store/uiStore'
import s from './Topbar.module.scss'

export function Topbar() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const openCreate = useUiStore((state) => state.openCreate)
  const { can } = useCurrentUser()
  const key = navKeyFor(pathname)
  const weekdays = t('calendar.weekdaysLong', { returnObjects: true }) as string[]
  const today = `${weekdays[weekdayIndex(TODAY)] ?? ''}, ${fmtDate(TODAY)}`
  const subtitle = key === 'sot' ? today : t(`pages.${key}`)

  useEffect(() => {
    document.title = `${t(`nav.${key}`)} · ${t('app.title')}`
  }, [key, t])

  const create = () => openCreate({ checkIn: TODAY, checkOut: addDaysIso(TODAY, 1) })

  return (
    <header className={s.topbar} data-print-hide>
      <div className={s.heading}>
        <h1 className={s.title}>{t(`nav.${key}`)}</h1>
        <p className={s.subtitle}>{subtitle}</p>
      </div>
      <div className={s.search}>
        <GuestSearch />
      </div>
      <div className={s.actions}>
        <SyncPill compact canManage={can('channel.manage')} />
        <Button className={s.newDesktop} icon={<IconPlus size={18} />} onClick={create}>
          {t('common.newReservation')}
        </Button>
        <IconButton className={s.newMobile} variant="secondary" label={t('common.newReservation')} onClick={create}>
          <IconPlus />
        </IconButton>
      </div>
    </header>
  )
}
