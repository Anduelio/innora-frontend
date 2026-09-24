import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router'
import { useTranslation } from 'react-i18next'
import { IconPlus } from '@/components/icons'
import { Button } from '@/components/ui/Button/Button'
import { fmtGjate, weekdayIndex } from '@/lib/date/calendar'
import { TODAY } from '@/lib/date/today'
import { useHotelReservations } from '@/lib/api/reservations'
import { useRooms } from '@/lib/api/rooms'
import { coversDay, maxFreeNights } from '@/lib/stay'
import { useUiStore } from '@/store/uiStore'
import s from './Topbar.module.scss'

export function Topbar() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const rooms = useRooms()
  const reservations = useHotelReservations()
  const openCreate = useUiStore((state) => state.openCreate)

  const titleKey = pathname.startsWith('/kalendari')
    ? 'nav.kalendari'
    : pathname.startsWith('/rezervimet')
      ? 'nav.rezervimet'
      : pathname.startsWith('/dhomat')
        ? 'nav.dhomat'
        : pathname.startsWith('/klientet')
          ? 'nav.klientet'
          : pathname.startsWith('/raporte')
            ? 'nav.raporte'
            : pathname.startsWith('/cilesimet')
              ? 'nav.cilesimet'
              : 'nav.permbledhje'

  const weekdays = t('calendar.weekdaysLong', { returnObjects: true }) as string[]
  const months = t('calendar.months', { returnObjects: true }) as string[]
  const occupied = new Set(
    (reservations.data ?? []).filter((item) => coversDay(item, TODAY)).map((item) => item.roomId),
  ).size

  const subtitle =
    pathname === '/'
      ? t('app.weekdayDate', { weekday: weekdays[weekdayIndex(TODAY)] ?? '', date: fmtGjate(TODAY, months) })
      : pathname.startsWith('/kalendari')
        ? t('app.sub.kalendari')
        : pathname.startsWith('/rezervimet')
          ? t('app.sub.rezervimet')
          : pathname.startsWith('/dhomat')
            ? rooms.data
              ? t('app.sub.dhomat', { total: rooms.data.length, occupied })
              : ''
            : pathname.startsWith('/klientet')
              ? t('app.sub.klientet')
              : pathname.startsWith('/raporte')
                ? t('app.sub.raporte')
                : t('app.sub.cilesimet')

  useEffect(() => {
    document.title = `${t(titleKey)} · ${t('app.title')}`
  }, [t, titleKey])

  const openNew = () => {
    const list = reservations.data ?? []
    const roomList = rooms.data ?? []
    const free = roomList.find((room) => !list.some((item) => item.roomId === room.id && coversDay(item, TODAY)))
    const roomId = free?.id ?? roomList[0]?.id ?? '101'
    const max = maxFreeNights(list, roomId, TODAY)
    openCreate({ roomId, checkIn: TODAY, nights: Math.min(2, Math.max(1, max)) })
  }

  return (
    <header className={s.topbar}>
      <div>
        <h1 className={s.title}>{t(titleKey)}</h1>
        <p className={s.sub}>{subtitle}</p>
      </div>
      <div className={s.actions}>
        <NavLink to="/cilesimet" className={s.settings}>
          {t('nav.cilesimet')}
        </NavLink>
        <Button onClick={openNew}>
          <IconPlus width="19" height="19" />
          {t('common.newReservation')}
        </Button>
      </div>
    </header>
  )
}
